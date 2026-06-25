import Link from "next/link";
import { ROOT_PATH } from "@/constants/path";
import { useStaggerReveal } from "@/hooks/useGsapAnimation";

const HowDoWeBenchmarkSection = () => {
  const sectionRef = useStaggerReveal<HTMLDivElement>(":scope .xl\\:flex > *", {
    fromDirection: "left",
    stagger: 0.5,
  });

  return (
    <div
      ref={sectionRef}
      id="methodology"
      className="text-white bg-navy py-5 scroll-mt-[6rem]"
    >
      <div
        className="
          xl:flex
          mx-auto
          max-w-8xl
          px-4
          md:px-12
          pt-[67px]
          pb-16
          justify-between
        "
      >
        <div className="w-full xl:w-1/4">
          <div
            className="
              tag-line-lg
              uppercase
              font-league
              mb-4
            "
          >
            Methodology
          </div>
          <div className="leading-1.4 mb-2 text-2xl sm:text-[40px] font-lato font-extrabold">
            HOW DO WE BENCHMARK?
          </div>
        </div>
        <div className="w-full xl:w-[67.42%]">
          <div className="text-medium-normal max-w-4xl mb-2.5 xl:pl-4.5 mt-10">
            We run the benchmarks on cloud virtual machines (VMs) for efficiency
            and cost reasons, and have validated that the measured runtimes have
            acceptable error margins. We use a custom built benchmarking
            infrastructure based on Python and OpenTofu, that is open,
            transparent, and fully reproducible -- meaning you can also use it
            to run your own benchmarks!
          </div>
          <div className="mt-6 xl:ml-4 text-medium-normal">
            Read more about our methodology, caveats, and known issues here:
          </div>
          <div>
            <Link
              href={ROOT_PATH.methodology}
              aria-label={`Navigate to methodology page`}
              className="bg-white mt-6 xl:ml-4 uppercase w-max flex focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 font-bold items-center md:text-xl px-8 py-4 rounded-2xl shadow-sm text-lg text-navy "
            >
              Methodology
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowDoWeBenchmarkSection;
