import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const baseSchema = z.object({
  title: z.string(),
  description: z.string().default(''),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  draft: z.boolean().default(false),
  featured: z.boolean().default(false),
  order: z.number().optional(),
  tags: z.array(z.string()).default([]),
  related: z.array(z.string()).default([]),
  image: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional()
});

const gardenSchema = baseSchema.extend({
  status: z.enum(['seedling', 'budding', 'evergreen']).default('seedling')
});

export const collections = {
  projects: defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
    schema: baseSchema
  }),
  notes: defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/notes' }),
    schema: baseSchema
  }),
  articles: defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
    schema: baseSchema
  }),
  resources: defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/resources' }),
    schema: baseSchema
  }),
  weekly: defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/weekly' }),
    schema: baseSchema
  }),
  garden: defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/garden' }),
    schema: gardenSchema
  })
};
