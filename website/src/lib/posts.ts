import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getTsxPostMetas } from "./tsx-posts-registry";

export type PostMeta = {
  title: string;
  date: string;
  tags?: string[];
  excerpt?: string;
  slug: string;
  /** 'md' for markdown files, 'tsx' for registered React component pages */
  type?: "md" | "tsx";
};

const POSTS_PATH = path.join(process.cwd(), "src", "data", "posts");

export function getPostSlugs(): string[] {
  if (!fs.existsSync(POSTS_PATH)) return [];
  return fs.readdirSync(POSTS_PATH).filter((f) => f.endsWith(".md"));
}

export function getPostBySlug(slugFilename: string) {
  const fullPath = path.join(POSTS_PATH, slugFilename);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);
  const slug = slugFilename.replace(/\.md$/, "");
  const meta: PostMeta = {
    title: data.title || slug,
    date: data.date || "",
    tags: data.tags || [],
    excerpt: data.excerpt || "",
    slug,
  };
  return { meta, content };
}

export function getAllPostsMeta(): PostMeta[] {
  const mdPosts = getPostSlugs().map((s) => {
    const { meta } = getPostBySlug(s);
    return { ...meta, type: "md" as const };
  });
  const tsxPosts = getTsxPostMetas();
  const posts: PostMeta[] = [...mdPosts, ...tsxPosts];
  // sort by date desc
  posts.sort((a, b) => (a.date < b.date ? 1 : -1));
  return posts;
}
