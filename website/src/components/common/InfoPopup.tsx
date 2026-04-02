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
}: InfoPopupProps) => (
  <Popup
    on={["hover"]}
    disabled={disabled}
    trigger={
      trigger ||
      (() => <QuestionLineIcon className="size-3.5" viewBox="0 0 24 20" />)
    }
    position={position}
    closeOnDocumentClick={closeOnDocumentClick}
    arrow={arrow}
    arrowStyle={arrowStyle}
    className={className}
  >
    <div className="popup-wrapper">{children || <></>}</div>
  </Popup>
);

export default InfoPopup;
