import { ArrowUpIcon } from "@/assets/icons";
import Image from "next/image";
import Link from "next/link";
import { PATH_DASHBOARD, ROOT_PATH } from "@/constants/path";

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

      <div className="pb-12 pt-24 md:pt-[18rem] mx-auto max-w-8xl px-4 lg:px-[70px] relative">
        <div className="text-start md:w-10/12">
          <div className="max-w-screen-lg">
            <h1 className="inline text-white box-decoration-clone">
              An open-source benchmark of optimization solvers on representative
              problems from the energy planning domain.
            </h1>
          </div>
          <div className="mt-4 text-grey text-2xl font-light">
            <div className="font-light text-grey text-lg sm:text-2xl font-lato sm:leading-1.4 tracking-normal">
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
            </div>
          </div>

          <div className="mt-8 grid sm:flex items-center justify-start gap-2 md:gap-6 text-center">
            <Link
              href={ROOT_PATH.keyInsights}
              className="
                  bg-white
                  cursor-pointer
                  duration-200
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
                  transition-all
                "
            >
              KEY INSIGHTS
            </Link>

            <Link
              href={PATH_DASHBOARD.home}
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
              <span>DETAILED RESULTS</span>
              <ArrowUpIcon className="ml-3 text-white rotate-90 size-6" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainContent;
