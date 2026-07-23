interface StatsBoxProps {
  value: number;
  label: string;
  isCircular?: boolean;
  isLast?: boolean;
}

import { useCountUp } from "@/hooks/useGsapAnimation";

const StatsBox = ({ value, label }: StatsBoxProps) => {
  const countRef = useCountUp<HTMLDivElement>(value);

  return (
    <div
      className="
        pt-6
        md:pt-9
        text-center
        flex-1
        md:border-r-2
        border-navy
        px-4
        last:border-r-0
        "
    >
      <div
        ref={countRef}
        className="
          bg-white flex font-extrabold items-center mx-auto justify-center rounded-full
          size-16 md:size-[5.5rem]  text-navy text-3xl md:text-4xl
        "
      >
        {value}
      </div>
      <div className="font-extrabold mt-4 md:text-2xl/1.4 uppercase text-lg sm:text-2xl font-lato sm:leading-1.4 tracking-normal">
        {label}
      </div>
    </div>
  );
};

export default StatsBox;
