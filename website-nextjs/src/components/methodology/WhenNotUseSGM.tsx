import { useScrollSpy } from "@/hooks/useScrollSpy";

const HASH_NAME = "when-not-to-use-sgm";
const WhenNotUseSGM = () => {
  const { ref: sectionRef } = useScrollSpy({
    hash: `#${HASH_NAME}`,
    threshold: 1,
  });

  return (
    <div ref={sectionRef}>
      {/* Content */}
      <h4 id="when-not-to-use-sgm" className="info-pages-heading">
        When Not to Use SGM
      </h4>
      <p>
        The SGM runtime might be misleading in the case when one solver solves
        more benchmarks than another but with a runtime of just under the time
        limit, which will result in very similar SGM values even though the
        first solver could be much better than the second. In such cases, we
        offer the possibility of using the following alternate &quot;modes&quot;
        of computing SGM:
      </p>
      <ol className="list-decimal list-outside ml-6 text-base leading-relaxed">
        <li className="mb-2">
          <strong>Penalizing TO/OOM/ER by a factor of X</strong>: this mode uses
          the time-out value for runtime or the maximum available value of
          memory, multiplied by a factor of X, for benchmark instances that
          time-out, go out of memory, or error. By using a high factor, this
          avoids the misleading case above as the second solver will have a much
          higher SGM value.
        </li>
        <li className="mb-2">
          <strong>Only on intersection of solved benchmarks</strong>: this mode
          filters the benchmark instances to the subset of instances where all
          solvers solve successfully. This also avoids the misleading case
          above, but at the cost of comparing solvers on a smaller subset of
          benchmarks.
        </li>
      </ol>
    </div>
  );
};

export default WhenNotUseSGM;
