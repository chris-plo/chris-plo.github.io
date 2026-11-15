import test from "node:test";
import assert from "node:assert/strict";
import {
  createPendingCampaign,
  findNewArticles,
  parseRss,
  renderDigestHtml,
  sendPendingCampaign
} from "../scripts/newsletter-digest.mjs";

const now = new Date("2026-11-16T09:00:00.000Z");
const articles = [
  { id: "https://chrisplo.dev/journal/first/", url: "https://chrisplo.dev/journal/first/", title: "First idea", description: "A short note.", published: "2026-11-15T09:00:00.000Z", image: "https://chrisplo.dev/images/journal/first.jpg" },
  { id: "https://chrisplo.dev/journal/second/", url: "https://chrisplo.dev/journal/second/", title: "Second idea", description: "Another short note.", published: "2026-11-14T09:00:00.000Z" }
];

test("parses RSS articles, descriptions, dates and image enclosures", () => {
  const feed = `<rss><channel><item><title>First idea</title><link>${articles[0].url}</link><guid>${articles[0].url}</guid><description>&lt;p&gt;A short note &amp;amp; more.&lt;/p&gt;</description><pubDate>Sun, 15 Nov 2026 09:00:00 GMT</pubDate><enclosure url="${articles[0].image}" length="42" type="image/jpeg" /></item></channel></rss>`;
  const [parsed] = parseRss(feed);
  assert.equal(parsed.title, "First idea");
  assert.equal(parsed.description, "A short note & more.");
  assert.equal(parsed.published, "2026-11-15T09:00:00.000Z");
  assert.equal(parsed.image, articles[0].image);
});

test("selects unprocessed, non-future articles and honors the optional first-run baseline", () => {
  const list = [
    ...articles,
    { ...articles[0], url: "https://chrisplo.dev/journal/future/", published: "2026-11-17T09:00:00.000Z" },
    { ...articles[0], url: "https://chrisplo.dev/journal/old/", published: "2026-11-10T09:00:00.000Z" }
  ];
  const state = { lastSuccessfulDigestAt: "2026-11-12T00:00:00.000Z", processedArticleUrls: [articles[1].url] };
  assert.deepEqual(findNewArticles(list, state, now).map(({ url }) => url), [articles[0].url, "https://chrisplo.dev/journal/old/"]);
  assert.deepEqual(findNewArticles(list, { initialBaselineAt: "2026-11-16T10:00:00Z" }, now), []);
});

test("renders multiple articles in source order with concise links and unsubscribe footer", () => {
  const html = renderDigestHtml(articles);
  assert.ok(html.indexOf("First idea") < html.indexOf("Second idea"));
  assert.match(html, /A short note\./);
  assert.match(html, /https:\/\/chrisplo\.dev\/images\/journal\/first\.jpg/);
  assert.match(html, /href="\{\{ unsubscribe_link \}\}"/);
  assert.match(html, /\{\{ account\.address \}\}/);
  assert.doesNotMatch(html, /<script\b/i);
});

test("empty weeks produce no pending campaign or API call", async () => {
  let requests = 0;
  const state = { processedArticleUrls: [], lastSuccessfulDigestAt: null, pendingCampaign: null };
  const result = await createPendingCampaign({ state, articles: [], config: {}, fetchImpl: async () => { requests++; } });
  assert.equal(result.action, "empty");
  assert.equal(requests, 0);
  assert.deepEqual(findNewArticles([], state, now), []);
});

