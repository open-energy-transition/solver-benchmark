import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import InfoPopup from "@/components/common/InfoPopup";
import { QuestionLineIcon } from "@/assets/icons";
import { Color } from "@/constants/color";

interface FieldBlockProps {
  label: string;
  value: React.ReactNode;
}

const FieldBlock = ({ label, value }: FieldBlockProps) => {
  const textRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const checkTruncation = () => {
      const el = textRef.current;
      setIsTruncated(!!el && el.scrollWidth > el.clientWidth);
    };
    checkTruncation();
    window.addEventListener("resize", checkTruncation);
    return () => window.removeEventListener("resize", checkTruncation);
  }, [value]);

  return (
    <div className="min-w-0">
      <div className="text-drak-green text-xs uppercase mb-1">{label}</div>
      <InfoPopup
        disabled={!isTruncated}
        trigger={() => (
          <div
            ref={textRef}
            className="font-bold text-base text-navy overflow-hidden text-ellipsis whitespace-nowrap"
          >
            {value}
          </div>
        )}
        position="top center"
        closeOnDocumentClick
        arrowStyle={{ color: Color.Stroke }}
      >
        <div>{value}</div>
      </InfoPopup>
    </div>
  );
};

interface ChipFieldBlockProps {
  label: string;
  values: string[];
}

interface TextFieldBlockProps {
  label: string;
  value: string;
}

const TextFieldBlock = ({ label, value }: TextFieldBlockProps) => (
  <div className="min-w-0 col-span-2 sm:col-span-3 lg:col-span-4">
    <div className="text-drak-green text-xs uppercase mb-1">{label}</div>
    <div className="font-bold text-base text-navy">{value}</div>
  </div>
);

const RealisticTag = ({ motivation }: { motivation?: string }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (motivation) setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
    setTooltipPos(null);
  };

  // Position the tooltip after it mounts, using its actual rendered size
  // (rather than a guessed height) so it never gets cut off or overflows
  // the viewport for long motivation text.
  useLayoutEffect(() => {
    if (!showTooltip) return;

    const updatePosition = () => {
      if (!triggerRef.current || !tooltipRef.current) return;
      const margin = 16;
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // The site's own nav sidebar is a fixed, very high z-index element,
      // so it always renders on top of anything positioned underneath it —
      // clamping to the raw viewport edge isn't enough on its own.
      const sidebar = document.querySelector(
        'nav[aria-label="Main navigation"]',
      );
      const minLeft = sidebar
        ? sidebar.getBoundingClientRect().right + margin
        : margin;

      let left =
        triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
      left = Math.min(
        Math.max(left, minLeft),
        viewportWidth - tooltipRect.width - margin,
      );

      const spaceAbove = triggerRect.top;
      const spaceBelow = viewportHeight - triggerRect.bottom;

      let top: number;
      if (spaceAbove >= tooltipRect.height + 10 || spaceAbove > spaceBelow) {
        top = triggerRect.top - tooltipRect.height - 10;
      } else {
        top = triggerRect.bottom + 10;
      }
      top = Math.min(
        Math.max(top, margin),
        viewportHeight - tooltipRect.height - margin,
      );

      setTooltipPos({ top, left });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [showTooltip]);

  return (
    <div className="min-w-0 flex items-center gap-1">
      <span
        ref={triggerRef}
        className="px-3 py-2 rounded-full text-sm cursor-default bg-navy text-white"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        Realistic
      </span>
      <InfoPopup
        trigger={() => (
          <span className="flex items-baseline cursor-pointer">
            <QuestionLineIcon className="size-3.5" viewBox="0 0 24 20" />
          </span>
        )}
        position="right center"
        closeOnDocumentClick
        arrow={false}
      >
        <div>
          Benchmark problems are marked as realistic if they come from a model
          that was used, or is similar to a model used in an actual energy
          modelling study. Please note that this is a rather subjective and
          modelling framework-dependent definition, but is still useful when
          estimating solver performance on real-world energy models.
        </div>
      </InfoPopup>

      {showTooltip && motivation && (
        <div
          ref={tooltipRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: "fixed",
            zIndex: 9999,
            width: "min(320px, calc(100vw - 2rem))",
            top: tooltipPos ? `${tooltipPos.top}px` : "-9999px",
            left: tooltipPos ? `${tooltipPos.left}px` : "-9999px",
            visibility: tooltipPos ? "visible" : "hidden",
          }}
        >
          <div className="bg-gray-900 text-white text-sm rounded-lg py-3 px-4 whitespace-normal shadow-xl border border-gray-700">
            <div className="font-semibold mb-2 text-gray-200">
              Realistic Motivation:
            </div>
            <div className="leading-relaxed">{motivation}</div>
          </div>
        </div>
      )}
    </div>
  );
};

const ChipFieldBlock = ({ label, values }: ChipFieldBlockProps) => (
  <div className="min-w-0 col-span-2">
    <div className="text-drak-green text-xs uppercase mb-2">{label}</div>
    <div className="flex flex-wrap gap-1.5">
      {values.map((value) => (
        <span
          key={value}
          className="bg-[#F0F4F2] text-navy text-xs rounded-full px-3 py-1"
        >
          {value}
        </span>
      ))}
    </div>
  </div>
);

interface SectionCardProps {
  title: string;
  infoText?: string;
  hasContent: boolean;
  children: React.ReactNode;
}

const SectionCard = ({
  title,
  infoText,
  hasContent,
  children,
}: SectionCardProps) => {
  if (!hasContent) return null;

  return (
    <div className="text-navy bg-white px-3 md:px-6 py-4 md:py-6 rounded-lg mt-4">
      <div className="flex items-center gap-1.5 mb-3 md:mb-4">
        <h6 className="font-league font-medium">{title}</h6>
        {infoText && (
          <InfoPopup
            trigger={() => (
              <span className="flex items-baseline cursor-pointer">
                <QuestionLineIcon className="size-3.5" viewBox="0 0 24 20" />
              </span>
            )}
            position="right center"
            closeOnDocumentClick
            arrow={false}
          >
            <div>{infoText}</div>
          </InfoPopup>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {children}
      </div>
    </div>
  );
};

export {
  FieldBlock,
  TextFieldBlock,
  ChipFieldBlock,
  SectionCard,
  RealisticTag,
};
