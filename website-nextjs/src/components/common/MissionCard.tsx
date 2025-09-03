import { ArrowLongIcon } from "@/assets/icons";
import Link from "next/link";

interface MissionCardProps {
  Icon: React.ComponentType;
  title: string;
  description: string;
  linkText: string;
  linkHref: string;
  linkClass?: string;
  wrapperClass?: string;
}

const MissionCard = ({
  Icon,
  title,
  description,
  linkText,
  linkHref,
  wrapperClass = "",
}: MissionCardProps) => {
  return (
    <div
      className={`p-11 rounded-[48px] border-white border bg-white bg-opacity-30 w-full flex flex-col border-opacity-30 hover:border-opacity-60 ${wrapperClass}`}
    >
      <div className="h-[49px]">
        <Icon />
      </div>
      <h5 className="my-4 uppercase text-stroke">{title}</h5>
      <div className="flex-1">
        <div className="tag-line-lg leading-1.5">{description}</div>
      </div>
      <Link
        href={linkHref}
        className={`mt-6 px-3 pt-7 pb-1 relative flex justify-between`}
      >
        <div className="font-normal text-base font-lato text-[#e2e2e2] hover:underline underline-offset-4">
          {linkText}
        </div>
        <ArrowLongIcon className="text-white w-6 h-6" />
      </Link>
    </div>
  );
};

export default MissionCard;
