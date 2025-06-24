import Image from "next/image";
import Link from "next/link";

interface FooterProps {
  wrapperClassName?: string;
  textClassName?: string;
  descriptionTextClassName?: string;
  theme?: "dark" | "light";
}

const Footer = ({
  wrapperClassName = "",
  textClassName = "text-black",
  descriptionTextClassName = "text-dark-grey",
  theme = "light",
}: FooterProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={wrapperClassName}>
      <div className="max-w-8xl px-4 lg:px-[70px] mx-auto pb-9">
        <div>
          <div className="md:flex gap-1 py-[1.375rem] justify-between text-navy text-xs">
            <div>
              <Link href="https://openenergytransition.org/" target="_blank">
                <Image
                  width={127}
                  height={57}
                  src="/logo/oet.png"
                  alt="oet-logo"
                />
              </Link>
              <div
                className={`${descriptionTextClassName} font-league text-sm/1.1 tracking-normal font-normal w-[min(362px,100%)] my-6 mb-4`}
              >
                Open Energy Transition GmbH drives sustainable energy solutions
                with innovative technology and data-driven insights, enabling
                collaboration and efficiency in the energy sector.
              </div>
              <div className="gap-2 items-center">
                <div
                  className={`font-lato w-full md:w-max uppercase font-bold text-sm/1.1 tracking-normal ${
                    theme === "light" ? "text-dark-grey" : "text-white"
                  }`}
                >
                  Supported by
                </div>
                <Link
                  href="https://www.breakthroughenergy.org/"
                  target="_blank"
                >
                  <Image
                    className="mt-4"
                    src={`/landing_page/BE_logo_${theme}.png`}
                    alt="be-logo"
                    width={215}
                    height={29}
                  />
                </Link>
              </div>
            </div>
            <div className="flex gap-0 justify-between md:gap-4 lg:gap-[64px] pl-0 xl:pl-[221px] mt-4 lg:mt-8">
              <div className="flex flex-col gap-2">
                <p
                  className={`font-lato font-bold text-lg ${textClassName} leading-[110%] tracking-normal`}
                >
                  Company
                </p>
                <p
                  className={`font-lato font-normal text-xs ${textClassName} leading-[110%] tracking-normal`}
                >
                  <a href="https://openenergytransition.org">Website</a>
                </p>
                <p
                  className={`font-lato font-normal text-xs ${textClassName} leading-[110%] tracking-normal`}
                >
                  <a href="https://openenergytransition.org/projects.html">
                    Our projects
                  </a>
                </p>
                <p
                  className={`font-lato font-normal text-xs ${textClassName} leading-[110%] tracking-normal`}
                >
                  <a href="https://github.com/open-energy-transition">GitHub</a>
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <p
                  className={`font-lato font-bold text-lg ${textClassName} leading-[110%] tracking-normal`}
                >
                  Socials
                </p>
                <p
                  className={`font-lato font-normal text-xs ${textClassName} leading-[110%] tracking-normal`}
                >
                  <a href="https://www.linkedin.com/company/open-energy-transition">
                    LinkedIn
                  </a>
                </p>
                <p
                  className={`font-lato font-normal text-xs ${textClassName} leading-[110%] tracking-normal`}
                >
                  <a href="https://x.com/OETenergy">X</a>
                </p>
                <p
                  className={`font-lato font-normal text-xs ${textClassName} leading-[110%] tracking-normal`}
                >
                  <a href="https://bsky.app/profile/oetenergy.bsky.social">
                    Bluesky
                  </a>
                </p>
                <p
                  className={`font-lato font-normal text-xs ${textClassName} leading-[110%] tracking-normal`}
                >
                  <a href="https://mastodon.social/@OpenEnergyTransition">
                    Mastodon
                  </a>
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <p
                  className={`font-lato font-bold text-lg ${textClassName} leading-[110%] tracking-normal`}
                >
                  Resources
                </p>
                <p
                  className={`font-lato font-normal text-xs ${textClassName} leading-[110%] tracking-normal`}
                >
                  <a href="https://github.com/open-energy-transition/solver-benchmark">
                    Source repository
                  </a>
                </p>
                <p
                  className={`font-lato font-normal text-xs ${textClassName} leading-[110%] tracking-normal`}
                >
                  <a href="https://github.com/open-energy-transition/solver-benchmark/issues">
                    Issues
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div
            className={`py-9 mx-2 md:mx-20 text-center border-t border-stroke font-normal font-lato text-xs leading-[110%] tracking-normal`}
          >
            <p className={theme === "light" ? "text-dark-grey" : "text-white"}>
              © {currentYear} Open Energy Transition. Licensed under the{" "}
              <Link
                href="https://opensource.org/license/MIT"
                target="_blank"
                className="hover:underline underline-offset-4"
              >
                MIT License
              </Link>
              . All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
