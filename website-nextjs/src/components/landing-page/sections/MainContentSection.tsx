import { ArrowUpIcon } from "@/assets/icons";
import Image from "next/image";
import Link from "next/link";
import Popup from "reactjs-popup";

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

      <div className="pb-12 pt-24 md:pt-64 mx-auto max-w-8xl px-4 lg:px-[70px] relative">
        <div className="text-start md:w-10/12">
          <div className="max-w-screen-lg">
            <h2 className="inline text-white box-decoration-clone">
              An open-source benchmark of optimization solvers on representative
              problems from the energy planning domain.
            </h2>
          </div>
          <div className="mt-4 text-grey text-2xl font-light">
            <h5 className="font-light text-grey">
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
            </h5>
          </div>

          <div className="mt-8 grid sm:flex items-center justify-start gap-2 md:gap-6 text-center">
            <Popup
              on={["hover"]}
              trigger={() => (
                <div
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
                  hover:bg-gray-300
                "
                >
                  GETTING STARTED
                </div>
              )}
              position="top center"
              closeOnDocumentClick
              arrow={true}
            >
              <div className="bg-white px-4 py-2 rounded-lg">
                Work in progress: coming soon!
              </div>
            </Popup>

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
