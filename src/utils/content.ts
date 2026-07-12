import { getCollection, type CollectionEntry } from 'astro:content';
import { collections as collectionMeta } from '@/config/site';

export type CollectionName = keyof typeof collectionMeta;
export type AnyEntry = CollectionEntry<CollectionName>;

export const collectionNames = Object.keys(collectionMeta) as CollectionName[];

export async function getPublishedCollection(collection: CollectionName) {
  const entries = await getCollection(collection, ({ data }) => !data.draft);
  return entries.sort((a, b) => {
    const d = b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
    if (d !== 0) return d;
    const ua = a.data.updatedDate?.valueOf() ?? 0;
    const ub = b.data.updatedDate?.valueOf() ?? 0;
    return ub - ua;
  });
}

export async function getAllPublishedEntries() {
  const groups = await Promise.all(collectionNames.map(async (collection) => getPublishedCollection(collection)));
  return groups.flat().sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function getEntryUrl(entry: AnyEntry) {
  return `/${entry.collection}/${entry.id}/`;
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

export function collectionLabel(collection: CollectionName) {
  return collectionMeta[collection].title;
}

/** Match a related reference (slug or collection/slug) to an entry. */
function matchRelated(ref: string, entry: AnyEntry): boolean {
  const full = `${entry.collection}/${entry.id}`;
  return ref === entry.id || ref === full;
}

/** Get entries explicitly listed in the entry's `related` field (preserves writing order). */
export function getExplicitRelated(entry: AnyEntry, all: AnyEntry[]): AnyEntry[] {
  const refs = entry.data.related ?? [];
  return refs
    .map((r) => all.find((e) => e.id !== entry.id && matchRelated(r, e)))
    .filter(Boolean) as AnyEntry[];
}

/** Get entries that share tags with this entry (sorted by overlap count). */
export function getTagRelated(entry: AnyEntry, all: AnyEntry[], limit = 6): AnyEntry[] {
  const tags = new Set(entry.data.tags);
  if (tags.size === 0) return [];
  return all
    .filter((e) => e.id !== entry.id)
    .map((e) => ({
      entry: e,
      overlap: e.data.tags.filter((t) => tags.has(t)).length
    }))
    .filter(({ overlap }) => overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, limit)
    .map(({ entry }) => entry);
}

/** Get upstream entries (those that list this entry in their `related` field). */
export function getUpstream(entry: AnyEntry, all: AnyEntry[]): AnyEntry[] {
  return all.filter((e) => {
    if (e.id === entry.id) return false;
    return (e.data.related ?? []).some((r) => matchRelated(r, entry));
  });
}

/** Build a tag tree: { tag: entries[] } sorted by entry count. */
export function buildTagTree(entries: AnyEntry[]): { tag: string; entries: AnyEntry[] }[] {
  const map = new Map<string, AnyEntry[]>();
  for (const entry of entries) {
    const primaryTag = entry.data.tags[0];
    if (!primaryTag) continue;
    if (!map.has(primaryTag)) map.set(primaryTag, []);
    map.get(primaryTag)!.push(entry);
  }
  return Array.from(map.entries())
    .map(([tag, entries]) => ({ tag, entries }))
    .sort((a, b) => b.entries.length - a.entries.length);
}
