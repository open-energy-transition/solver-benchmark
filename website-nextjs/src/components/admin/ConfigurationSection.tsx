import {
  DatabaseIcon,
  InstanceIcon,
  ProcessorIcon,
  TimeoutIcon,
} from "@/assets/icons";

interface ConfigurationSectionProps {
  timeout: number;
}

const TIMEOUT = {
  STANDARD: 3600,
  EXTENDED: 36000,
} as const;

type MachineConfig = {
  instance: string;
  vcpus: string;
  memory: string;
};

const MACHINE_CONFIGS: Record<number, MachineConfig> = {
  [TIMEOUT.STANDARD]: {
    instance: "c4-standard-2",
    vcpus: "2",
    memory: "7 GB",
  },
  [TIMEOUT.EXTENDED]: {
    instance: "c4-highmem-8",
    vcpus: "8",
    memory: "62 GB",
  },
};

const ConfigurationSection = ({ timeout }: ConfigurationSectionProps) => {
  const timeoutInHours = timeout / 3600; // Convert seconds to hours

  const config = MACHINE_CONFIGS[timeout];

  const detailData = [
    {
      label: "Instance",
      value: config.instance,
      icon: <InstanceIcon className="size-4 fill-navy" />,
    },
    {
      label: "vCPUs",
      value: config.vcpus,
      icon: <ProcessorIcon className="size-4 fill-navy" />,
    },
    {
      label: "Memory",
      value: config.memory,
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
      <div className="tag-line font-semibold text-dark-grey">Configuration</div>
      <ul className="flex gap-6 font-inter">
        {detailData.map((data, idx) => (
          <li
            key={idx}
            className="text-xs font-inter flex items-center border border-[#cad9ef] rounded-2xl p-1 pr-4"
          >
            <span className="rounded-full p-1 bg-[#F7F7F7]">{data.icon}</span>
            <div className="ml-1 2xl:ml-2 text-dark-grey">
              <span className="ml-1 2xl:ml-2 tag-line-xs">
                {data.label}
                {":"}
              </span>
              <span className="font-bold ml-1 2xl:ml-2 tag-line-xs">
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
