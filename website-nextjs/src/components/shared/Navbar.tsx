import {
  AlignLeftJustifyIcon,
  ArrowToRightIcon,
  BalanceScaleIcon,
  ChartBarIcon,
  ChartLineIcon,
  VectorSquareIcon,
  WindowIcon,
} from "@/assets/icons";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { useCallback } from "react";

import navbarActions from "@/redux/theme/actions";
import Link from "next/link";
import { PATH_DASHBOARD } from "@/constants/path";

const Navbar = () => {
  const router = useRouter();
  const currentRoute = router.pathname;

  const handleNavigation = useCallback(
    (route: string) => {
      router.replace({
        pathname: route,
        query: {}, // Empty query object to clear parameters
      });
    },
    [router],
  );

  const navConfig = [
    {
      label: "Home",
      route: "/dashboard/home",
      icon: <AlignLeftJustifyIcon />,
    },
    {
      label: "Benchmark details",
      route: PATH_DASHBOARD.benchmarkDetail.list,
      icon: <ChartBarIcon />,
    },
    {
      label: "Solvers",
      route: "/dashboard/solvers",
      icon: <VectorSquareIcon />,
    },
    {
      label: "Compare solvers",
      route: "/dashboard/compare-solvers",
      icon: <BalanceScaleIcon />,
    },
    {
      label: "Performance history",
      route: "/dashboard/performance-history",
      icon: <ChartLineIcon />,
    },
    {
      label: "Full Results",
      route: "/dashboard/raw-result",
      icon: <WindowIcon />,
    },
  ];

  const dispatch = useDispatch();
  const isNavExpanded = useSelector(
    (state: { theme: { isNavExpanded: boolean } }) => state.theme.isNavExpanded,
  );

  return (
    <>
      <div
        className={`fixed top-0 left-0 z-40 h-screen transition-transform -translate-x-full sm:translate-x-0
        bg-navy rounded-tr-3xl rounded-br-3xl ${
          isNavExpanded ? "w-64" : "z-max"
        }`}
        aria-label="Sidenav"
      >
        <div className="overflow-auto overflow-x-hidden py-5 px-0 h-full text-white">
          <div className="pt-12 pb-11">
            <Link
              href="/"
              className={`-m-1.5 p-1.5 flex items-center gap-0.5 text-white w-max
                 ${isNavExpanded ? "px-16" : "px-4"}`}
            >
              <div className="size-10">
                <Image
                  src="/logo.png"
                  alt="Contribution image"
                  width={35}
                  height={35}
                />
              </div>
              {isNavExpanded && (
                <div className="font-grotesk font-thin text-base leading-[21px]">
                  Solver
                  <br />
                  Benchmark
                </div>
              )}
            </Link>
          </div>
          <ul className="space-y-2">
            {navConfig.map((navData, idx) => (
              <li key={idx}>
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation(navData.route);
                  }}
                  href={navData.route}
                  className={`flex items-center h-[55px] text-lavender font-normal font-league
                     ${
                       currentRoute === navData.route
                         ? "bg-white bg-opacity-40"
                         : ""
                     }
                     ${
                       isNavExpanded
                         ? "pl-8 pr-2 justify-start"
                         : "px-2 justify-center"
                     }
                    `}
                >
                  {navData.icon}
                  {isNavExpanded && (
                    <span className="ml-3.5 pl-[1px] text-xl mt-0.5">
                      {navData.label}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div
          className={`hidden absolute bottom-2 left-0 justify-center pb-24 space-x-4 w-full lg:flex ${
            isNavExpanded ? "pl-2" : ""
          }`}
        >
          <a
            onClick={() => dispatch(navbarActions.toggleNav())}
            href="#"
            className="inline-flex justify-center items-center text-dark-grey text-lg rounded cursor-pointer font-league gap-2 leading-none"
          >
            {isNavExpanded && "Collapse"}
            <ArrowToRightIcon className={isNavExpanded ? "rotate-180" : ""} />
          </a>
        </div>
      </div>
    </>
  );
};

export default Navbar;
