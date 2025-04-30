import {
  DatabaseIcon,
  InstanceIcon,
  ProcessorIcon,
  TimeoutIcon,
} from "@/assets/icons";

const ConfigurationSection = () => {
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
      // TODO: Replace hardcoded timeout
      value: "1h",
      icon: <TimeoutIcon className="size-4 fill-navy" />,
    },
  ];

  return (
    <div className="bg-white rounded-xl border-stroke border border-x-0 py-4 px-4 xl:px-8 2xl:px-4 4xl:px-4 text-navy flex items-center justify-between">
      <div className="font-lato font-semibold  text-base/1.5 tracking-normal">
        Configuration
      </div>
      <ul className="flex gap-3.5 font-inter">
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
