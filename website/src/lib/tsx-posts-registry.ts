/**
 * TSX blog post registry.
 *
 * To add a new TSX blog post:
 *   1. Create your component, e.g. src/components/blog-posts/MyPost.tsx
 *   2. Import it here and add an entry to `tsxPostsRegistry`.
 *
 * The registry key is the URL slug (e.g. "my-post" → /blog/my-post).
 *
 * Example:
 *   import MyPost from "@/components/blog-posts/MyPost";
 *
 *   export const tsxPostsRegistry: Record<string, TsxPostEntry> = {
 *     "my-post": {
 *       meta: {
 *         title: "My Post",
 *         date: "2025-01-01",
 *         excerpt: "A short summary",
 *         slug: "my-post",
 *         type: "tsx",
 *       },
 *       Component: MyPost,
 *     },
 *   };
 */

import type { ComponentType } from "react";
import type { PostMeta } from "./posts";

export type TsxPostEntry = {
  meta: PostMeta;
  Component: ComponentType;
};

export const tsxPostsRegistry: Record<string, TsxPostEntry> = {};

export function getTsxPostMetas(): PostMeta[] {
  return Object.values(tsxPostsRegistry).map((e) => ({
    ...e.meta,
    type: "tsx" as const,
  }));
}

export function getTsxPostSlugs(): string[] {
  return Object.keys(tsxPostsRegistry);
}

export function getTsxPost(slug: string): TsxPostEntry | undefined {
  return tsxPostsRegistry[slug];
}
