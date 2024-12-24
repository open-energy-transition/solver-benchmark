import Image from "next/image"

const MainContent = () => {
  return (
    <div className="relative pt-14 lg:px-8 bg-no-repeat bg-cover bg-navy bg-opacity-20 before:absolute">
      <Image
        className="absolute -z-10"
        src="/landing_page/main_bg.png"
        alt="Background"
        fill
        style={{ objectFit: 'cover' }}
        quality={100}
      />

      <div className="py-8 pt-24 md:pt-80 px-6 mx-auto container">
        <div className="text-start md:w-10/12">
          <h1 className="inline px-4 py-1 leading-relaxed md:!leading-normal border border-white border-opacity-10 bg-white bg-opacity-40 text-navy text-4xl font-semibold tracking-tight sm:text-6xl box-decoration-clone">
            An open-source benchmark of LP/MILP solvers on realistic problems
            from the energy planning domain.
          </h1>
          <div className="mt-6 text-grey text-2xl font-light">
            <p>
              A platform comparing solvers on diverse, representative, and
              meaningful benchmarks.
            </p>
            <p>
              Use our open data and intuitive graphs to make informed decisions.
            </p>
          </div>

          <div className="mt-6 grid md:flex items-center justify-start gap-2 md:gap-6 text-center">
            <a
              href="#"
              className="rounded-md px-8 py-4 text-white font-bold text-lg md:text-xl bg-teal shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              BENCHMARK RESULTS
            </a>
            <a
              href="#"
              className="rounded-md px-8 py-4 text-teal font-bold text-lg md:text-xl bg-white shadow-sm  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 "
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
