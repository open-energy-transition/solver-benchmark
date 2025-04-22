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
      <div
        className="
            bg-navy
            flex
            font-extrabold
            font-lato
            items-center
            mx-auto
            justify-center
            rounded-full
            size-[5.5rem]
            text-4.5xl/1.4
            text-white
            tracking-normal

        "
      >
        {value}
      </div>
      <h5
        className="
            font-extrabold
            font-lato
            mt-4
            text-2xl/1.4
            tracking-normal
            uppercase
        "
      >
        {label}
      </h5>
    </div>
  );
};

export default StatsBox;
