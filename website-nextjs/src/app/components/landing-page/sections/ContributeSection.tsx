import Image from "next/image"
import {
  ArrowUpIcon,
  CircleOutlineIcon,
  ForkIcon,
  GithubIcon,
  StarIcon,
  UserIcon,
} from "@/app/assets/icons"

const Contribute = () => {
  return (
    <div className="text-navy bg-white px-2 md:px-20 py-10">
      <div className="mx-auto container px-6">
        <div className="text-dark-grey text-xl uppercase font-bold font-league">
          contributions
        </div>
        <div className="grid md:flex">
          <div className="w-full md:w-7/12">
            <div className="text-6xl my-5 font-league">
              <div className="font-bold">CHECK OUT OUR CODE,</div>
              <div className="font-bold">JOIN THE EFFORT!</div>
            </div>
            <h5 className="text-dark-grey my-2 md:w-[32rem]">
              We accept community contributions for new benchmarks, new /
              updated solver versions, and feedback on the benchmarking
              methodology and metrics via our
              <span className="font-bold ml-1">GitHub repository</span>
              <span className="text-green-pop font-bold">.</span>
            </h5>
            <div className="grid justify-center md:flex md:justify-between text-black w-full md:w-[32rem]">
              <div className="py-9 text-center">
                <div className="font-bold flex items-center">
                  <UserIcon className="mr-2" />
                  <h5 className="font-bold">03</h5>
                </div>
                <p className="text-base">Contributors</p>
              </div>
              <div className="py-9 text-center">
                <div className="font-bold flex items-center">
                  <CircleOutlineIcon className="mr-2" />
                  <h5 className="font-bold">05</h5>
                </div>
                <p className="text-base">Issues</p>
              </div>
              <div className="py-9 text-center">
                <div className="font-bold flex items-center">
                  <StarIcon className="mr-2" />
                  <h5 className="font-bold">02</h5>
                </div>
                <p className="text-base">Stars</p>
              </div>
              <div className="py-9 text-center">
                <div className="flex items-center">
                  <ForkIcon className="mr-2" />
                  <h5 className="font-bold">01</h5>
                </div>
                <p className="text-base">Fork</p>
              </div>
            </div>
          </div>
          <div className="hidden md:block w-5/12">
            <Image
              className="max-w-md"
              src="/landing_page/contribution.png"
              alt="Contribution image"
              style={{ width: "100%", height: "auto" }}
              width={517}
              height={494}
            />
          </div>
        </div>
        <div
          className="mt-11 py-4 relative before:border-b before:border-teal before:border-opacity-50
              before:absolute before:bottom-0 before:left-0 before:w-[102%] before:transform before:-translate-x-[1%]
              flex justify-between"
        >
          <div className="flex items-center gap-1 font-bold text-navy text-opacity-70">
            <GithubIcon />
            <h5>GITHUB REPOSITORY</h5>
          </div>
          <ArrowUpIcon className="text-black rotate-90 w-8 h-8" />
        </div>
      </div>
    </div>
  )
}
export default Contribute
