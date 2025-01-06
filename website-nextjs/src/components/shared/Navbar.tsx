import {
  AlignLeftJustifyIcon,
  ArrowToRightIcon,
  BalanceScaleIcon,
  ChartBarIcon,
  ChartLineIcon,
  WindowIcon,
} from "@/assets/icons"
import Image from "next/image"

const Navbar = () => {
  const navConfig = [
    {
      label: "Home",
      icon: <AlignLeftJustifyIcon />,
    },
    {
      label: "Benchmark details",
      icon: <ChartBarIcon />,
    },
    {
      label: "Compare solvers",
      icon: <BalanceScaleIcon />,
    },
    {
      label: "Performance history",
      icon: <ChartLineIcon />,
    },
    {
      label: "Raw result data",
      icon: <WindowIcon />,
    },
  ]

  return (
    <>
      <div
        className="fixed top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0
        bg-navy rounded-tr-3xl rounded-br-3xl"
        aria-label="Sidenav"
      >
        <div className="overflow-y-auto py-5 px-3 h-full  text-white">
          <div className="mb-4">
            <a
              href="#"
              className="-m-1.5 p-1.5 flex gap-1 font-league font-bold text-white text-base w-max"
            >
              <div className="w-14 h-14">
                <Image
                  src="/logo.png"
                  alt="Contribution image"
                  width={64}
                  height={64}
                />
              </div>
              <div className="font-league">
                SOLVER
                <br />
                BENCHMARK
              </div>
            </a>
          </div>
          <ul className="space-y-2">
            {navConfig.map((navData, idx) => (
              <li key={idx}>
                <a
                  href="#"
                  className="flex items-center p-2 text-xl text-lavender font-normal rounded-lg dark:text-white hover:bg-gray-100 font-league"
                >
                  {navData.icon}
                  <span className="ml-3">{navData.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="hidden absolute bottom-0 left-0 justify-center p-4 space-x-4 w-full lg:flex ">
          <a
            href="#"
            className="inline-flex justify-center p-2 text-dark-grey text-lg rounded cursor-pointer font-league gap-2"
          >
            Collapse
            <ArrowToRightIcon />
          </a>
        </div>
      </div>
    </>
  )
}

export default Navbar
