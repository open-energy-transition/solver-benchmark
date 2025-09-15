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
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";

import navbarActions from "@/redux/theme/actions";
import Link from "next/link";
import { PATH_DASHBOARD } from "@/constants/path";
import Popup from "reactjs-popup";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useEffect } from "react";
import debounce from "lodash/debounce";

const SMALL_SCREEN_BREAKPOINT = 1336;

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

  useEffect(() => {
    const navExpanded = localStorage.getItem("navExpanded") === "true" || false;
    const handleResize = debounce(() => {
      if (window.innerWidth < SMALL_SCREEN_BREAKPOINT) {
        dispatch(navbarActions.setNavExpanded(false));
      } else if (window.innerWidth >= SMALL_SCREEN_BREAKPOINT) {
        dispatch(navbarActions.setNavExpanded(navExpanded));
      }
    }, 250); // 250ms delay

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      handleResize.cancel(); // Cancel any pending debounced calls
      window.removeEventListener("resize", handleResize);
    };
  }, [dispatch]);

  return (
    <>
      {/* Mobile Menu Overlay */}
      {isNavExpanded && (
        <div
          className="sm:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => dispatch(navbarActions.toggleNav())}
        />
      )}

      <div
        className={`fixed md:pt-0 z-50 top-0 left-0 h-screen bg-navy rounded-e-xl
        ${isNavExpanded ? "w-[90%] md:w-64" : "w-0 md:w-20"}
        sm:translate-x-0 transition-all duration-300 ease-in-out overflow-hidden`}
        aria-label="Sidenav"
      >
        {/* Mobile Menu Button */}
        {isNavExpanded && (
          <button
            onClick={() => dispatch(navbarActions.toggleNav())}
            className="delayedShow block lg:hidden fixed top-4 right-4 z-max p-2 bg-white rounded-full text-navy"
          >
            <CloseIcon className="size-6" />
          </button>
        )}
        {/* Close button for mobile */}
        <div className="overflow-auto overflow-x-hidden py-5 px-0 h-full text-white">
          <div className="pt-5 mb-8">
            <Link
              href="/"
              className={`-m-1.5 p-1.5 transition-all duration-300 ease-in-out flex flex-col items-center gap-0.5 text-white w-max hover:no-underline mx-auto
                }`}
            >
              <div
                className={`w-[71px] h-[86px] ${
                  isNavExpanded ? "" : "scale-75"
                }`}
              >
                <svg
                  className="
                "
                  width="71"
                  height="86"
                  viewBox="0 0 71 86"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M30.5459 27.8664L10.1738 39.0466L10.0868 0L30.5459 13.5408V27.8664Z"
                    fill="#6B9080"
                  />
                  <path
                    d="M30.2274 50.3994L50.3398 39.2184L30.5393 27.8748L30.2274 50.3994Z"
                    fill="#4F4E4E"
                  />
                  <path
                    d="M30.2294 50.3995L50.359 61.8602L50.3612 39.248L30.2294 50.3995Z"
                    fill="#FFB27D"
                  />
                  <path
                    d="M10.1565 62.6632L30.4063 50.2264L10.1584 39.1022L10.1565 62.6632Z"
                    fill="#1286A0"
                  />
                  <path
                    d="M30.1434 73.2768L30.2279 50.2277L10.1751 62.7699L30.1434 73.2768Z"
                    fill="#D9D9D9"
                  />
                  <path
                    d="M30.0731 73.2871L50.4084 61.9323L30.2999 50.2786L30.0731 73.2871Z"
                    fill="#BFD8C7"
                  />
                  <path
                    d="M10.1738 39.0476L30.2448 50.229L30.574 27.8672L10.1738 39.0476Z"
                    fill="#6B9080"
                  />
                  <path
                    d="M60.532 44.1013L60.4837 68.0722L39.8915 80.0988L31.9707 75.4821L52.4638 63.6328L52.7036 39.3248L60.532 44.1013Z"
                    fill="#FFB27D"
                  />
                  <path
                    d="M30.3287 35.9668L42.9042 43.2273V57.7483L30.3287 65.0089L17.7531 57.7483V43.2273L30.3287 35.9668Z"
                    fill="white"
                    fillOpacity="0.4"
                  />
                </svg>
              </div>
              <div className="h-6">
                <div
                  className={`font-lato text-[16px]/1.5 font-bold
                    transition-all duration-200 ease-in-out
                    ${isNavExpanded ? "opacity-100" : "hidden"}
                  `}
                >
                  Open Energy Benchmark
                </div>
              </div>
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
                          flex items-center h-[55px] text-lavender font-normal
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
                          <span className="ml-3.5 pl-[1px] text-lg relative">
                            <span className="absolute left-0 w-max top-1/2 -translate-y-1/2">
                              {navData.label}
                            </span>
                          </span>
                        )}
                      </Link>
                    </div>
                  )}
                  position="right center"
                  closeOnDocumentClick
                >
                  <div className="text-white bg-navy p-2 rounded">
                    {navData.label}
                  </div>
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
          <div
            onClick={() => {
              localStorage.setItem("navExpanded", (!isNavExpanded).toString());
              dispatch(navbarActions.toggleNav());
            }}
            className="inline-flex justify-center items-center text-[#C1C1C1] text-lg rounded cursor-pointer font-league gap-2 leading-none"
          >
            {isNavExpanded && "Collapse"}
            <ArrowToRightIcon className={isNavExpanded ? "rotate-180" : ""} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
