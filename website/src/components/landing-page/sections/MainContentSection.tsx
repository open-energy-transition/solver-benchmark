import Link from "next/link";
import { useEntranceAnimation } from "@/hooks/useGsapAnimation";

const MainContent = () => {
  const headingRef = useEntranceAnimation<HTMLHeadingElement>({
    y: 60,
    duration: 1,
    ease: "power4.out",
  });
  const subtitleRef = useEntranceAnimation<HTMLDivElement>({
    y: 30,
    duration: 0.8,
    delay: 0.5,
    ease: "power3.out",
  });

  return (
    <div className="bg-[#F4F6FA]">
      <div className="pb-8 pt-8 md:pt-10 mx-auto max-w-8xl px-4 md:px-12">
        <div className="text-start md:w-10/12">
          <div className="max-w-screen-lg">
            <h1
              ref={headingRef}
              className="inline text-navy box-decoration-clone"
            >
              Open benchmark of solvers for energy planning
            </h1>
          </div>
          <div ref={subtitleRef} className="mt-4 text-navy text-2xl font-light">
            <div className="font-light text-navy text-sm sm:text-base font-lato sm:leading-1.4 tracking-normal">
              Built by{" "}
              <span className="font-bold">
                <Link
                  href="https://openenergytransition.org/"
                  aria-label={`Navigate to Open Energy Transition website`}
                >
                  Open Energy Transition
                </Link>
              </span>
              , with funding from{" "}
              <span className="font-bold">
                <Link
                  href="https://www.breakthroughenergy.org/"
                  aria-label="Navigate to Breakthrough Energy website"
                >
                  Breakthrough Energy
                </Link>
              </span>
              , and contributions from the community.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainContent;
