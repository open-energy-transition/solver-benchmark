import React from "react";
import { useHash } from "@/hooks/useHash";

interface TOCItem {
  hash: string;
  label: string;
}

interface TableOfContentsProps {
  items: TOCItem[];
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ items }) => {
  const currentHash = useHash();

  const getLinkStyle = (hash: string) => {
    return `tag-line text-[#006D97] p-2 px-4 ${
      currentHash === hash
        ? "font-bold bg-[#6B90801A] border-r-8 border-[#6B9080] bg-opacity-10 rounded-e-md"
        : ""
    }`;
  };

  return (
    <div className="w-full sm:w-[min(212px,14.72vw)] py-4 sm:py-8 px-2 sm:px-0 bg-[#FAFAFACC] bg-opacity-80 h-max rounded-xl sm:sticky sm:top-[150px] mb-4 sm:mb-0">
      <div className="px-2 sm:px-4">
        <h2 className="border-b border-[#D8E3F2] leading-snug text-base sm:text-lg">
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
  );
};
