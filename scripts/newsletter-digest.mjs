import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const DEFAULT_FEED_URL = "https://chrisplo.dev/rss.xml";
export const CAMPAIGN_SUBJECT = "New ideas to explore — this week";
const DEFAULT_STATE_PATH = "newsletter/state.json";
const DEFAULT_PREVIEW_PATH = ".newsletter-preview.html";

function decodeXml(value = "") {
  return value
    .replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1")
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function xmlText(itemXml, tag) {
  const match = itemXml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1]).trim() : "";
}

function stripHtml(value) {
  const text = value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return decodeXml(text);
}

export function parseRss(xml) {
  const items = [];
  for (const match of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const source = match[1];
    const link = xmlText(source, "link");
    const guid = xmlText(source, "guid");
    const title = stripHtml(xmlText(source, "title"));
    const description = stripHtml(xmlText(source, "description"));
    const published = new Date(xmlText(source, "pubDate"));
    const enclosure = source.match(/<enclosure\b([^>]*)\/?\s*>/i)?.[1] ?? "";
    const imageUrl = enclosure.match(/\burl=["']([^"']+)["']/i)?.[1] ?? "";
    const imageType = enclosure.match(/\btype=["']([^"']+)["']/i)?.[1] ?? "";
    if (!title || !link || !Number.isFinite(published.getTime())) continue;
    items.push({
      id: guid || link,
      url: link,
      title,
      description,
      published: published.toISOString(),
      image: imageType.startsWith("image/") ? imageUrl : undefined
    });
  }
  return items;
}

