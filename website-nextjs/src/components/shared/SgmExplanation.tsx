const SgmExplanation = ({}) => {
  return (
    // TODO Jacek, could you please help formatting this text into nice paragraphs?
    <>
      <p>
        SGM, or (normalized) shifted geometric mean, is a more robust summary
        metric compared to the arithmetic mean (AM) or geometric mean (GM).
        Given a set of measured values
        {/* $t_1, \ldots, t_n$ */} t_1, ..., t_n, e.g. runtimes of a solver on a
        set of benchmarks, the SGM value is defined as:
        <br />
        <span className="ml-4">
          SGM = exp(sum{"{i in 1..n}"} ln(max(1, t_i + s)) / n) - s
        </span>
        <br />
        {/* TODO can we use latex.js or MathJax to render this latex equation instead? */}
        {/* $$ e^{\sum_{i \in 1..n} \frac{\ln(\max(1, t_i + s))}{n}} - s $$ */}
        Intuitively, if a solver has an SGM runtime value of 1.32 then you can
        think of it as being 32% slower on average compared to the fastest
        solver.
      </p>

      <p>
        The SGM differs from the geometric mean becauses it uses a <b>shift</b>{" "}
        s and also takes max with 1 of the measured values. Some reasons for
        using SGM are:
        <ul className="list-disc pl-5">
          <li>(S)GM commutes with normalization</li>
          <li>(S)GM is influenced less by large outliers compared to AM</li>
          <li>
            SGM is influenced less by a small number of outliers compared to GM
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
      <p>
        We use a shift of s = 10, which is also the shift used by the{" "}
        <a className="underline" href="https://plato.asu.edu/ftp/shgeom.html">
          Mittlemann benchmark
        </a>
        .
      </p>
    </>
  );
};

export default SgmExplanation;
