import Link from "next/link";
import { ROOT_PATH } from "@/constants/path";

const HowDoWeBenchmarkSection = () => {
  return (
    <div
      id="methodology"
      className="text-navy bg-[#F5F4F4] py-5 scroll-mt-[6rem]"
    >
      <div
        className="
          xl:flex
          mx-auto
          max-w-8xl
          px-4
          lg:px-[70px]
          lg:pr-[44px]
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
          <h3 className="leading-1.4 mb-2">HOW DO WE BENCHMARK?</h3>
        </div>
        <div className="w-full xl:w-[67.42%] xl:pr-32">
          <div className="text-medium-normal max-w-4xl mb-2.5 xl:pl-4.5 mt-10">
            We run the benchmarks on cloud virtual machines (VMs) for efficiency
            and cost reasons, and have validated that the measured runtimes have
            acceptable error margins. We use a custom built benchmarking
            infrastructure based on Python and OpenTofu, that is open,
            transparent, and fully reproducible -- meaning you can also use it
            to run your own benchmarks!
          </div>
          <div className="mt-6 xl:ml-4 text-medium-normal">
            Read more about our methodology, caveats, and known issues{" "}
            <Link
              href={ROOT_PATH.methodology}
              className="hover:underline underline-offset-4 cursor-pointer"
            >
              here →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowDoWeBenchmarkSection;
