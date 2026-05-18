import Link from "next/link";

const MainContent = () => {
  return (
    <div className="bg-white">
      <div className="pb-8 pt-8 md:pt-10 mx-auto max-w-8xl px-4 lg:px-[70px]">
        <div className="text-start md:w-10/12">
          <div className="max-w-screen-lg">
            <h1 className="inline text-navy box-decoration-clone">
              An open-source benchmark of optimization solvers on representative
              problems from the energy planning domain.
            </h1>
          </div>
          <div className="mt-4 text-navy text-2xl font-light">
            <div className="font-light text-navy text-lg sm:text-2xl font-lato sm:leading-1.4 tracking-normal">
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
        </div>
      </div>
    </div>
  );
};

export default MainContent;
