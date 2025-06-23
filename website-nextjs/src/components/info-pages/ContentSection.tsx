import React from "react";

interface ContentSectionProps {
  children: React.ReactNode;
}

export const ContentSection: React.FC<ContentSectionProps> = ({ children }) => {
  return (
    <div className="col-start-2 col-end-7 ml-4">
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
};
