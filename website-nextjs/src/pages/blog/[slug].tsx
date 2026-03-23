import React, { useEffect, useState, useRef } from "react";
import Head from "next/head";
import { GetStaticPaths, GetStaticProps } from "next";
import { getPostSlugs, getPostBySlug, PostMeta } from "../../lib/posts";
import { getTsxPost, getTsxPostSlugs } from "../../lib/tsx-posts-registry";
import {
  PageLayout,
  TableOfContents,
  ContentSection,
} from "@/components/info-pages";
import { useSectionsVisibility } from "@/hooks/useSectionsVisibility";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { remark } from "remark";
import html from "remark-html";

type TocItem = {
  hash: string;
  label: string;
};

type Props = {
  meta: PostMeta;
  contentHtml: string;
  tocItems: TocItem[];
  isTsx: boolean;
};

function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/<[^>]*>/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section"
  );
}

function extractTocAndInjectIds(htmlString: string) {
  const toc: TocItem[] = [];
  // Replace <h2 ...>...</h2> with <h2 id="slug">...</h2>
  const newHtml = htmlString.replace(
    /<h2([^>]*)>(.*?)<\/h2>/gi,
    (match, attrs = "", inner) => {
      const label = inner.replace(/<[^>]+>/g, "").trim();
      const slug = slugify(label);
      const hash = `#${slug}`;
      toc.push({ hash, label });

      // Normalize any React `className` to `class` and merge/apply
      // a scroll-margin-top utility so anchor links land below fixed headers.
      let outAttrs = attrs;

      if (/\bclass(Name)?=/i.test(outAttrs)) {
        // convert className -> class
        outAttrs = outAttrs.replace(/className=/gi, "class=");
        // append our utility to existing class attribute (double-quote case)
        outAttrs = outAttrs.replace(
          /class=\"([^\"]*)\"/,
          (_m: any, g1: any) => `class="${g1} scroll-mt-[240px]"`,
        );
        // append for single-quoted case
        outAttrs = outAttrs.replace(
          /class='([^']*)'/,
          (_m: any, g1: any) => `class='${g1} scroll-mt-[240px]'`,
        );
      } else {
        // attrs may include a leading space; insert our class attribute
        outAttrs = ` class=\"scroll-mt-[240px]\"${attrs}`;
      }

      return `<h2 id="${slug}"${outAttrs}>${inner}</h2>`;
    },
  );

  return { contentHtml: newHtml, tocItems: toc };
}

export default function Post({ meta, contentHtml, tocItems, isTsx }: Props) {
  // For TSX posts, look up and render the registered component directly.
  if (isTsx) {
    const entry = getTsxPost(meta.slug);
    if (entry) {
      const { Component } = entry;
      return (
        <PageLayout title={meta.title} description={meta.excerpt || meta.title}>
          <Head>
            <title>{meta.title} - Open Energy Benchmark</title>
            <meta name="description" content={meta.excerpt || meta.title} />
          </Head>
          <ContentSection>
            <Component />
          </ContentSection>
        </PageLayout>
      );
    }
  }
  const mappedItems = tocItems.map((t) => ({ ...t, threshold: 0.5 }));
  const visibilities = useSectionsVisibility(mappedItems);
  const scrollDirection = useScrollDirection();
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const initialSelectionDone = useRef(false);

  useEffect(() => {
    // If any observed section is visible, pick the first visible one (lowest index).
    const anyVisible = visibilities.some((v) => v);
    if (anyVisible) {
      const firstIdx = visibilities.findIndex((v) => v);
      if (firstIdx !== -1 && mappedItems[firstIdx]) {
        const hash = mappedItems[firstIdx].hash;
        if (hash !== currentSection) {
          window.history.replaceState(null, "", hash);
          setCurrentSection(hash);
        }
        initialSelectionDone.current = true;
      }
      return;
    }

    // No headings observed as visible. If page is at top and we haven't
    // performed the initial selection yet, highlight the first item.
    if (
      !initialSelectionDone.current &&
      typeof window !== "undefined" &&
      window.scrollY === 0
    ) {
      if (mappedItems.length > 0) {
        window.history.replaceState(null, "", mappedItems[0].hash);
        setCurrentSection(mappedItems[0].hash);
      }
      initialSelectionDone.current = true;
    }
  }, [visibilities, scrollDirection]);

  return (
    <PageLayout title={meta.title} description={meta.excerpt || meta.title}>
      <Head>
        <title>{meta.title} - Open Energy Benchmark</title>
        <meta name="description" content={meta.excerpt || meta.title} />
      </Head>

      <TableOfContents
        title={meta.title}
        currentSection={currentSection}
        items={tocItems.map((t) => ({ hash: t.hash, label: t.label }))}
        isBlogPage={true}
      />

      <ContentSection>
        <div className="info-pages-content">
          <article className="info-pages-section">
            {meta.tags && meta.tags.length > 0 && (
              <div className="mb-6 flex gap-2 mt-4">
                <div className="text-sm bg-gray-200 px-2 py-1 rounded">
                  {meta.date}
                </div>
                {meta.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-sm bg-gray-200 px-2 py-1 rounded"
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
      </ContentSection>
    </PageLayout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const mdSlugs = getPostSlugs().map((f) => f.replace(/\.md$/, ""));
  const tsxSlugs = getTsxPostSlugs();
  const paths = [...mdSlugs, ...tsxSlugs].map((slug) => ({
    params: { slug },
  }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;

  // Check if this is a registered TSX post.
  const entry = getTsxPost(slug);
  if (entry) {
    return {
      props: {
        meta: { ...entry.meta, type: "tsx" },
        contentHtml: "",
        tocItems: [],
        isTsx: true,
      },
    };
  }

  // Otherwise treat as a markdown post.
  const { meta, content } = getPostBySlug(slug + ".md");
  const processed = await remark().use(html).process(content);
  const rawHtml = processed.toString();
  const { contentHtml, tocItems } = extractTocAndInjectIds(rawHtml);

  return {
    props: {
      meta: { ...meta, type: "md" },
      contentHtml,
      tocItems,
      isTsx: false,
    },
  };
};
