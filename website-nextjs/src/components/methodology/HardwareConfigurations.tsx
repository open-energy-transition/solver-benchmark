import { useScrollSpy } from "@/hooks/useScrollSpy";

const HASH_NAME = "hardware-configurations";
const HardwareConfigurations = () => {
  const { ref: sectionRef } = useScrollSpy({
    hash: `#${HASH_NAME}`,
    threshold: 1,
  });
  return (
    <div ref={sectionRef}>
      {/* Content */}
      <div id={HASH_NAME} className="h4 info-pages-heading">
        Hardware Configurations
      </div>
      <p>
        We run benchmarks on the following machine configurations and timeouts:
      </p>
      <ol className="list-decimal list-outside ml-6 text-base leading-relaxed">
        <li className="mb-2">
          Small and Medium sized benchmark instances are run with a timeout of 1
          hour on a GCP <code>c4-standard-2</code> VM (1 core (2 vCPU), 7 GB
          RAM)
        </li>
        <li className="mb-2">
          Large sized benchmark instances are run with a timeout of 24 hours on
          a GCP <code>c4-highmem-8</code> VM (4 cores (8 vCPU), 62 GB RAM)
        </li>
      </ol>
      <p>
        As a reminder, we classify benchmarks into size categories based on the
        number of variables in the problem, as follows:
      </p>
      <ul className="list-disc list-outside ml-6 text-base leading-relaxed">
        <li className="mb-2">
          Small: num vars &lt; <code>1e4</code>
        </li>
        <li className="mb-2">
          Medium: <code>1e4</code> ≤ num vars &lt; <code>1e6</code>
        </li>
        <li className="mb-2">
          Large: num vars ≥ <code>1e6</code>
        </li>
      </ul>
    </div>
  );
};

export default HardwareConfigurations;
