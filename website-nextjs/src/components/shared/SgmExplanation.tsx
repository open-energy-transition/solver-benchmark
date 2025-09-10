import { MathJax, MathJaxContext } from "better-react-mathjax";

const SgmExplanation = ({}) => {
  const config = {
    loader: { load: ["[tex]/html"] },
    tex: {
      packages: { "[+]": ["html"] },
      inlineMath: [["$", "$"]],
    },
  };

  return (
    <MathJaxContext config={config}>
      <>
        <p className="text-white">
          SGM, or (normalized) shifted geometric mean, is a more robust summary
          metric compared to the arithmetic mean (AM) or geometric mean (GM).
          <br />
          Given a set of measured values{" "}
          <MathJax inline>{"$t_1, \\ldots, t_n$"}</MathJax> e.g. runtimes of a
          solver on a set of benchmarks, the SGM value is defined as:
          <br />
          <MathJax className="">
            {
              "$$\\text{SGM} = e^{\\sum_{i \\in 1..n} \\frac{\\ln(\\max(1, t_i + s))}{n}} - s$$"
            }
          </MathJax>
          Intuitively, if a solver has an SGM runtime value of 1.32 then you can
          think of it as being 32% slower on average compared to the fastest
          solver.
        </p>

        <p className="text-white">
          The SGM differs from the geometric mean becauses it uses a{" "}
          <b>shift</b> s and also takes max with 1 of the measured values. Some
          reasons for using SGM are:
          <ul className="list-disc pl-5">
            <li>(S)GM commutes with normalization</li>
            <li>(S)GM is influenced less by large outliers compared to AM</li>
            <li>
              SGM is influenced less by a small number of outliers compared to
              GM
            </li>
            <li>Max with 1 ignores differences in runtimes of less than 1s</li>
            <li>
              The shift is used to reduce the impact of a few benchmarks having
              very low runtimes on the overall SGM, reducing the risk of ranking
              highly a solver that is really good on only a small handfull of
              benchmarks
            </li>
          </ul>
        </p>
        <p className="text-white">
          We use a shift of <MathJax inline>s = 10</MathJax>, which is also the
          shift used by the{" "}
          <a href="https://plato.asu.edu/ftp/shgeom.html">
            Mittlemann benchmark
          </a>
          .
        </p>
      </>
    </MathJaxContext>
  );
};

export default SgmExplanation;
