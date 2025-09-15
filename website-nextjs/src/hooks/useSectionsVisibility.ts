import { useEffect, useState } from "react";

interface TOCItem {
  hash: string;
  label: string;
  threshold: number;
}

export function useSectionsVisibility(items: TOCItem[]) {
  const [visibility, setVisibility] = useState<boolean[]>(() =>
    items.map(() => false),
  );

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const newVisibility = [...visibility];

    items.forEach((item, idx) => {
      const id = item.hash.replace(/^#/, "");
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          newVisibility[idx] = entry.intersectionRatio >= item.threshold;
          setVisibility([...newVisibility]);
        },
        { threshold: item.threshold || 0.5 },
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [items.map((i) => i.hash).join(",")]);

  return visibility;
}
