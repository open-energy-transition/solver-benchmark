"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Section reveal with scale + blur + fade – gives a premium "focus-in" feel.
 */
export function useScrollReveal<
  T extends HTMLElement = HTMLDivElement,
>(options?: {
  x?: number;
  y?: number;
  scale?: number;
  blur?: boolean;
  duration?: number;
  ease?: string;
  delay?: number;
  threshold?: number;
}) {
  const ref = useRef<T>(null!);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const x = options?.x ?? 0;
    const y = options?.y ?? 50;
    const scale = options?.scale ?? 0.95;
    const dur = options?.duration ?? 0.9;
    const ease = options?.ease ?? "power3.out";
    const blur = options?.blur ?? false;

    if (blur) {
      gsap.set(el, { opacity: 0, x, y, scale, filter: "blur(12px)" });
    } else {
      gsap.set(el, { opacity: 0, x, y, scale });
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const toVars: gsap.TweenVars = {
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            duration: dur,
            ease,
            delay: options?.delay ?? 0,
            overwrite: "auto",
          };
          if (blur) toVars.filter = "blur(0px)";
          gsap.to(el, toVars);
          observer.unobserve(el);
        }
      },
      { threshold: options?.threshold ?? 0.08 },
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return ref;
}

/**
 * Staggered reveal – children animate in one after another
 * with a bouncy "back.out" ease and scale-up entrance.
 */
export function useStaggerReveal<T extends HTMLElement = HTMLDivElement>(
  selector = ":scope > *",
  options?: {
    y?: number;
    scale?: number;
    stagger?: number;
    duration?: number;
    ease?: string;
    threshold?: number;
    fromDirection?: "bottom" | "left" | "right" | "scale";
  },
) {
  const ref = useRef<T>(null!);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const children = el.querySelectorAll(selector);
    if (!children.length) return;

    const y = options?.y ?? 40;
    const scale = options?.scale ?? 1;
    const dir = options?.fromDirection ?? "bottom";
    let fromVars: gsap.TweenVars = { opacity: 0 };

    switch (dir) {
      case "left":
        fromVars = { opacity: 0, x: -60, scale };
        break;
      case "right":
        fromVars = { opacity: 0, x: 60, scale };
        break;
      case "scale":
        fromVars = { opacity: 0, scale: 0.85 };
        break;
      default:
        fromVars = { opacity: 0, y, scale };
    }

    gsap.set(children, fromVars);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.to(children, {
            opacity: 1,
            y: 0,
            x: 0,
            scale: 1,
            duration: options?.duration ?? 0.6,
            stagger: options?.stagger ?? 0.12,
            ease: options?.ease ?? "back.out(1.2)",
            overwrite: "auto",
          });
          observer.unobserve(el);
        }
      },
      { threshold: options?.threshold ?? 0.05 },
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return ref;
}

/**
 * Counter animation from 0 to target value – smooth, no overshoot.
 * If `value` is provided it's used as the target; otherwise reads from textContent.
 */
export function useCountUp<T extends HTMLElement = HTMLDivElement>(
  value?: number,
  options?: {
    duration?: number;
    threshold?: number;
    ease?: string;
  },
) {
  const ref = useRef<T>(null!);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const target =
      value ?? parseFloat(el.textContent?.replace(/[^0-9.]/g, "") ?? "0");
    if (isNaN(target) || target <= 0) return;

    // Show initial value immediately
    el.textContent = "0";

    const dur = options?.duration ?? 2;
    const obj = { val: 0 };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.to(obj, {
            val: target,
            duration: dur,
            ease: options?.ease ?? "power3.out",
            overwrite: "auto",
            onUpdate: () => {
              el.textContent = `${Math.round(obj.val)}`;
            },
          });
          observer.unobserve(el);
        }
      },
      { threshold: options?.threshold ?? 0.1 },
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [value]);

  return ref;
}

/**
 * Hero entrance – heading text animates in with a clip-reveal effect.
 */
export function useEntranceAnimation<
  T extends HTMLElement = HTMLDivElement,
>(options?: { y?: number; duration?: number; delay?: number; ease?: string }) {
  const ref = useRef<T>(null!);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.set(el, {
      opacity: 0,
      y: options?.y ?? 40,
      clipPath: "inset(0 0 100% 0)",
    });
    gsap.to(el, {
      opacity: 1,
      y: 0,
      clipPath: "inset(0 0 0% 0)",
      duration: options?.duration ?? 1,
      ease: options?.ease ?? "power4.out",
      delay: options?.delay ?? 0.2,
      overwrite: "auto",
    });

    return () => {
      gsap.killTweensOf(el);
    };
  }, []);

  return ref;
}

/**
 * Subtle parallax effect on scroll – element moves at a fraction of scroll speed.
 */
export function useParallaxScroll<T extends HTMLElement = HTMLDivElement>(
  speed = 0.15,
) {
  const ref = useRef<T>(null!);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleScroll = () => {
      const rect = el.getBoundingClientRect();
      const scrolled = window.innerHeight - rect.top;
      gsap.to(el, {
        y: scrolled * speed,
        duration: 0.5,
        ease: "power1.out",
        overwrite: "auto",
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  return ref;
}

/**
 * Subtle continuous float animation – perfect for icons and decorative elements.
 */
export function useFloatAnimation<T extends HTMLElement = HTMLDivElement>(
  amount = 8,
  duration = 3,
) {
  const ref = useRef<T>(null!);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.to(el, {
      y: amount,
      duration,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    return () => {
      gsap.killTweensOf(el);
    };
  }, [amount, duration]);

  return ref;
}
