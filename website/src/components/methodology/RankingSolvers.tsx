import { useScrollSpy } from "@/hooks/useScrollSpy";
import { MathJax } from "better-react-mathjax";

const HASH_NAME = "ranking-solvers";

const RankingSolvers = () => {
  const { ref: sectionRef } = useScrollSpy({
    hash: `#${HASH_NAME}`,
    threshold: 1,
  });

  return (
    <div ref={sectionRef}>
      {/* Content */}
      <div id={HASH_NAME} className="h4 info-pages-heading">
        Ranking Solvers: Shifted Geometric Mean (SGM)
      </div>
      <p>
        Ranking the overall performance of solvers on a (sub)set of benchmark
        instances is a difficult problem. We offer the following methods for
        ranking on our main dashboard:
      </p>
      <ol className="list-decimal list-outside ml-6">
        <li className="mb-2">SGM runtime</li>
        <li className="mb-2">SGM peak memory consumption</li>
        <li className="mb-2">Number of benchmarks solved</li>
      </ol>
      <p>
        SGM above stands for (normalized) shifted geometric mean, and is a more
        robust summary metric compared to the arithmetic mean (AM) or geometric
        mean (GM). Given a set of measured values{" "}
        <MathJax inline>{"$t_1, \\ldots, t_n$"}</MathJax>, e.g. runtimes of a
        solver on a set of benchmarks, the SGM value is defined as:
      </p>
      <MathJax className="my-4">
        {
          "$\\Large{e^{\\sum_{i \\in 1..n} \\frac{\\ln(\\max(1, t_i + s))}{n}} - s}$"
        }
      </MathJax>
      <p>
        The SGM differs from the geometric mean because it uses a <em>shift</em>{" "}
        <MathJax inline>{"$s$"}</MathJax> and also uses a max with 1. Key
        features are:
      </p>
      <ul className="list-disc list-outside ml-6">
        <li className="mb-2">(S)GM commutes with normalization</li>
        <li className="mb-2">
          (S)GM is influenced less by large outliers compared to AM
        </li>
        <li className="mb-2">
          SGM is influenced less by a small number of outliers compared to GM
        </li>
        <li className="mb-2">
          Max with 1 ignores differences in runtimes of less than 1s
        </li>
        <li className="mb-2">
          The shift is used to reduce the impact of a few benchmarks having very
          low runtimes on the overall SGM, reducing the risk of ranking highly a
          solver that is really good on only a small handful of benchmarks
        </li>
      </ul>
      <p>
        We use a shift of <MathJax inline>{"$s = 10$"}</MathJax>, which is also
        the shift used by the{" "}
        <a href="https://plato.asu.edu/ftp/shgeom.html">Mittlemann benchmark</a>
        .
      </p>
      <p>Reference:</p>
      <ul className="list-disc list-outside ml-6 text-base leading-relaxed">
        <li className="mb-2">
          <a href="https://cgi.cse.unsw.edu.au/~cs9242/18/papers/Fleming_Wallace_86.pdf">
            How not to lie with statistics: The correct way to summarize
            benchmark results
          </a>
          , Fleming and Wallace, 1986.
        </li>
      </ul>
    </div>
  );
};

export default RankingSolvers;
