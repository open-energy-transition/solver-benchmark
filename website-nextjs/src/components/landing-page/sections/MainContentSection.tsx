import Image from "next/image"
import Link from "next/link"

const MainContent = () => {
  return (
    <div className="relative pt-4 bg-no-repeat bg-cover bg-navy bg-opacity-20 before:absolute">
      <Image
        className="absolute"
        src="/landing_page/main_bg.png"
        alt="Background"
        fill
        style={{ objectFit: "cover" }}
        quality={100}
      />

      <div className="pb-12 pt-24 md:pt-64 px-4 lg:px-6 mx-auto container relative">
        <div className="text-start md:w-10/12">
          <div className="max-w-screen-lg">
            <h1 className="inline leading-1.4 border border-white border-opacity-10 bg-white bg-opacity-40 text-navy text-4xl font-semibold tracking-tight sm:text-[3.5rem] box-decoration-clone">
              An open-source benchmark of LP/MILP solvers on realistic problems
              from the energy planning domain.
            </h1>
          </div>
          <div className="mt-4 text-grey text-2xl font-light">
            <p>
              Built by{" "}
              <span className="font-bold">
                <Link href="https://openenergytransition.org/">
                  Open Energy Transition
                </Link>
              </span>
                , with funding from{" "}
              <span className="font-bold">
                <Link href="https://www.breakthroughenergy.org/">
                  Breakthrough Energy
                </Link>
              </span>
              , and contributions from the community.
            </p>
          </div>

          <div className="mt-8 grid md:flex items-center justify-start gap-2 md:gap-6 text-center">
            <Link
              href="/dashboard/home"
              className="rounded-md px-8 py-3 text-white font-bold text-lg md:text-xl bg-teal shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              BENCHMARK RESULTS
            </Link>
            <a
              id="benchmark-section"
              href="#"
              className="rounded-md px-8 py-3 text-teal font-bold text-lg md:text-xl bg-white shadow-sm  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 "
            >
              KEY INSIGHTS
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MainContent
