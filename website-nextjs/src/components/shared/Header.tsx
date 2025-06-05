"use client";
import { useState } from "react";
import Image from "next/image";
import { ArrowUpLeftIcon, CloseIcon, MenuIcon } from "../../assets/icons";
import Link from "next/link";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-navy flex item-end">
      <nav
        className="flex items-center justify-between pt-11 pb-10 mx-auto max-w-8xl w-full px-4 lg:px-[70px]"
        aria-label="Global"
      >
        <div className="flex w-max">
          <a
            href="#"
            className="-m-1.5 p-1.5 item-center lg:items-start flex font-league font-bold text-white text-2xl sm:text-4xl w-max"
          >
            <div className="w-[35.5px] sm:w-[49.7px] relative lg:w-[71px]">
              <svg
                className="absolute w-[35.5px] h-[43px] sm:w-[49.7px]
                  sm:h-[60.2px] lg:w-[71px] lg:h-[86px] -top-[6px] sm:-top-[12px]
                  lg:-top-[0.75rem] left-0
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
            <div className="pt-0 lg:pt-4 pl-2 lg:pl-4 text-[28px]">
              SOLVER BENCHMARK
            </div>
          </a>
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 pt-2 lg:pt-0"
          >
            <MenuIcon className="text-white h-6 w-6" />
          </button>
        </div>
        <div className="hidden lg:flex gap-x-6 2xl:gap-x-12 text-white px-6 2xl:px-24">
          <Link
            href="#benchmarks"
            className="text-sm/6 font-medium hover:underline underline-offset-4"
          >
            BENCHMARKS
          </Link>
          <Link
            href="#mission"
            className="text-sm/6 font-medium hover:underline underline-offset-4"
          >
            MISSION
          </Link>
          <Link
            href="#methodology"
            className="text-sm/6 font-medium hover:underline underline-offset-4"
          >
            METHODOLOGY
          </Link>
          <Link
            href="#contribution"
            className="text-sm/6 font-medium hover:underline underline-offset-4"
          >
            CONTRIBUTIONS
          </Link>
          <Link
            href="#faq"
            className="text-sm/6 font-medium hover:underline underline-offset-4"
          >
            FAQs
          </Link>
          <Link
            href="#contact"
            className="text-sm/6 font-medium hover:underline underline-offset-4"
          >
            CONTACT
          </Link>
        </div>
        <div className="hidden lg:flex w-max">
          <Link
            href="https://openenergytransition.org/"
            className="
              2xl:px-7
              border
              border-[#EBEFF24D]
              border-opacity-30
              rounded-2xl
              flex
              focus-visible:outline
              focus-visible:outline-2
              focus-visible:outline-offset-2
              font-bold
              gap-1
              px-6
              py-3
              shadow-sm
              text-base
              w-max
            "
          >
            <Image
              src="/logo/logo-light.svg"
              alt="Open Energy Transition Logo"
              width={47}
              height={22}
              className="hidden lg:block"
            />
            <ArrowUpLeftIcon className="rotate-90 text-white" />
          </Link>
        </div>
      </nav>

      {/* <!-- Mobile menu, show/hide based on menu open state. --> */}
      {isMenuOpen && (
        <div className="lg:hidden" role="dialog" aria-modal="true">
          {/* <!-- Background backdrop, show/hide based on slide-over state. --> */}
          <div className="fixed inset-0 z-50"></div>
          <div className="fixed mt-12 inset-y-0 right-0 z-50 w-screen left-0 overflow-y-auto bg-navy px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <div className="flex items-center justify-between font-league font-bold text-white text-3xl md:text-4xl">
              <a href="#" className="-m-1.5 p-1.5">
                <div className="flex">
                  <Image
                    src="/logo.png"
                    alt="Contribution image"
                    width={43}
                    height={43}
                  />
                </div>
              </a>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="-m-2.5 rounded-md p-2.5 text-white"
              >
                <span className="sr-only">Close menu</span>
                <CloseIcon className="text-white h-6 w-6" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                <div className="space-y-2 py-6">
                  <Link
                    href="#benchmarks"
                    onClick={() => setIsMenuOpen(false)}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-white "
                  >
                    BENCHMARKS
                  </Link>
                  <Link
                    href="#mission"
                    onClick={() => setIsMenuOpen(false)}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-white"
                  >
                    MISSION
                  </Link>
                  <Link
                    href="#methodology"
                    onClick={() => setIsMenuOpen(false)}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-white"
                  >
                    METHODOLOGY
                  </Link>
                  <Link
                    href="#contribution"
                    onClick={() => setIsMenuOpen(false)}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-white"
                  >
                    CONTRIBUTIONS
                  </Link>
                  <Link
                    href="#faq"
                    onClick={() => setIsMenuOpen(false)}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-white"
                  >
                    FAQs
                  </Link>
                  <Link
                    href="#contact"
                    onClick={() => setIsMenuOpen(false)}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-white"
                  >
                    CONTACT
                  </Link>
                  <Link
                    onClick={() => setIsMenuOpen(false)}
                    href="https://openenergytransition.org/"
                    className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-white"
                  >
                    OPEN ENERGY TRANSITION
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
export default Header;
