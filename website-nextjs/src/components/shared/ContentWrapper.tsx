import { useSelector } from "react-redux";
import { ReactNode } from "react";

interface ContentWrapperProps {
  children: ReactNode;
}

const ContentWrapper = ({ children }: ContentWrapperProps) => {
  const isNavExpanded = useSelector(
    (state: { theme: { isNavExpanded: boolean } }) => state.theme.isNavExpanded,
  );

  return (
    <div
      className={`
        min-h-[calc(100vh-var(--footer-height))]
        px-2
        sm:px-6
        transition-all
        ${isNavExpanded ? "md:ml-64" : "md:ml-20"}
        `}
    >
      <div
        className="
          px-4
          pd:mx-0
          3xl:mx-auto
          max-w-screen-2xl"
      >
        {children}
      </div>
    </div>
  );
};

export default ContentWrapper;
