import { ArrowIcon } from "@/assets/icons";
import React, { useState } from "react";
import Popup from "reactjs-popup";

interface FilterGroupProps {
  title: string;
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
    <div
      className={`text-xs border-b xl:border-b-0 border-stroke w-full ${className}`}
    >
      <div className="flex items-center justify-between pr-3 border-y border-stroke bg-white">
        <div className="flex items-center border-b-0 border-stroke p-2 gap-2 4xl:text-lg">
          <input
            className="size-3 accent-navy rounded checked:before:text-xs "
            type="checkbox"
            checked={items.every((item) => selectedItems.includes(item))}
            onChange={onSelectAll}
          />
          {icon}
          <span className="overflow-hidden whitespace-nowrap text-ellipsis">
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
          {items.map((item) => (
            <div
              className="flex items-center gap-1 p-3 px-2.5 relative group min-w-[72px]"
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
                className={`w-max cursor-pointer text-ellipsis max-w-[90%] group-hover:max-w-[70%] whitespace-nowrap overflow-hidden ${itemClassName} ${
                  uppercase ? "uppercase" : ""
                }`}
              >
                <Popup
                  on={["hover"]}
                  trigger={() => <span>{item}</span>}
                  position="top right"
                  closeOnDocumentClick
                  arrowStyle={{ color: "#ebeff2" }}
                >
                  <div className="bg-stroke p-2 rounded 4xl:text-lg">
                    {item}
                  </div>
                </Popup>
              </span>
              <span
                className="text-navy font-bold text-[9px] hidden group-hover:inline-block cursor-pointer"
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
