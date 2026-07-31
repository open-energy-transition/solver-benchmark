import { useEffect, useRef, useState } from "react";

interface UseScrollSpyOptions {
  threshold?: number;
  hash: string;
}

export const useScrollSpy = ({
  threshold = 0.5,
  hash,
}: UseScrollSpyOptions) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isFullyVisible, setIsFullyVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFullyVisible(entry.intersectionRatio === 1);
        if (entry.isIntersecting) {
          //   window.location.hash = hash;
          //   window.history.replaceState(null, "", hash);
        }
      },
      { threshold },
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [hash, threshold]);

  return { ref: elementRef, isFullyVisible };
};
