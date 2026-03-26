interface StatsBoxProps {
  value: number;
  label: string;
  isCircular?: boolean;
  isLast?: boolean;
}

const StatsBox = ({ value, label }: StatsBoxProps) => {
  return (
    <div
      className="
        py-6
        md:py-9
        text-center
        flex-1
        md:border-r-2
        border-navy
        px-4
        last:border-r-0
        "
    >
      <div
        className="
          bg-navy flex font-extrabold items-center mx-auto justify-center rounded-full
          size-16 md:size-[5.5rem]  text-white text-3xl md:text-4xl
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
