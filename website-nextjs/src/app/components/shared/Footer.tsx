import Image from "next/image"

const Footer = () => {
  return (
    <footer className="my-6">
      <div className="my-6">
        <div className="grid md:flex justify-center gap-6 md:gap-20 py-7 text-base text-center">
          <div className="md:hidden flex justify-center">
            <Image
              src="/logo.png"
              alt="Contribution image"
              width={43}
              height={43}
            />
          </div>
          <p>About us</p>
          <p>Contact us</p>
          <p>Blog post</p>
          <p>FAQs</p>
        </div>
        <div className="h-1 w-full border-b-[1px] border-dark-grey container mx-auto"></div>
        <div className="grid md:flex justify-center gap-10 md:gap-20 py-7">
          <p className="text-sm order-2 md:order-1">
            © 2024 Benchmark Solutions. All rights reserved.
          </p>
          <div className="grid md:flex gap-4 text-center order-1 md:order-2">
            <p className="underline font-semibold text-xs">Privacy policy</p>
            <p className="underline font-semibold text-xs">Terms of Use</p>
            <p className="underline font-semibold text-xs">Cookie Policy</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
