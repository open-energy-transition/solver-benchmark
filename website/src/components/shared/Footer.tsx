import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer>
      <div className="h-1 w-full border-b border-[#e5e7eb] mx-auto pt-10"></div>
      <div>
        <div className="grid px-4 md:flex gap-1 pt-6 pb-24 lg:pb-6 justify-start md:justify-center items-center text-navy text-xs">
          <Image
            width={54}
            height={25}
            src="/logo/oet.png"
            alt="oet-logo"
            className="w-[54px] h-[25px]"
            loading="lazy"
          />
          <span>
            © {currentYear}{" "}
            <Link
              href="https://openenergytransition.org"
              className="text-red-800 font-semibold"
              aria-label="Navigate to Open Energy Transition website"
            >
              <span className="underline">Open Energy Transition</span>
            </Link>
            . Licensed under the{" "}
            <Link
              href="https://opensource.org/license/MIT"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline underline-offset-4"
              aria-label="Navigate to MIT License page"
            >
              MIT License
            </Link>
            . All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
