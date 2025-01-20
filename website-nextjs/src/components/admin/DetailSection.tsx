import { useSelector } from "react-redux"
// internal
import {
  AppIcon,
  DatabaseIcon,
  GraphBarIcon,
  LayoutGroupIcon,
  VectorSquareIcon,
} from "@/assets/icons"
import { ResultState } from "@/redux/results/reducer"

const DetailSection = () => {

  const availableBenchmarks = useSelector((state: { results: ResultState }) => {
    return state.results.availableBenchmarks
  })

  const availableSolves = useSelector((state: { results: ResultState }) => {
    return state.results.availableSolves
  })

  console.log(availableBenchmarks);


  const detailData = [
    {
      label: "Solvers",
      value: availableSolves.length,
      icon: <VectorSquareIcon />,
    },
    {
      label: "Iteration",
      value: "1",
      icon: <LayoutGroupIcon />,
    },
    {
      label: "Benchmarks",
      value: availableBenchmarks.length,
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
