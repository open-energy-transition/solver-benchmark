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
        py-9
        text-center
        flex-1
        border-r-2
        border-navy
        px-4
        last:border-r-0
        "
    >
      <h3
        className="
          bg-navy
          flex
          font-extrabold
          items-center
          mx-auto
          justify-center
          rounded-full
          size-16
          md:size-[5.5rem]
          text-white
        "
      >
        {value}
      </h3>
      <h5
        className="
          font-extrabold
          mt-4
          md:text-2xl/1.4
          uppercase
        "
      >
        {label}
      </h5>
    </div>
  );
};

export default StatsBox;
