import {
  AlignLeftJustifyIcon,
  ArrowToRightIcon,
  BalanceScaleIcon,
  ChartBarIcon,
  ChartLineIcon,
  VectorSquareIcon,
  WindowIcon,
  QuestionLineIcon,
} from "@/assets/icons";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { useState } from "react";

import navbarActions from "@/redux/theme/actions";
import Link from "next/link";
import { PATH_DASHBOARD } from "@/constants/path";

const Navbar = () => {
  const router = useRouter();
  const currentRoute = router.pathname;
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [selectedHelpRoute, setSelectedHelpRoute] = useState("");

  const navConfig = [
    {
      label: "Home",
      route: "/dashboard/home",
      icon: <AlignLeftJustifyIcon />,
      helperText:
        "Dashboard home provides an overview of the solver benchmark system.",
    },
    {
      label: "Benchmark details",
      route: PATH_DASHBOARD.benchmarkDetail.list,
      icon: <ChartBarIcon />,
      helperText:
        "Benchmark details page shows information about various benchmarks in the system.",
    },
    {
      label: "Solvers",
      route: "/dashboard/solvers",
      icon: <VectorSquareIcon />,
      helperText:
        "The Solvers page displays all available solvers and their basic information.",
    },
    {
      label: "Compare solvers",
      route: "/dashboard/compare-solvers",
      icon: <BalanceScaleIcon />,
      helperText:
        "Compare solvers allows you to see performance differences between multiple solvers.",
    },
    {
      label: "Performance history",
      route: "/dashboard/performance-history",
      icon: <ChartLineIcon />,
      helperText:
        "Performance history shows how solver performance has changed over time.",
    },
    {
      label: "Full Results",
      route: "/dashboard/raw-result",
      icon: <WindowIcon />,
      helperText:
        "Full Results page provides detailed raw data from solver executions.",
    },
  ];

  // Help content based on selected route
  const getHelpContent = () => {
    const currentNavItem = navConfig.find(
      (item) => item.route === selectedHelpRoute,
    );
    return (
      currentNavItem?.helperText || "Select a section to see more information."
    );
  };

  // Help modal component
  const HelpModal = () => {
    if (!showHelpModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
          <h3 className="text-xl font-bold text-navy mb-4">Navigation Guide</h3>
          <p className="text-gray-700 mb-6">{getHelpContent()}</p>
          <div className="w-full text-end">
            <button
              className="bg-navy text-white px-4 py-2 rounded hover:bg-opacity-90"
              onClick={() => setShowHelpModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const dispatch = useDispatch();
  const isNavExpanded = useSelector(
    (state: { theme: { isNavExpanded: boolean } }) => state.theme.isNavExpanded,
  );

  return (
    <>
      <div
        className={`fixed top-0 left-0 z-40 h-screen transition-transform -translate-x-full sm:translate-x-0
        bg-navy rounded-tr-3xl rounded-br-3xl ${
          isNavExpanded ? "w-[17rem]" : "z-max"
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
              <li
                key={idx}
                className={`flex ${
                  currentRoute === navData.route ? "bg-white bg-opacity-40" : ""
                }`}
              >
                <Link
                  href={navData.route || "#"}
                  className={`flex items-center h-[55px] text-lavender font-normal font-league

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
                {/* Help button */}
                <div
                  onClick={() => {
                    setSelectedHelpRoute(navData.route);
                    setShowHelpModal(true);
                  }}
                  className="inline-flex justify-center items-center text-lavender hover:text-white rounded cursor-pointer font-league gap-2 leading-none"
                >
                  <QuestionLineIcon className="size-4" />
                </div>
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

      {/* Render help modal */}
      <HelpModal />
    </>
  );
};

export default Navbar;
