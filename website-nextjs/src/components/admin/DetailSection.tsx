import {
  AppIcon,
  DatabaseIcon,
  GraphBarIcon,
  LayoutGroupIcon,
  VectorSquareIcon,
} from "@/assets/icons"

const DetailSection = () => {
  const detailData = [
    {
      label: "Solvers",
      value: "3",
      icon: <VectorSquareIcon />,
    },
    {
      label: "Iteration",
      value: "1",
      icon: <LayoutGroupIcon />,
    },
    {
      label: "Benchmarks",
      value: "32",
      icon: <GraphBarIcon />,
    },
    {
      label: "Memory",
      value: "16 GB",
      icon: <DatabaseIcon />,
    },
    {
      label: "Timeout",
      value: "15 min",
      icon: <DatabaseIcon />,
    },
    {
      label: "vCPUs",
      value: "2 (1 core)",
      icon: <AppIcon />,
    },
  ]

  return (
    <div className="bg-white rounded-xl py-4 px-12">
      <ul className="flex justify-between text-dark-grey">
        {detailData.map((data, idx) => (
          <li key={idx} className="text-base flex items-center">
            {data.icon}
            <span className="ml-1">
              {data.label}
              {":"}
            </span>
            <span className="font-bold ml-1">{data.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
export default DetailSection
