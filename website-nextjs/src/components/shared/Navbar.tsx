import {
  AlignLeftJustifyIcon,
  ArrowToRightIcon,
  BalanceScaleIcon,
  ChartBarIcon,
  ChartLineIcon,
  CloseIcon,
  VectorSquareIcon,
  WindowIcon,
} from "@/assets/icons";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";

import navbarActions from "@/redux/theme/actions";
import Link from "next/link";
import { PATH_DASHBOARD } from "@/constants/path";
import Popup from "reactjs-popup";
import { useIsMobile } from "@/hooks/useIsMobile";

const Navbar = () => {
  const router = useRouter();
  const currentRoute = router.pathname;
  const isMobile = useIsMobile();

  const navConfig = [
    {
      label: "Main Results",
      route: PATH_DASHBOARD.home,
      icon: <AlignLeftJustifyIcon />,
    },
    {
      label: "Benchmark Set",
      route: PATH_DASHBOARD.benchmarkSet.list,
      icon: <ChartBarIcon />,
    },
    {
      label: "Solvers",
      route: PATH_DASHBOARD.solvers,
      icon: <VectorSquareIcon />,
    },
    {
      label: "Compare Solvers",
      route: PATH_DASHBOARD.compareSolvers,
      icon: <BalanceScaleIcon />,
    },
    {
      label: "Performance History",
      route: PATH_DASHBOARD.performanceHistory,
      icon: <ChartLineIcon />,
    },
    {
      label: "Full Results",
      route: PATH_DASHBOARD.fullResults,
      icon: <WindowIcon />,
    },
  ];

  const dispatch = useDispatch();
  const isNavExpanded = useSelector(
    (state: { theme: { isNavExpanded: boolean } }) => state.theme.isNavExpanded,
  );

  return (
    <>
      {/* Mobile Menu Button */}
      {isNavExpanded && (
        <button
          onClick={() => dispatch(navbarActions.toggleNav())}
          className="block md:hidden fixed top-[100px] right-[15%] z-50 p-2 text-white"
        >
          <CloseIcon className="size-6" />
        </button>
      )}

      {/* Mobile Menu Overlay */}
      {isNavExpanded && (
        <div
          className="sm:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => dispatch(navbarActions.toggleNav())}
        />
      )}

      <div
        className={`fixed
          pt-[calc(var(--banner-height))] md:pt-0
          top-0 left-0 z-40 h-screen transition-transform bg-navy rounded-tr-4xl rounded-br-4xl
        ${isNavExpanded ? "w-[90%] md:w-64" : "w-0 md:w-20"}
        sm:translate-x-0`}
        aria-label="Sidenav"
      >
        {/* Close button for mobile */}
        <div className="overflow-auto overflow-x-hidden py-5 px-0 h-full text-white">
          <div className="pt-12 pb-11">
            <Link
              href="/"
              className={`-m-1.5 p-1.5 flex items-center gap-0.5 text-white w-max
                 ${isNavExpanded ? "px-16" : "px-4 pl-6"}`}
            >
              <div className="size-10">
                <Image
                  src="/logo.png"
                  alt="Contribution image"
                  width={35}
                  height={35}
                  className=""
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
                <Popup
                  on={["hover"]}
                  disabled={isMobile || isNavExpanded}
                  arrow
                  arrowStyle={{ color: "#ffffff" }}
                  trigger={() => (
                    <div>
                      <Link
                        onClick={() => {
                          if (window.innerWidth < 768) {
                            dispatch(navbarActions.toggleNav());
                          }
                        }}
                        scroll={false}
                        replace
                        href={navData.route}
                        className={`
                          flex items-center h-[55px] text-lavender font-normal font-league
                          hover:bg-white hover:bg-opacity-10
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
                      </Link>
                    </div>
                  )}
                  position="right center"
                  closeOnDocumentClick
                >
                  <div className="bg-white p-2 rounded">{navData.label}</div>
                </Popup>
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
            className="inline-flex justify-center items-center text-[#C1C1C1] text-lg rounded cursor-pointer font-league gap-2 leading-none"
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
