import {
  DatabaseIcon,
  InstanceIcon,
  ProcessorIcon,
  TimeoutIcon,
} from "@/assets/icons";

interface ConfigurationSectionProps {
  timeout: number;
}

const ConfigurationSection = ({ timeout }: ConfigurationSectionProps) => {
  const timeoutInHours = timeout / 3600; // Convert seconds to hours

  const detailData = [
    {
      label: "Instance",
      value: "c4-standard-2",
      icon: <InstanceIcon className="size-4 fill-navy" />,
    },
    {
      label: "vCPUs",
      value: "2 (1 core)",
      icon: <ProcessorIcon className="size-4 fill-navy" />,
    },
    {
      label: "Memory",
      value: "8 GB RAM",
      icon: <DatabaseIcon className="size-4 fill-navy" />,
    },
    {
      label: "Timeout",
      value: `${timeoutInHours}h`,
      icon: <TimeoutIcon className="size-4 fill-navy" />,
    },
  ];

  return (
    <div className="bg-[#F7F7F9] rounded-xl border-stroke border border-x-0 py-3 px-2 pl-8 pr-4 text-navy flex items-center justify-between">
      <div className="font-lato font-semibold  text-base/1.5 tracking-normal">
        Configuration
      </div>
      <ul className="flex gap-6 font-inter">
        {detailData.map((data, idx) => (
          <li
            key={idx}
            className="text-xs font-inter flex items-center border border-[#cad9ef] rounded-2xl p-1 pr-4"
          >
            <span className="rounded-full p-1 bg-[#F7F7F7]">{data.icon}</span>
            <div className="ml-1 2xl:ml-2 4xl:ml-3">
              <span className="ml-1 2xl:ml-2 4xl:ml-3">
                {data.label}
                {":"}
              </span>
              <span className="font-bold ml-1 2xl:ml-2 4xl:ml-3">
                {data.value}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
export default ConfigurationSection;
