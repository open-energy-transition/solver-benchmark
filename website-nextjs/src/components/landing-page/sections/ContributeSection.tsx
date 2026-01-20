import Image from "next/image";
import {
  CircleOutlineIcon,
  ForkIcon,
  GithubIcon,
  LinkOutlineIcon,
  StarIcon,
  UserIcon,
} from "@/assets/icons";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchGitHubStats } from "@/utils/githubApi";

const Contribute = () => {
  const [stats, setStats] = useState({
    contributors: 0,
    issues: 0,
    stars: 0,
    forks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getGitHubStats = async () => {
      try {
        setLoading(true);
        const repoStats = await fetchGitHubStats(
          "open-energy-transition",
          "solver-benchmark",
        );
        setStats(repoStats);
      } catch (error) {
        console.error("Failed to fetch GitHub stats:", error);
      } finally {
        setLoading(false);
      }
    };

    getGitHubStats();
  }, []);

  return (
    <div
      id="contribution"
      className="py-5 text-[#F0ECE4] bg-navy scroll-mt-16 lg:scroll-mt-28"
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
                text-lg/1.1
                uppercase
                font-medium
                tracking-normal
                font-league
                mb-4
              "
          >
            contributions
          </div>
          <div
            className="
                text-[2.5rem]/1.4
                tracking-normal
                font-extrabold
                font-lato
                mb-2
              "
          >
            CHECK OUT OUR CODE, JOIN THE EFFORT!
          </div>
        </div>
        <div className="w-full xl:w-[67.42%] xl:pl-4.5 relative">
          <div className="font-lato text-xl/1.4 max-w-[541px]">
            <div className="font-medium">
              We accept community contributions for new benchmarks, new /
              updated solver versions, and feedback on the benchmarking
              methodology and metrics via our
            </div>
            <span className="font-bold">GitHub repository.</span>
            <div className="justify-center flex md:justify-between max-w-lg pt-1">
              <div className="py-9 text-center flex-1">
                <div className="flex items-center">
                  <UserIcon className="mr-2" />
                  <div className="text-white font-bold text-2xl/1.4 font-lato">
                    {loading
                      ? "..."
                      : stats.contributors.toString().padStart(2, "0")}
                  </div>
                </div>
                <p className="text-base/1.5 text-white text-left mt-2">
                  Contributors
                </p>
              </div>
              <div className="py-9 text-center flex-1">
                <div className="flex items-center">
                  <CircleOutlineIcon className="mr-2" />
                  <div className="text-white font-bold text-2xl/1.4 font-lato">
                    {loading ? "..." : stats.issues.toString().padStart(2, "0")}
                  </div>
                </div>
                <p className="text-base/1.5 text-white text-left mt-2">
                  Issues
                </p>
              </div>
              <div className="py-9 text-center flex-1">
                <div className="flex items-center">
                  <StarIcon className="mr-2" />
                  <div className="text-white font-bold text-2xl/1.4 font-lato">
                    {loading ? "..." : stats.stars.toString().padStart(2, "0")}
                  </div>
                </div>
                <p className="text-base/1.5 text-white text-left mt-2">Stars</p>
              </div>
              <div className="py-9 text-center flex-1">
                <div className="flex items-center">
                  <ForkIcon className="mr-2" />
                  <div className="text-white font-bold text-2xl/1.4 font-lato">
                    {loading ? "..." : stats.forks.toString().padStart(2, "0")}
                  </div>
                </div>
                <p className="text-base/1.5 text-white text-left mt-2">Forks</p>
              </div>
            </div>
            <Link
              href="https://github.com/open-energy-transition/solver-benchmark"
              className="w-max bg-[#F0ECE4] items-center rounded-2xl mt-11 px-10 py-4 relative flex justify-between"
              target="_blank"
            >
              <div className="flex items-center gap-1 font-bold text-navy font-lato text-lg uppercase">
                <GithubIcon className="mr-2" />
                <div className="hover:underline underline-offset-4">
                  Contribute now
                </div>
              </div>
              <LinkOutlineIcon className="text-navy size-5 ml-3 mr-4" />
            </Link>
          </div>
          <Image
            className="absolute hidden lg:block  w-[341px] h-[361px] top-0 right-0 lg:-right-8 rounded-[48px]"
            src="/landing_page/contribution.png"
            alt="Contribution image"
            width={341}
            height={361}
          />
        </div>
      </div>
    </div>
  );
};
export default Contribute;
