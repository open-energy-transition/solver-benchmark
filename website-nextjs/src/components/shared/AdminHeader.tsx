import { GithubIcon } from "@/assets/icons";
import { ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import navbarActions from "@/redux/theme/actions";

const AdminHeader = ({ children }: { children: ReactNode }) => {
  const dispatch = useDispatch();

  const isNavExpanded = useSelector(
    (state: { theme: { isNavExpanded: boolean } }) => state.theme.isNavExpanded,
  );
  const toggleMobileMenu = () => {
    dispatch(navbarActions.toggleNav());
  };

  return (
    <nav>
      <div className="flex items-center mx-auto py-5 pr-4 md:pr-8">
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center truncate">{children}</div>
        </div>

        <div className="flex items-center flex-none ml-4">
          {/* Mobile menu button */}
          {!isNavExpanded && (
            <button
              onClick={toggleMobileMenu}
              type="button"
              className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg lg:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
              aria-controls="mobile-menu"
              aria-expanded={isNavExpanded}
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          )}

          {/* Desktop menu */}
          <div className="hidden lg:flex items-center space-x-4">
            <a
              href="https://github.com/open-energy-transition/"
              className="text-gray-700 hover:text-gray-900"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GithubIcon />
            </a>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`${
          isNavExpanded ? "block" : "hidden"
        } w-full lg:hidden mt-4`}
        id="mobile-menu"
      >
        <div className="flex flex-col space-y-4 px-2 pt-2 pb-3">
          <a
            href="https://github.com/open-energy-transition/"
            className="text-gray-700 hover:text-gray-900 flex items-center space-x-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GithubIcon />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </nav>
  );
};

export default AdminHeader;
