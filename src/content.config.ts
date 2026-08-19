import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const editorial = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/editorial' }),
  schema: z.object({ title:z.string(), description:z.string(), category:z.enum(['Review','Technical Article']), date:z.coerce.date(), image:z.string().optional(), featured:z.boolean().default(false), tags:z.array(z.string()).default([]) })
});
const encyclopedia = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/encyclopedia' }),
  schema: z.object({ title:z.string(), description:z.string(), letter:z.string(), category:z.string(), aliases:z.array(z.string()).default([]) })
});
export const collections = { editorial, encyclopedia };
