import React from "react";
import Link from "next/link";
import Head from "next/head";
import { GetStaticProps } from "next";
import { getAllPostsMeta, PostMeta } from "../../lib/posts";
import { FooterLandingPage, Header } from "@/components/shared";

type Props = {
  posts: PostMeta[];
};

export default function BlogIndex({ posts }: Props) {
  return (
    <>
      <Head>
        <title>Blog - Open Energy Benchmark</title>
        <meta
          name="description"
          content="Latest updates and insights from Open Energy Benchmark"
        />
      </Head>
      <Header />
      <main className="bg-white min-h-screen">
        <div className="max-w-8xl mx-auto px-4 lg:px-[70px] py-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-navy mb-8">
            Blog
          </h1>
          {posts.length === 0 ? (
            <p className="text-gray-600">No blog posts yet.</p>
          ) : (
            <ul className="space-y-8">
              {posts.map((p) => (
                <li key={p.slug} className="border-b border-gray-200 pb-6">
                  <Link
                    href={`/blog/${p.slug}`}
                    className="text-2xl font-semibold text-navy hover:text-green transition-colors"
                  >
                    {p.title}
                  </Link>
                  <div className="text-sm text-dark-grey mt-2">{p.date}</div>
                  {p.excerpt && (
                    <p className="mt-3 text-gray-700">{p.excerpt}</p>
                  )}
                  {p.tags && p.tags.length > 0 && (
                    <div className="mt-3 flex gap-2">
                      {p.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-gray-200 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <FooterLandingPage />
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const posts = getAllPostsMeta();
  return {
    props: {
      posts,
    },
  };
};
