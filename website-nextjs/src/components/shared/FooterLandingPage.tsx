import Image from "next/image";

const Footer = () => {
  return (
    <footer className="container mx-auto pb-9">
      <div className="lg:px-8">
        <div className="px-4 md:flex gap-1 py-[1.375rem] justify-between text-navy text-xs">
          <div>
            <Image width={127} height={57} src="/logo/oet.png" alt="oet-logo" />
            <div className="text-dark-grey font-league text-sm/1.1 tracking-normal font-normal w-[362px] my-6 mb-4">
              Open Energy Transition GmbH drives sustainable energy solutions
              with innovative technology and data-driven insights, enabling
              collaboration and efficiency in the energy sector.
            </div>
            <div className="gap-2 items-center">
              <div className="font-lato w-full md:w-max uppercase font-bold text-sm/1.1 tracking-normal">
                Supported by
              </div>
              <Image
                className="mt-4"
                src="/landing_page/BE_logo.png"
                alt="be-logo"
                width={215}
                height={29}
              />
            </div>
          </div>
          <div className="flex gap-0 justify-between md:gap-4 lg:gap-[64px] pl-0 lg:pl-[221px] lg:mt-14">
            <div className="flex flex-col gap-2">
              <p className="font-lato font-bold text-lg text-black leading-[110%] tracking-normal">
                Community
              </p>
              <p className="font-lato font-normal text-xs text-black leading-[110%] tracking-normal">
                Our projects
              </p>
              <p className="font-lato font-normal text-xs text-black leading-[110%] tracking-normal">
                GitHub Repo
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-lato font-bold text-lg text-black leading-[110%] tracking-normal">
                Company
              </p>
              <p className="font-lato font-normal text-xs text-black leading-[110%] tracking-normal">
                Website
              </p>
              <p className="font-lato font-normal text-xs text-black leading-[110%] tracking-normal">
                Github
              </p>
              <p className="font-lato font-normal text-xs text-black leading-[110%] tracking-normal">
                Linkedin
              </p>
              <p className="font-lato font-normal text-xs text-black leading-[110%] tracking-normal">
                X account
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-lato font-bold text-lg text-black leading-[110%] tracking-normal">
                Resources
              </p>
              <p className="font-lato font-normal text-xs text-black leading-[110%] tracking-normal">
                Documentation
              </p>
              <p className="font-lato font-normal text-xs text-black leading-[110%] tracking-normal">
                Papers
              </p>
              <p className="font-lato font-normal text-xs text-black leading-[110%] tracking-normal">
                News
              </p>
            </div>
          </div>
        </div>

        <div className="py-9 mx-20 text-center border-t border-stroke font-normal font-lato text-xs text-black leading-[110%] tracking-normal">
          <p>
            © 2025 Solver Benchmark. Licensed under the{" "}
            <span className="underline">MIT License</span>. All rights reserved.
          </p>
          <p>
            <span className="underline">Documentation</span> |{" "}
            <span className="underline">GitHub</span> |{" "}
            <span className="underline">Community Forum</span> |{" "}
            <span className="underline">Donate</span> |{" "}
            <span className="underline">Privacy Policy</span>|{" "}
            <span className="underline">Terms of Service</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
