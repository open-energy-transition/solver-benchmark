import React from "react";
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
  gridClassName = "grid-cols-2 xl:grid-cols-2",
  itemClassName = "",
  uppercase = false,
}) => {
  return (
    <div
      className={`text-xs border-b xl:border-b-0 xl:border-r last:border-r-0 border-stroke w-full ${className}`}
    >
      <div className="flex items-center justify-between pr-3 border-b border-stroke">
        <div className="flex items-center border-b-0 border-stroke px-3 py-2 gap-1 4xl:text-lg">
          {icon}
          <span className="overflow-hidden whitespace-nowrap text-ellipsis">
            {title}
          </span>
        </div>
        <input
          className="w-4 h-4 accent-navy rounded"
          type="checkbox"
          checked={items.every((item) => selectedItems.includes(item))}
          onChange={onSelectAll}
        />
      </div>
      <div
        className={`grid ${gridClassName} gap-x-1 text-xs max-h-[95px] overflow-y-auto`}
      >
        {items.map((item) => (
          <div
            className="flex items-center gap-1 p-3 relative group"
            key={item}
          >
            <input
              className="w-4 h-4 accent-navy rounded"
              type="checkbox"
              checked={selectedItems.includes(item)}
              onChange={() => onItemChange(item)}
            />
            <span
              onClick={() => onItemChange(item)}
              className={`w-max cursor-pointer text-ellipsis whitespace-nowrap overflow-hidden 4xl:text-lg ${itemClassName} ${
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
                <div className="bg-stroke p-2 rounded 4xl:text-lg">{item}</div>
              </Popup>
            </span>
            <span
              className="text-navy hidden group-hover:inline-block ml-0.5 cursor-pointer"
              onClick={() => onItemOnly(item)}
            >
              only
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilterGroup;
