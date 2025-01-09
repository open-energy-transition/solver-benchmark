import {
  AlignLeftJustifyIcon,
  ArrowToRightIcon,
  BalanceScaleIcon,
  ChartBarIcon,
  ChartLineIcon,
  WindowIcon,
} from "@/assets/icons"
import Image from "next/image"
import { useDispatch, useSelector } from "react-redux"
import { useRouter } from "next/router"

import navbarActions from "@/redux/theme/actions"
import Link from "next/link"

const Navbar = () => {
  const router = useRouter()
  const currentRoute = router.pathname

  const navConfig = [
    {
      label: "Home",
      route: "/admin/dashboard",
      icon: <AlignLeftJustifyIcon />,
    },
    {
      label: "Benchmark details",
      route: "/admin/benchmark-detail",
      icon: <ChartBarIcon />,
    },
    {
      label: "Compare solvers",
      route: "/admin/compare-solvers",
      icon: <BalanceScaleIcon />,
    },
    {
      label: "Performance history",
      route: "performance-history",
      icon: <ChartLineIcon />,
    },
    {
      label: "Raw result data",
      route: "raw-result",
      icon: <WindowIcon />,
    },
  ]

  const dispatch = useDispatch()
  const isNavExpanded = useSelector(
    (state: { theme: { isNavExpanded: boolean } }) => state.theme.isNavExpanded
  )

  return (
    <>
      <div
        className={`fixed top-0 left-0 z-40 h-screen transition-transform -translate-x-full sm:translate-x-0
        bg-navy rounded-tr-3xl rounded-br-3xl ${
          isNavExpanded ? "w-64" : "z-max"
        }`}
        aria-label="Sidenav"
      >
        <div className="overflow-y-auto py-5 px-0 h-full text-white">
          <div className="mb-4">
            <a
              href="#"
              className={`-m-1.5 p-1.5 flex gap-1 font-league font-bold text-white text-base w-max
                 ${isNavExpanded ? "px-16" : "px-4"}`}
            >
              <div className={`${isNavExpanded ? "w-14 h-14" : "w-10 h-10"}`}>
                <Image
                  src="/logo.png"
                  alt="Contribution image"
                  width={64}
                  height={64}
                />
              </div>
              {isNavExpanded && (
                <div className="font-league">
                  SOLVER
                  <br />
                  BENCHMARK
                </div>
              )}
            </a>
          </div>
          <ul className="space-y-2">
            {navConfig.map((navData, idx) => (
              <li key={idx}>
                <Link
                  href={navData.route || "#"}
                  className={`flex items-center py-4 text-xl text-lavender font-normal font-league
                     ${
                       currentRoute === navData.route
                         ? "bg-white bg-opacity-40"
                         : ""
                     }
                     ${
                       isNavExpanded
                         ? "px-8 justify-start"
                         : "px-2 justify-center"
                     }
                    `}
                >
                  {navData.icon}
                  {isNavExpanded && (
                    <span className="ml-3">{navData.label}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="hidden absolute bottom-0 left-0 justify-center p-4 space-x-4 w-full lg:flex ">
          <a
            onClick={() => dispatch(navbarActions.toggleNav())}
            href="#"
            className="inline-flex justify-center p-2 text-dark-grey text-lg rounded cursor-pointer font-league gap-2"
          >
            {isNavExpanded && "Collapse"}
            <ArrowToRightIcon />
          </a>
        </div>
      </div>
    </>
  )
}

export default Navbar
