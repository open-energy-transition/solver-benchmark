import React from "react";
import Head from "next/head";
import Link from "next/link";
import { GetStaticPaths, GetStaticProps } from "next";
import { getPostSlugs, getPostBySlug, PostMeta } from "../../lib/posts";
import { FooterLandingPage, Header } from "@/components/shared";
import { remark } from "remark";
import html from "remark-html";

type Props = {
  meta: PostMeta;
  contentHtml: string;
};

export default function Post({ meta, contentHtml }: Props) {
  return (
    <>
      <Head>
        <title>{meta.title} - Open Energy Benchmark</title>
        <meta name="description" content={meta.excerpt || meta.title} />
      </Head>
      <Header />
      <main className="bg-white min-h-screen">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <Link
            href="/blog"
            className="text-green hover:text-navy transition-colors mb-6 inline-block"
          >
            ← Back to blog
          </Link>
          <article>
            <h1 className="text-4xl lg:text-5xl font-bold text-navy mb-4">
              {meta.title}
            </h1>
            <div className="text-sm text-dark-grey mb-6">{meta.date}</div>
            {meta.tags && meta.tags.length > 0 && (
              <div className="mb-6 flex gap-2">
                {meta.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-gray-200 px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div
              dangerouslySetInnerHTML={{ __html: contentHtml }}
              className="prose prose-lg max-w-none"
            />
          </article>
        </div>
      </main>
      <FooterLandingPage />
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getPostSlugs().map((f) => f.replace(/\.md$/, ""));
  const paths = slugs.map((slug) => ({ params: { slug } }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = (params?.slug as string) + ".md";
  const { meta, content } = getPostBySlug(slug);
  const processed = await remark().use(html).process(content);
  const contentHtml = processed.toString();
  return {
    props: {
      meta,
      contentHtml,
    },
  };
};
