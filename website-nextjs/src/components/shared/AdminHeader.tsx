import { GithubIcon } from "@/assets/icons";
import { ReactNode, useState } from "react";
import { useDispatch } from "react-redux";
import navbarActions from "@/redux/theme/actions";

const AdminHeader = ({ children }: { children: ReactNode }) => {
  const dispatch = useDispatch();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    dispatch(navbarActions.toggleNav());
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="flex items-center mx-auto py-5 px-4 md:px-8">
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center truncate">{children}</div>
        </div>

        <div className="flex items-center flex-none ml-4">
          {/* Mobile menu button */}
          <button
            onClick={toggleMobileMenu}
            type="button"
            className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg lg:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
            aria-controls="mobile-menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span className="sr-only">Open main menu</span>
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

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
          isMobileMenuOpen ? "block" : "hidden"
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