test("campaign creation targets exactly the configured group and only records pending articles", async () => {
  let payload;
  const state = { processedArticleUrls: [], lastSuccessfulDigestAt: null, pendingCampaign: null };
  const result = await createPendingCampaign({
    state, articles, now,
    config: { token: "test-token", groupId: "blog-group", fromName: "Chris", replyTo: "hello@chrisplo.dev" },
    fetchImpl: async (_url, request) => {
      payload = JSON.parse(request.body);
      return Response.json({ success: true, data: { id: "campaign-1", campaign_groups: ["blog-group"], segments: [], send_to_all: null } });
    }
  });
  assert.deepEqual(payload.groups, ["blog-group"]);
  assert.equal(payload.content_type, "html");
  assert.match(payload.content, /\{\{ unsubscribe_link \}\}/);
  assert.equal(result.state.pendingCampaign.id, "campaign-1");
  assert.deepEqual(result.state.processedArticleUrls, []);
  assert.equal(result.state.lastSuccessfulDigestAt, null);
  assert.equal(state.pendingCampaign, null);
});

test("failed send does not advance persistent state", async () => {
  const state = {
    lastSuccessfulDigestAt: null,
    processedArticleUrls: [],
    pendingCampaign: { id: "campaign-1", groupId: "blog-group", articleUrls: [articles[0].url], newestPublishedAt: articles[0].published }
  };
  await assert.rejects(sendPendingCampaign({
    state, now,
    config: { token: "test-token", groupId: "blog-group" },
    fetchImpl: async (url, request) => request.method === "GET"
      ? Response.json({ data: { id: "campaign-1", status: "DRAFT", campaign_groups: ["blog-group"], segments: [] } })
      : new Response("", { status: 503 })
  }), /HTTP 503/);
  assert.equal(state.lastSuccessfulDigestAt, null);
  assert.deepEqual(state.processedArticleUrls, []);
  assert.equal(state.pendingCampaign.id, "campaign-1");
});

test("successful send advances state and retry of an already-sent campaign does not send twice", async () => {
  const state = {
    lastSuccessfulDigestAt: null,
    processedArticleUrls: [],
    pendingCampaign: { id: "campaign-1", groupId: "blog-group", articleUrls: articles.map(({ url }) => url), newestPublishedAt: articles[0].published }
  };
  let postCount = 0;
  const response = await sendPendingCampaign({
    state, now,
    config: { token: "test-token", groupId: "blog-group" },
    fetchImpl: async (url, request) => {
      if (request.method === "POST") { postCount++; return Response.json({ success: true, message: "Campaign started to send" }); }
      return Response.json({ data: { id: "campaign-1", status: "DRAFT", campaign_groups: ["blog-group"], segments: [] } });
    }
  });
  assert.equal(response.action, "sent");
  assert.equal(response.state.lastSuccessfulDigestAt, now.toISOString());
  assert.deepEqual(response.state.processedArticleUrls, articles.map(({ url }) => url));
  assert.equal(response.state.pendingCampaign, null);
  assert.equal(postCount, 1);

  let retryPosts = 0;
  const retry = await sendPendingCampaign({
    state: { ...response.state, pendingCampaign: { id: "campaign-1", groupId: "blog-group", articleUrls: articles.map(({ url }) => url) } },
    now: new Date("2026-11-16T09:05:00.000Z"),
    config: { token: "test-token", groupId: "blog-group" },
    fetchImpl: async (_url, request) => {
      if (request.method === "POST") retryPosts++;
      return Response.json({ data: { id: "campaign-1", status: "SENT", campaign_groups: ["blog-group"], segments: [] } });
    }
  });
  assert.equal(retry.action, "sent");
  assert.equal(retryPosts, 0);
});

test("refuses to send when Sender reports a different audience", async () => {
  const state = { pendingCampaign: { id: "campaign-1", groupId: "blog-group", articleUrls: [] }, processedArticleUrls: [] };
  let sent = false;
  await assert.rejects(sendPendingCampaign({
    state,
    config: { token: "test-token", groupId: "blog-group" },
    fetchImpl: async (_url, request) => {
      if (request.method === "POST") sent = true;
      return Response.json({ data: { id: "campaign-1", status: "DRAFT", campaign_groups: ["other-group"], segments: [] } });
    }
  }), /recipient group did not match/);
  assert.equal(sent, false);
});
