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
  linkClass = "",
  wrapperClass = "",
}: MissionCardProps) => {
  return (
    <div
      className={`p-11 rounded-[48px] border-white border bg-white bg-opacity-30 w-full flex flex-col hover:border-opacity-30 border-opacity-60 ${wrapperClass}`}
    >
      <div>
        <Icon />
      </div>
      <div className="my-4 font-league font-bold text-2xl/1.4 uppercase">
        {title}
      </div>
      <div className="flex-1">
        <div className="font-lato font-medium text-lg/1.5">{description}</div>
      </div>
      <Link
        href={linkHref}
        className={`mt-6 px-3 pt-7 pb-1 relative flex justify-between ${linkClass}`}
      >
        <div className="font-normal text-base font-lato text-[#e2e2e2]">
          {linkText}
        </div>
        <ArrowLongIcon className="text-white w-6 h-6" />
      </Link>
    </div>
  );
};

export default MissionCard;
