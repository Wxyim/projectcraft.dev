import type { APIRoute } from 'astro';
import { collectionLabel, getAllPublishedEntries, getEntryUrl } from '@/utils/content';

export const GET: APIRoute = async () => {
  const entries = await getAllPublishedEntries();
  const items = await Promise.all(entries.map(async (entry) => {
    return {
      title: entry.data.title,
      description: entry.data.description,
      body: entry.body ?? '',
      url: getEntryUrl(entry),
      collection: collectionLabel(entry.collection),
      tags: entry.data.tags,
      date: entry.data.pubDate.toISOString().slice(0, 10)
    };
  }));

  return new Response(JSON.stringify(items), {
    headers: {
      'content-type': 'application/json; charset=utf-8'
    }
  });
};
