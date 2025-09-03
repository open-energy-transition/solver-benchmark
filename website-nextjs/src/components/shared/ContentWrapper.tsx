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
        mt-16
        md:mt-0
        px-2
        sm:px-6
        transition-all
        ${isNavExpanded ? "md:ml-64" : "md:ml-20"}
        `}
    >
      <div className="max-w-8xl mx-auto text-navy">
        {header && <div>{header}</div>}
        <div className="sm:flex bg-[#E6ECF5] gap-5 border border-stroke border-t-0 pb-6 p-4 mt-6 rounded-[32px]">
          {showFilter && (
            <div className="mt-4 sm:x-0 md:max-w-[255px] bg-[#F4F6FA] rounded-xl h-max">
              <FilterSection />
            </div>
          )}
          <div
            className={`
              pd:mx-0 overflow-scroll
              ${showFilter ? "w-full pr-0 pt-4" : "w-full"}
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
