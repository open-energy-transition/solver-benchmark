import React, { useEffect, useRef } from "react";
import gsap from "gsap";

interface TOCItem {
  hash: string;
  label: string;
}

interface TableOfContentsProps {
  items: TOCItem[];
  currentSection: string | null;
  title?: string;
  isBlogPage?: boolean;
  enableAnimation?: boolean;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  items,
  currentSection = "",
  title = "",
  isBlogPage = false,
  enableAnimation = true,
}) => {
  const rootRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    if (!enableAnimation) return;
    const el = rootRef.current;
    if (!el) return;
    gsap.fromTo(
      el,
      { opacity: 0, x: -40 },
      {
        opacity: 1,
        x: 0,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.2,
      },
    );
  }, [enableAnimation]);

  const getLinkStyle = (hash: string) => {
    return `tag-line text-[#006D97] p-2 lg:pl-4 ${
      currentSection === hash
        ? "font-bold bg-[#6B90801A] pr-0 border-r-8 border-[#6B9080] bg-opacity-10 rounded-e-md"
        : ""
    }`;
  };

  return (
    <div ref={rootRef} className="lg:sticky lg:top-[134px] h-max z-50">
      <h3
        className={`${
          isBlogPage
            ? "lg:bg-soft-gray lg:w-[100vw] lg:absolute lg:top-0 lg:left-0 w-full"
            : "w-max"
        } py-4.5 font-bold text-3xl xl:text-[40px]`}
      >
        {title}
      </h3>
      <div
        className={`${
          isBlogPage ? "lg:mt-[84px]" : ""
        } w-full lg:w-[min(212px,14.72vw)] py-2 lg:py-8 px-2 lg:px-0 bg-[#FAFAFACC] bg-opacity-80 h-max rounded-xl lg:mb-0`}
      >
        <div className="px-2 sm:px-4">
          <h2 className="border-b border-[#D8E3F2] leading-snug">
            On this page
          </h2>
        </div>
        <div className="flex flex-col mt-2 sm:mt-4">
          {items.map((item, index) => (
            <div key={index} className={getLinkStyle(item.hash)}>
              <a href={item.hash}>{item.label}</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
