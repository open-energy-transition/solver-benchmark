"use client"
import { useState } from "react"
import Image from "next/image"
import { ArrowUpLeftIcon, CloseIcon, MenuIcon } from "../../assets/icons"
import Link from "next/link"

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-navy flex item-end">
      <nav
        className="flex items-center justify-between px-4 lg:px-8 pt-12 pb-8 mx-auto container"
        aria-label="Global"
      >
        <div className="flex w-max">
          <a
            href="#"
            className="-m-1.5 p-1.5 flex gap-1 font-league font-bold text-white text-2xl sm:text-3xl 2xl:text-4xl w-max"
          >
            <div className="w-8 h-8 lg:w-10 lg:h-10">
              <Image
                src="/logo.png"
                alt="Contribution image"
                width={35}
                height={35}
              />
            </div>
            SOLVER BENCHMARK
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
          <a href="#benchmark-section" className="text-sm/6 font-semibold">
            BENCHMARKS
          </a>
          <a href="#contribution-section" className="text-sm/6 font-semibold">
            CONTRIBUTIONS
          </a>
          <a href="#mission-section" className="text-sm/6 font-semibold">
            MISSION
          </a>
          <a href="#faq-section" className="text-sm/6 font-semibold">
            FAQs
          </a>
        </div>
        <div className="hidden lg:flex w-max">
          <Link
            href="https://openenergytransition.org/"
            className="flex gap-1 rounded-lg px-4 2xl:px-7 py-3 text-base text-navy font-bold bg-white shadow-sm
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-max"
          >
            OPEN ENERGY TRANSITION
            <ArrowUpLeftIcon className="rotate-90" />
          </Link>
        </div>
      </nav>

      {/* <!-- Mobile menu, show/hide based on menu open state. --> */}
      {isMenuOpen && (
        <div className="lg:hidden" role="dialog" aria-modal="true">
          {/* <!-- Background backdrop, show/hide based on slide-over state. --> */}
          <div className="fixed inset-0 z-50"></div>
          <div className="fixed inset-y-0 right-0 z-50 w-screen left-0 overflow-y-auto bg-navy px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
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
                  <a
                    href="#"
                    className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-white "
                  >
                    BENCHMARKS
                  </a>
                  <a
                    href="#"
                    className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-white"
                  >
                    CONTRIBUTIONS
                  </a>
                  <a
                    href="#"
                    className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-white"
                  >
                    MISSION
                  </a>
                  <a
                    href="#"
                    className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-white"
                  >
                    FAQs
                  </a>
                  <Link
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
  )
}
export default Header
