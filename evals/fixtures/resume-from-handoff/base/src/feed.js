import { escapeXml } from './xml.js';

export function renderItem(episode) {
  return `    <item>
      <title>${escapeXml(episode.title)}</title>
      <guid isPermaLink="false">${escapeXml(episode.id)}</guid>
      <pubDate>${new Date(episode.publishedAt).toUTCString()}</pubDate>
      <enclosure url="${escapeXml(episode.audioUrl)}" type="audio/mpeg" length="${episode.sizeBytes}"/>
    </item>`;
}

export function renderFeed(show, episodes) {
  const ordered = [...episodes].sort(
    (a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || new Date(b.publishedAt) - new Date(a.publishedAt),
  );
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>${escapeXml(show.title)}</title>
    <link>${escapeXml(show.url)}</link>
    <description>${escapeXml(show.description)}</description>
${ordered.map(renderItem).join('\n')}
  </channel>
</rss>
`;
}
