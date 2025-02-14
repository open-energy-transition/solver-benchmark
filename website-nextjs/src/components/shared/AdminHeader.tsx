import { ForkIcon, GithubIcon } from "@/assets/icons"

import { ReactNode } from "react";

const AdminHeader = ({ children }: { children: ReactNode }) => {
  return (
    <nav>
      <div className="flex flex-wrap items-center justify-between mx-auto py-5 pr-8">
        {children}

        {/* Mobile UI */}
        <div className="flex lg:hidden items-center md:order-2 space-x-3 md:space-x-0">
          <button
            type="button"
            className="flex text-sm bg-gray-800 rounded-full md:me-0 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
            id="user-menu-button"
            aria-expanded="false"
            data-dropdown-toggle="user-dropdown"
            data-dropdown-placement="bottom"
          >
            <span className="sr-only">Open user menu</span>
          </button>
          <button
            data-collapse-toggle="navbar-user"
            type="button"
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
            aria-controls="navbar-user"
            aria-expanded="false"
          >
            <span className="sr-only">Open main menu</span>
            <svg
              className="w-5 h-5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 17 14"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M1 1h15M1 7h15M1 13h15"
              />
            </svg>
          </button>
        </div>
        <div
          className="items-center justify-between hidden w-full md:flex md:w-auto md:order-1"
          id="navbar-user"
        >
          <ul className="flex flex-col font-medium text-sm p-4 md:p-0 pr-2 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:mt-0 md:border-0 gap-4">
            <li>
              <a
                href="#"
                className="block py-2 px-3 text-black rounded md:bg-transparent md:p-0"
                aria-current="page"
              >
                <ForkIcon />
              </a>
            </li>
            <li>
              <a
                href="#"
                className="block py-2 px-3 text-black rounded hover:bg-gray-100 md:hover:bg-transparent md:p-0 dark:text-white "
              >
                <GithubIcon />
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}

export default AdminHeader
