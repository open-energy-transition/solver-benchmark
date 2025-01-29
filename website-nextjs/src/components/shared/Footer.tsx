import Image from "next/image"
import Link from "next/link"

const Footer = () => {
  return (
    <footer>
      <div className="h-1 w-full border-b border-[#e5e7eb] mx-auto pt-10"></div>
      <div>
        <div className="grid px-4 md:flex gap-1 py-6 justify-start md:justify-center items-center text-navy text-xs">
          <Image width={54} height={25} src="/logo/oet.png" alt="oet-logo" />
          <span>© 2025</span>
          <Link
            href="https://openenergytransition.org"
            className="text-red-600 font-semibold"
          >
            <span className="underline">Open Energy Transition</span>.
          </Link>
          <span className="">
            Supported by{" "}
            <Link
              href="https://www.breakthroughenergy.org/"
              className="font-bold underline"
            >
              Breakthrough Energy
            </Link>
            .
          </span>
          <span className="">
            Powered by the{" "}
            <Link
              href="https://github.com/open-energy-transition/solver-benchmark"
              className="underline"
            >
              open source community
            </Link>
            .
          </span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
