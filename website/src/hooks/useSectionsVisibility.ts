import { useEffect, useState } from "react";

interface TOCItem {
  hash: string;
  label: string;
  threshold: number;
}

/**
 * Tracks which ToC sections are currently visible in the viewport.
 *
 * @param items     - List of ToC items with their hashes.
 * @param topOffset - Height in px of any fixed/sticky header that obscures the
 *                    top of the viewport (e.g. 84 + 134 = 218). The observer
 *                    root is shrunk by this amount from the top so that
 *                    elements hidden behind the header are never reported as
 *                    visible. Defaults to 218.
 */
export function useSectionsVisibility(items: TOCItem[], topOffset = 218) {
  const [visibility, setVisibility] = useState<boolean[]>(() =>
    items.map(() => false),
  );

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const newVisibility = [...visibility];

    // Negative top margin excludes the fixed-header area from the root so the
    // observer only fires when the element is truly visible below the overlay.
    // A small negative bottom margin creates a narrow "active" band just below
    // the header, so the highlight moves to the next section promptly.
    const rootMargin = `-${topOffset}px 0px -40% 0px`;

    items.forEach((item, idx) => {
      const id = item.hash.replace(/^#/, "");
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          newVisibility[idx] = entry.isIntersecting;
          setVisibility([...newVisibility]);
        },
        // threshold:0 — fire as soon as any pixel enters/leaves the clipped root
        { threshold: 0, rootMargin },
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [items.map((i) => i.hash).join(","), topOffset]);

  return visibility;
}
