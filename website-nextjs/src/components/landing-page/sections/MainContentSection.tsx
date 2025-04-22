import { ArrowUpIcon } from "@/assets/icons";
import Image from "next/image";
import Link from "next/link";

const MainContent = () => {
  return (
    <div className="relative pt-4 bg-no-repeat bg-cover bg-navy bg-opacity-20 before:absolute">
      <div className="absolute inset-0 -my-2">
        <Image
          src="/landing_page/main_bg.png"
          alt="Background"
          fill
          style={{
            objectFit: "cover",
            backdropFilter: "blur(3.2px)",
            filter: "blur(3.2px)",
          }}
          quality={100}
        />
      </div>

      <div className="pb-12 pt-24 md:pt-64 px-4 lg:px-6 mx-auto container relative">
        <div className="text-start md:w-10/12">
          <div className="max-w-screen-lg">
            <h1 className="inline leading-1.4 text-white text-4xl font-semibold tracking-tight sm:text-[3.5rem] box-decoration-clone">
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
            <a
              id="benchmark-section"
              href="#"
              className="
                bg-white
                focus-visible:outline
                focus-visible:outline-2
                focus-visible:outline-offset-2
                font-bold
                md:text-xl
                px-8
                py-4
                rounded-2xl
                shadow-sm
                text-lg
                text-teal
              "
            >
              Getting started
            </a>
            <Link
              href="/dashboard/home"
              className="
                bg-teal
                flex
                focus-visible:outline
                focus-visible:outline-2
                focus-visible:outline-offset-2
                font-bold
                items-center
                md:text-xl
                px-8
                py-4
                rounded-2xl
                shadow-sm
                text-lg
                text-white
                "
            >
              <span>BENCHMARK RESULTS</span>
              <ArrowUpIcon className="ml-3 text-white rotate-90 size-6" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainContent;
