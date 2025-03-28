import { LongArrowIcon } from "@/assets/icons";
import Image from "next/image";
import Link from "next/link";

const MainContent = () => {
  return (
    <div className="relative pt-4 bg-no-repeat bg-cover bg-navy">
      <div
        className="h-[62%] w-full absolute bottom-0"
        style={{
          background: ` linear-gradient(to bottom,
  rgba(29, 29, 29, 0.02) 2%,
  rgba(29, 29, 29, 0.10) 10%,
  rgba(29, 29, 29, 0.40) 40%,
  rgba(29, 29, 29, 0.60) 60%,
  rgba(29, 29, 29, 0.80) 80%
)`,
        }}
      ></div>
      <div className="px-4 pb-9 lg:px-6 mx-auto container relative flex">
        <div className="text-start md:w-10/12 lg:pb-28">
          <div className="max-w-[697px] pt-20">
            <h1 className="leading-[120%] text-white text-4xl font-normal tracking-tight sm:text-[52px] box-decoration-clone">
              <span className="font-bold">Open-source benchmark</span> of{" "}
              <span className="font-bold">LP/MILP solvers</span> on realistic
              problems from the energy planning domain.
            </h1>
          </div>
          <div className="mt-4 text-grey text-2xl font-light leading-[120%] tracking-normal max-w-[670px]">
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

          <div className="mt-[90px] grid md:flex items-center justify-start gap-2 md:gap-6 text-center">
            <a
              id="benchmark-section"
              href="#"
              className="rounded-3xl px-8 py-4 text-navy leading-[100%] tracking-wide font-medium font-league text-lg md:text-xl bg-white shadow-sm  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 "
            >
              Key Insights
            </a>
            <Link
              href="/dashboard/home"
              className="rounded-3xl flex gap-3 items-center px-8 py-4 text-[#F0ECE4] font-bold text-lg md:text-xl bg-teal shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              BENCHMARK RESULTS
              <LongArrowIcon />
            </Link>
          </div>
        </div>
        <div className="hidden lg:block w-full max-w-[40%] aspect-[8/10] relative border-[16px] border-[#CFE7FF] rounded-[52px] overflow-hidden">
          <Image
            src="/landing_page/main_bg.png"
            alt="Background"
            fill
            style={{ objectFit: "cover" }}
            quality={100}
            priority
          />
        </div>
      </div>
    </div>
  );
};
export default MainContent;
