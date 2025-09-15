import { ArrowIcon } from "@/assets/icons";
import React, { useState } from "react";
import Popup from "reactjs-popup";

interface FilterGroupProps {
  title: string | React.ReactNode;
  icon: React.ReactNode;
  items: string[];
  selectedItems?: string[];
  onItemChange: (value: string) => void;
  onItemOnly: (value: string) => void;
  onSelectAll: () => void;
  className?: string;
  gridClassName?: string;
  itemClassName?: string;
  uppercase?: boolean;
}

const FilterGroup: React.FC<FilterGroupProps> = ({
  title,
  icon,
  items,
  selectedItems = [],
  onItemChange,
  onItemOnly,
  onSelectAll,
  className = "xl:w-auto",
  gridClassName = "grid-cols-1",
  itemClassName = "",
  uppercase = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={`border-b xl:border-b-0 border-stroke w-full ${className}`}>
      <div className="flex items-center justify-between pr-2 rounded-lg bg-white">
        <div className="flex items-center border-b-0 border-stroke p-2 pr-0 gap-2">
          <input
            className="size-3.5 accent-navy rounded checked:before:text-xs "
            type="checkbox"
            checked={items.every((item) => selectedItems.includes(item))}
            onChange={onSelectAll}
          />
          {icon}
          <span className="overflow-hidden whitespace-nowrap text-ellipsis tag-line-sm">
            {title}
          </span>
          {selectedItems.length > 0 && selectedItems.length < items.length && (
            <span className="bg-navy text-white rounded-full text-xs px-1.5 py-0.5 min-w-[18px] text-center">
              {selectedItems.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2 text-navy hover:text-navy-dark"
          >
            {isExpanded ? (
              <ArrowIcon
                fill="none"
                className="stroke-navy size-2 block -rotate-90"
              />
            ) : (
              <ArrowIcon
                fill="none"
                className="stroke-navy size-2 block rotate-90"
              />
            )}
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className={`grid ${gridClassName} text-xs`}>
          {[...items].sort().map((item) => (
            <div
              className="flex items-center gap-1 p-3 px-2.5 relative group min-w-max max-w-max"
              key={item}
            >
              <input
                className="size-3 accent-navy rounded checked:before:text-xs "
                type="checkbox"
                checked={selectedItems.includes(item)}
                onChange={() => onItemChange(item)}
              />
              <span
                onClick={() => onItemChange(item)}
                className={`w-max cursor-pointer text-ellipsis max-w-[90%] group-hover:max-w-[90%] whitespace-nowrap overflow-hidden ${itemClassName} ${
                  uppercase ? "uppercase" : ""
                }`}
              >
                <Popup
                  on={["hover"]}
                  disabled={item.length < 32}
                  trigger={() => <span>{item}</span>}
                  position="top right"
                  closeOnDocumentClick
                  arrowStyle={{ color: "#ebeff2" }}
                >
                  <div className="text-white bg-navy p-2 rounded">{item}</div>
                </Popup>
              </span>
              <span
                className="text-navy font-bold text-[9px] mt-0.5 absolute pr-0.5 -right-3 bg-[#F4F6FA] z-50 hidden group-hover:inline-block cursor-pointer"
                onClick={() => onItemOnly(item)}
              >
                only
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterGroup;