export function findNewArticles(items, state, now = new Date()) {
  const processed = new Set(state.processedArticleUrls ?? []);
  // The processed URL set is the durable delivery boundary. Do not use the
  // previous run timestamp as a hard cutoff: a delayed RSS item must not be lost.
  const digestCutoffs = [state.initialBaselineAt]
    .filter(Boolean)
    .map((date) => Date.parse(date))
    .filter(Number.isFinite);
  const lastDigestAt = digestCutoffs.length ? Math.max(...digestCutoffs) : Number.NEGATIVE_INFINITY;
  const nowMs = now.getTime();
  const seen = new Set();
  return items.filter((article) => {
    const publishedAt = Date.parse(article.published);
    if (!article.url || !Number.isFinite(publishedAt) || publishedAt > nowMs || publishedAt <= lastDigestAt) return false;
    if (processed.has(article.url) || seen.has(article.url)) return false;
    seen.add(article.url);
    return true;
  });
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export function renderDigestHtml(articles) {
  const articleMarkup = articles.map((article) => {
    const image = article.image
      ? `<p style="margin:0 0 18px"><a href="${escapeHtml(article.url)}"><img src="${escapeHtml(article.image)}" alt="" width="560" style="display:block;width:100%;max-width:560px;height:auto;border:0"></a></p>`
      : "";
    const description = article.description ? `<p style="margin:0 0 12px;color:#66685f;font:16px/1.65 Arial,Helvetica,sans-serif">${escapeHtml(article.description)}</p>` : "";
    return `<tr><td style="padding:24px 0;border-top:1px solid #d8d8ce">${image}<p style="margin:0 0 7px;color:#66685f;font:12px/1.5 Arial,Helvetica,sans-serif">${escapeHtml(formatDate(article.published))}</p><h2 style="margin:0 0 10px;color:#20221f;font:normal 25px/1.2 Georgia,'Times New Roman',serif"><a href="${escapeHtml(article.url)}" style="color:#a4513f;text-decoration:none">${escapeHtml(article.title)}</a></h2>${description}<p style="margin:0;font:15px/1.5 Arial,Helvetica,sans-serif"><a href="${escapeHtml(article.url)}" style="color:#a4513f;text-decoration:underline">Read the article →</a></p></td></tr>`;
  }).join("\n");

  const emptyState = articles.length ? "" : `<tr><td style="padding:24px 0;border-top:1px solid #d8d8ce;color:#66685f;font:16px/1.6 Arial,Helvetica,sans-serif">There are no new articles in this preview. Nothing will be sent for an empty week.</td></tr>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Ideas Are Better When They Travel.</title></head><body style="margin:0;padding:0;background:#f4f3ed"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">A short note when new articles are published.</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f3ed"><tr><td align="center" style="padding:28px 14px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px"><tr><td style="padding:24px 0 18px;border-bottom:1px solid #d8d8ce"><p style="margin:0;color:#a4513f;font:11px/1.5 Arial,Helvetica,sans-serif;letter-spacing:2px;text-transform:uppercase">Ideas Are Better When They Travel.</p></td></tr><tr><td style="padding:26px 0 12px"><h1 style="margin:0 0 12px;color:#20221f;font:normal 30px/1.15 Georgia,'Times New Roman',serif">A little curiosity, delivered.</h1><p style="margin:0;color:#66685f;font:16px/1.65 Arial,Helvetica,sans-serif">Hello,</p><p style="margin:8px 0 0;color:#66685f;font:16px/1.65 Arial,Helvetica,sans-serif">Here are the latest ideas published on Ideas Are Better When They Travel.</p></td></tr>${articleMarkup || emptyState}<tr><td style="padding:22px 0;border-top:1px solid #d8d8ce;color:#66685f;font:14px/1.7 Arial,Helvetica,sans-serif"><p style="margin:0 0 12px">Thanks for reading,<br>Chris</p><p style="margin:0 0 10px">You are receiving this because you confirmed a subscription to new article digests.</p><p style="margin:0 0 10px"><a href="{{ unsubscribe_link }}" style="color:#a4513f">{{ unsubscribe_text }}</a></p><p style="margin:0">{{ account.address }}, {{ account.city }}, {{ account.country }}</p><p style="margin:10px 0 0;font-size:11px">Powered by Sender.net</p></td></tr></table></td></tr></table></body></html>`;
}

function assertGroupOnly(campaign, groupId) {
  const groups = campaign?.campaign_groups;
  const segments = campaign?.segments ?? [];
  if (!Array.isArray(groups) || groups.length !== 1 || String(groups[0]) !== String(groupId)) {
    throw new Error("Sender campaign recipient group did not match the configured Blog subscribers group; refusing to send.");
  }
  if (segments.length !== 0 || campaign?.send_to_all === true || campaign?.send_to_all === 1) {
    throw new Error("Sender campaign includes an unexpected audience; refusing to send.");
  }
}

async function senderRequest(path, { token, fetchImpl = fetch, method = "GET", body } = {}) {
  if (!token) throw new Error("SENDER_API_TOKEN is required for live sending.");
  let response;
  try {
    response = await fetchImpl(`https://api.sender.net/v2${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(30_000)
    });
  } catch {
    throw new Error(`Sender API request failed (${method} ${path}); the result may be uncertain. The pending campaign is retained for safe recovery.`);
  }
  let result;
  try { result = await response.json(); } catch { result = undefined; }
  if (!response.ok) throw new Error(`Sender API returned HTTP ${response.status} for ${method} ${path}. Pending state was not advanced.`);
  return result;
}

export async function createPendingCampaign({ state, articles, config, fetchImpl = fetch, now = new Date() }) {
  if (!articles.length) return { state, action: "empty" };
  const { token, groupId, fromName, replyTo } = config;
  if (!token || !groupId || !fromName || !replyTo) throw new Error("Live sending requires the Sender token, Blog subscribers group ID, verified sender name, and reply-to address.");
  const html = renderDigestHtml(articles);
  const created = await senderRequest("/campaigns", {
    token, fetchImpl, method: "POST",
    body: {
      title: `Weekly journal digest — ${now.toISOString().slice(0, 10)}`,
      subject: CAMPAIGN_SUBJECT,
      from: fromName,
      reply_to: replyTo,
      preheader: "A short note when new articles are published.",
      content_type: "html",
      google_analytics: 0,
      auto_followup_active: false,
      groups: [groupId],
      content: html
    }
  });
  const campaign = created?.data;
  if (created?.success !== true || !campaign?.id) throw new Error("Sender did not confirm campaign creation; no state was advanced.");
  assertGroupOnly(campaign, groupId);
  const nextState = structuredClone(state);
  nextState.pendingCampaign = {
    id: String(campaign.id),
    groupId: String(groupId),
    articleUrls: articles.map((article) => article.url),
    newestPublishedAt: articles.reduce((latest, article) => article.published > latest ? article.published : latest, articles[0].published),
    createdAt: now.toISOString()
  };
  return { state: nextState, action: "pending", campaignId: String(campaign.id) };
}

export async function sendPendingCampaign({ state, config, fetchImpl = fetch, now = new Date() }) {
  const pending = state.pendingCampaign;
  if (!pending) return { state, action: "empty" };
  const { token, groupId } = config;
  if (!token || !groupId || String(groupId) !== String(pending.groupId)) throw new Error("Sender token and the same configured group ID are required to resume this pending campaign.");
  const detailResponse = await senderRequest(`/campaigns/${encodeURIComponent(pending.id)}`, { token, fetchImpl });
  const campaign = detailResponse?.data;
  if (!campaign || String(campaign.id) !== String(pending.id)) throw new Error("Sender returned no matching campaign; pending state was retained.");
  assertGroupOnly(campaign, groupId);

  if (campaign.status === "DRAFT") {
    const result = await senderRequest(`/campaigns/${encodeURIComponent(pending.id)}/send`, { token, fetchImpl, method: "POST" });
    if (result?.success !== true) throw new Error("Sender did not confirm that sending started; pending state was retained.");
  } else if (campaign.status !== "SENT") {
    throw new Error(`Sender campaign is in status ${String(campaign.status)}; refusing to retry until its status is clear. Pending state was retained.`);
  }

  const processed = new Set(state.processedArticleUrls ?? []);
  pending.articleUrls.forEach((url) => processed.add(url));
  const nextState = structuredClone(state);
  nextState.lastSuccessfulDigestAt = now.toISOString();
  nextState.processedArticleUrls = [...processed];
  nextState.lastCampaignId = String(pending.id);
  nextState.pendingCampaign = null;
  return { state: nextState, action: "sent", campaignId: String(pending.id) };
}

function appendGithubOutput(key, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  return writeFile(process.env.GITHUB_OUTPUT, `${key}=${value}\n`, { flag: "a" });
}

async function loadState(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function persistState(path, state) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function getArticles(state, fetchImpl = fetch) {
  const feedUrl = process.env.NEWSLETTER_RSS_URL || DEFAULT_FEED_URL;
  let response;
  try { response = await fetchImpl(feedUrl, { headers: { Accept: "application/rss+xml, application/xml, text/xml" }, signal: AbortSignal.timeout(30_000) }); }
  catch { throw new Error("Could not retrieve the production RSS feed; no campaign or state was changed."); }
  if (!response.ok) throw new Error(`Production RSS feed returned HTTP ${response.status}; no campaign or state was changed.`);
  const items = parseRss(await response.text());
  return findNewArticles(items, state);
}

async function writePreview(articles) {
  const output = resolve(process.env.NEWSLETTER_PREVIEW_PATH || DEFAULT_PREVIEW_PATH);
  await writeFile(output, renderDigestHtml(articles), "utf8");
  console.log(`Preview created with ${articles.length} article(s): ${output}`);
  articles.forEach((article) => console.log(`Preview article: ${article.title}`));
  await appendGithubOutput("action", "preview");
}

async function main() {
  const mode = process.argv[2];
  const statePath = resolve(process.env.NEWSLETTER_STATE_PATH || DEFAULT_STATE_PATH);
  const state = await loadState(statePath);

  if (mode === "preview") {
    await writePreview(await getArticles(state));
    return;
  }

  if (mode === "prepare") {
    if (state.pendingCampaign) {
      console.log(`A pending Sender campaign (${state.pendingCampaign.id}) will be checked and resumed; no new campaign will be created.`);
      await appendGithubOutput("action", "pending");
      return;
    }
    const articles = await getArticles(state);
    if (process.env.NEWSLETTER_MODE !== "send") {
      if (!articles.length) console.log("No new articles since the last successful digest; preview contains the empty-week message.");
      await writePreview(articles);
      return;
    }
    if (!articles.length) {
      console.log("No new articles since the last successful digest; nothing to send.");
      await appendGithubOutput("action", "empty");
      return;
    }
    const result = await createPendingCampaign({
      state,
      articles,
      config: {
        token: process.env.SENDER_API_TOKEN,
        groupId: process.env.SENDER_GROUP_ID,
        fromName: process.env.SENDER_FROM_NAME,
        replyTo: process.env.SENDER_REPLY_TO
      }
    });
    await persistState(statePath, result.state);
    console.log(`Campaign ${result.campaignId} created for ${articles.length} article(s). Its pending record must be committed before sending.`);
    await appendGithubOutput("action", "pending");
    return;
  }

  if (mode === "send-pending") {
    const result = await sendPendingCampaign({
      state,
      config: { token: process.env.SENDER_API_TOKEN, groupId: process.env.SENDER_GROUP_ID }
    });
    await persistState(statePath, result.state);
    if (result.action === "sent") console.log(`Sender confirmed campaign ${result.campaignId}; recorded ${result.state.processedArticleUrls.length} processed article URL(s).`);
    await appendGithubOutput("action", result.action);
    return;
  }

  throw new Error("Usage: node scripts/newsletter-digest.mjs preview | prepare | send-pending");
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : "Newsletter workflow failed.");
    process.exitCode = 1;
  });
}
