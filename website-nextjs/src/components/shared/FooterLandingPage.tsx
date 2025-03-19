import Image from "next/image";

const Footer = () => {
  return (
    <footer className="container mx-auto">
      <div className="px-8">
        <div className="grid px-4 md:flex gap-1 py-6 justify-between items-center text-navy text-xs">
          <div>
            <Image width={127} height={57} src="/logo/oet.png" alt="oet-logo" />
            <div className="text-navy font-league leading-[110%] text-2xl tracking-normal font-semibold">
              Keep up to date with us!
            </div>
          </div>
          <div className="flex gap-[64px] pl-[221px]">
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
        <div className="text-center font-normal font-lato text-xs text-black leading-[110%] tracking-normal">
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
