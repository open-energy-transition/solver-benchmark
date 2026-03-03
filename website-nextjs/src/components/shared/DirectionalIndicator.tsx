import React, { useId } from "react";

export type Direction = "lower" | "higher";

interface DirectionalIndicatorProps {
  direction: Direction;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const DirectionalIndicator: React.FC<DirectionalIndicatorProps> = ({
  direction,
  className = "",
  size = "sm",
}) => {
  const id = useId();

  const sizeClasses: Record<string, string> = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
  };

  const svgHeights: Record<string, number> = {
    sm: 8,
    md: 10,
    lg: 12,
  };

  const text = direction === "lower" ? "Lower is better" : "Higher is better";

  const headOffset = size === "sm" ? 6 : size === "md" ? 7 : 9;

  return (
    <div
      className={`inline-flex flex-col items-center -rotate-90 text-black ${sizeClasses[size]} ${className}`}
      style={{ display: "inline-flex" }}
    >
      <svg
        width="100%"
        height={svgHeights[size]}
        viewBox="0 0 120 12"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className={direction === "lower" ? "transform rotate-180" : ""}
      >
        {/* extended tip by ~20%: original length ~94, new tip at ~115 */}
        <line
          x1="2"
          y1="6"
          x2="113"
          y2="6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Triangle head (tip, top-base, bottom-base) - shifted to new tip */}
        <polygon
          points={`${115},6 ${115 - headOffset},${
            6 - Math.round(headOffset * 0.8)
          } ${115 - headOffset},${6 + Math.round(headOffset * 0.8)}`}
          fill="currentColor"
        />
      </svg>
      <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>
        {text}
      </span>
    </div>
  );
};

export default DirectionalIndicator;
