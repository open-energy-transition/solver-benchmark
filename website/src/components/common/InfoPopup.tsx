import { useEffect, useState } from "react";
import Popup from "reactjs-popup";
import { QuestionLineIcon } from "@/assets/icons";

interface InfoPopupProps {
  tooltipContent?: React.ReactNode;
  tooltipText?: string;
  title?: string;
  className?: string;
  trigger?: (() => React.ReactNode) | undefined;
  arrow?: boolean;
  children?: React.ReactNode;
  closeOnDocumentClick?: boolean;
  arrowStyle?: React.CSSProperties;
  disabled?: boolean;
  position?:
    | "top center"
    | "top left"
    | "top right"
    | "right center"
    | "right top"
    | "right bottom"
    | "bottom center"
    | "bottom left"
    | "bottom right"
    | "left center"
    | "left top"
    | "left bottom";
}

const InfoPopup = ({
  trigger = undefined,
  arrow = false,
  className = "popup-wrapper",
  disabled = false,
  arrowStyle,
  children,
  position = "right center",
  closeOnDocumentClick = true,
}: InfoPopupProps) => {
  // reactjs-popup assigns each instance an `aria-describedby` id from a
  // module-level counter, which can come out differently on the server vs.
  // the client and trip React's hydration mismatch check. Rendering the
  // interactive Popup only after mount keeps the SSR/first-client-render
  // markup identical (just the trigger) and sidesteps the mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const renderTrigger =
    trigger ||
    (() => <QuestionLineIcon className="size-3.5" viewBox="0 0 24 20" />);

  if (!mounted) {
    return <>{renderTrigger()}</>;
  }

  return (
    <Popup
      on={["hover"]}
      disabled={disabled}
      trigger={renderTrigger}
      position={position}
      closeOnDocumentClick={closeOnDocumentClick}
      arrow={arrow}
      arrowStyle={arrowStyle}
      className={className}
    >
      <div className="popup-wrapper">{children || <></>}</div>
    </Popup>
  );
};

export default InfoPopup;
