import React from "react";

interface TOCItem {
  hash: string;
  label: string;
}

interface TableOfContentsProps {
  items: TOCItem[];
  currentSection: string | null;
  title?: string;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  items,
  currentSection = "",
  title = "",
}) => {
  const getLinkStyle = (hash: string) => {
    return `tag-line text-[#006D97] p-2 pl-4 ${
      currentSection === hash
        ? "font-bold bg-[#6B90801A] pr-0 border-r-8 border-[#6B9080] bg-opacity-10 rounded-e-md"
        : ""
    }`;
  };

  return (
    <div className="lg:sticky lg:top-[134px] h-max">
      <h3 className="py-4.5 font-bold w-max">{title}</h3>
      <div className="w-full lg:w-[min(212px,14.72vw)] py-4 lg:py-8 px-2 lg:px-0 bg-[#FAFAFACC] bg-opacity-80 h-max rounded-xl lg:mb-0">
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
