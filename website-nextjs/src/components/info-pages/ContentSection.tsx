import React from "react";

interface ContentSectionProps {
  children: React.ReactNode;
}

export const ContentSection: React.FC<ContentSectionProps> = ({ children }) => {
  return (
    <div className="w-full sm:w-[min(948px,65.83vw)] sm:ml-8">
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
};
