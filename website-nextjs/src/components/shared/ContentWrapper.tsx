import { useSelector } from "react-redux";
import { ReactNode } from "react";
import FilterSection from "../admin/FilterSection";

interface ContentWrapperProps {
  children: ReactNode;
  header?: ReactNode;
  showFilter?: boolean;
}

const ContentWrapper = ({
  children,
  header,
  showFilter = true,
}: ContentWrapperProps) => {
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
      <div className="max-w-8xl mx-auto">
        {header && <div>{header}</div>}
        <div className="sm:flex">
          {showFilter && (
            <div className="m-4 sm:x-0 sm:w-1/5 overflow-hidden bg-white rounded-xl h-max">
              <FilterSection />
            </div>
          )}
          <div
            className={`
              pd:mx-0
              3xl:mx-auto
              ${showFilter ? "sm:w-4/5 px-4 pt-4" : "w-full"}
              `}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentWrapper;
