const HowDoWeBenchmarkSection = () => {
  return (
    <div className="text-navy bg-white py-5">
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
        <div className="w-1/4">
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
            Methodology
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
            HOW DO WE BENCHMARK?
          </div>
        </div>
        <div className="w-[67.42%] pr-32">
          <h5
            className="
              text-lg/1.5
              font-medium
              max-w-4xl
              mb-2.5
              font-roboto
              pl-4.5
              tracking-normal
              mt-10
            "
          >
            We run the benchmarks on cloud virtual machines (VMs) for efficiency
            and cost reasons, and have validated that the measured runtimes have
            acceptable error margins. We use a custom built benchmarking
            infrastructure based on Python and OpenTofu, that is open,
            transparent, and fully reproducible -- meaning you can also use it
            to run your own benchmarks!
          </h5>
          <div className="mt-6 ml-4">
            <strong>Read more</strong> about our methodology, caveats, and known{" "}
            <span className="underline font-bold cursor-pointer">
              issues here →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowDoWeBenchmarkSection;
