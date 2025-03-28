import Image from "next/image";
import {
  CircleOutlineIcon,
  ForkIcon,
  GithubIcon,
  OutIcon,
  StarIcon,
  UserIcon,
} from "@/assets/icons";
import Link from "next/link";

const Contribute = () => {
  return (
    <div className="text-navy bg-white pt-[6.5rem] pb-4">
      <div className="mx-auto container px-4 lg:px-6">
        <div className="grid md:flex justify-between relative">
          <div className="w-full lg:w-[60%]">
            <div className="text-dark-grey text-xl leading-1.1 uppercase font-bold font-league mt-2.5 mb-4">
              contributions
            </div>
            <div className="text-[4rem] leading-1.1 font-league mb-2">
              <div className="font-bold">CHECK OUT OUR CODE,</div>
              <div className="font-bold">JOIN THE EFFORT!</div>
            </div>
            <h5 className="text-dark-grey max-w-lg lg:w-10/12 w-">
              We accept community contributions for new benchmarks, new /
              updated solver versions, and feedback on the benchmarking
              methodology and metrics via our
              <span className="font-bold ml-1">GitHub repository</span>
              <span className="text-green-pop font-bold">.</span>
            </h5>
            <div className="grid justify-center md:flex md:justify-between text-black max-w-lg pt-1">
              <div className="py-9 text-center flex-1">
                <div className="font-bold flex items-center">
                  <UserIcon className="mr-2" />
                  <h5 className="font-bold">03</h5>
                </div>
                <p className="text-base text-left mt-2">Contributors</p>
              </div>
              <div className="py-9 text-center flex-1">
                <div className="font-bold flex items-center">
                  <CircleOutlineIcon className="mr-2" />
                  <h5 className="font-bold">05</h5>
                </div>
                <p className="text-base text-left mt-2">Issues</p>
              </div>
              <div className="py-9 text-center flex-1">
                <div className="font-bold flex items-center">
                  <StarIcon className="mr-2" />
                  <h5 className="font-bold">02</h5>
                </div>
                <p className="text-base text-left mt-2">Stars</p>
              </div>
              <div className="py-9 text-center flex-1">
                <div className="flex items-center">
                  <ForkIcon className="mr-2" />
                  <h5 className="font-bold">01</h5>
                </div>
                <p className="text-base text-left mt-2">Fork</p>
              </div>
            </div>
            <Link
              href="https://github.com/open-energy-transition/solver-benchmark"
              className="mt-6 mb-4 flex items-center gap-2 rounded-3xl px-7 py-3 text-base text-white font-lato font-bold bg-navy shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-max"
            >
              <GithubIcon />
              <span>GITHUB REPOSITORY</span>
              <OutIcon />
            </Link>
          </div>
          <div className="absolute top-[-14%] h-[113%] w-0 lg:w-[45%] right-0">
            <div className="hidden md:block h-full bg-navy rounded-3xl md:rounded-[69px] relative">
              <div className="absolute left-4 top-4 z-1 w-[75%] h-[75%] z-20">
                <Image
                  className="h-full w-auto object-cover rounded-2xl md:rounded-[52px] brightness-200"
                  src="/landing_page/git_bg.jpeg"
                  alt="Contribution image"
                  width={517}
                  height={494}
                />
              </div>
              <div className="absolute right-4 bottom-4 h-[71%] w-[55%] w z-10">
                <Image
                  className="w-auto h-full object-cover rounded-2xl md:rounded-[52px] brightness-200"
                  src="/landing_page/contribution.png"
                  alt="Contribution image"
                  width={517}
                  height={494}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Contribute;
