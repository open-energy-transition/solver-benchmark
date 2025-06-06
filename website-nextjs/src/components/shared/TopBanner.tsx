export default function TopBanner() {
  return (
    <div className="w-full py-3 text-center z-50 font-bold bg-white relative shadow-md">
      <div className="bg-gradient-to-r from-navy via-green-pop to-dark-green h-1 w-full absolute bottom-0 left-0"></div>
      <p className="text-navy text-xs md:text-sm lg:text-base">
        This website is under development. All content is for testing purposes
        and is subject to change.
      </p>
    </div>
  );
}
