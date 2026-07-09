import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { site } from '@/config/site';
import { getAllPublishedEntries, getEntryUrl } from '@/utils/content';

export async function GET(context: APIContext) {
  const entries = await getAllPublishedEntries();

  return rss({
    title: site.title,
    description: site.description,
    site: context.site ?? site.url,
    items: entries.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.pubDate,
      link: getEntryUrl(entry)
    }))
  });
}
