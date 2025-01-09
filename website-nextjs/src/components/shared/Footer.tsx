import Image from "next/image"

const Footer = () => {
  return (
    <footer>
      <div>
        <div className="grid md:flex justify-center gap-6 md:gap-14 py-7 text-base text-center pb-3 pt-16">
          <div className="md:hidden flex justify-center">
            <Image
              src="/logo.png"
              alt="Contribution image"
              width={43}
              height={43}
            />
          </div>
          <p className="p-2.5">About us</p>
          <p className="p-2.5">Contact us</p>
          <p className="p-2.5">Blog post</p>
          <p className="p-2.5">FAQs</p>
        </div>
        <div className="h-1 w-full border-b border-[#8C8C8C] container mx-auto"></div>
        <div className="grid md:flex justify-center items-center gap-10 md:gap-20 pt-[45px] pb-[51px]">
          <p className="text-sm order-2 md:order-1">
            © 2024 Benchmark Solutions. All rights reserved.
          </p>
          <div className="grid md:flex text-center order-1 md:order-2">
            <p className="underline p-2.5 font-semibold text-xs">Privacy policy</p>
            <p className="underline p-2.5 font-semibold text-xs">Terms of Use</p>
            <p className="underline p-2.5 font-semibold text-xs">Cookie Policy</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
