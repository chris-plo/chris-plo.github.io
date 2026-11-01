export const journalTopics: Record<string, string> = {
  "software-engineering": "Software engineering",
  "artificial-intelligence": "Artificial intelligence",
  "distributed-systems": "Distributed systems",
  "technical-leadership": "Technical leadership",
  search: "Search",
  career: "Career",
  "science-and-culture": "Science and culture",
  "life-beyond-code": "Life beyond code"
};

export function getJournalTopicLabel(topic: string) {
  return journalTopics[topic] ?? topic;
}
