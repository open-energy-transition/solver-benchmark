import Link from "next/link";
import Head from "next/head";
import { GetStaticProps } from "next";
import { getAllPostsMeta, PostMeta } from "../../lib/posts";
import { FooterLandingPage, Header } from "@/components/shared";
import { useScrollReveal, useStaggerReveal } from "@/hooks/useGsapAnimation";

type Props = {
  posts: PostMeta[];
};

export default function BlogIndex({ posts }: Props) {
  const headingRef = useScrollReveal<HTMLHeadingElement>({
    x: -80,
    y: 0,
    duration: 0.8,
    threshold: 0.1,
  });

  const listRef = useStaggerReveal<HTMLUListElement>("li", {
    fromDirection: "bottom",
    y: 20,
    stagger: 0.1,
    duration: 0.6,
    threshold: 0.05,
  });

  return (
    <>
      <Head>
        <title>Blog - Open Energy Benchmark</title>
        <meta
          name="description"
          content="Latest updates and insights from Open Energy Benchmark"
        />
      </Head>
      <div>
        <Header />
      </div>
      <main className="bg-white min-h-screen">
        <div className="max-w-8xl mx-auto px-4 lg:px-[70px] py-16">
          <h1
            ref={headingRef}
            className="text-4xl lg:text-5xl font-bold text-navy mb-8"
          >
            Blog
          </h1>
          {posts.length === 0 ? (
            <p className="text-gray-600">No blog posts yet.</p>
          ) : (
            <ul ref={listRef} className="space-y-8">
              {posts.map((p) => (
                <li key={p.slug} className="border-b border-gray-200 pb-6">
                  <Link
                    href={`/blog/${p.slug}`}
                    aria-label={`Navigate to blog post titled ${p.title}`}
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
