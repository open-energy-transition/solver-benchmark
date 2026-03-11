import Link from "next/link";

const BasicVsFeasible = ({}) => {
  return (
    <div className="px-2 md:px-5 py-2 text-navy font-lato border border-[#CAD9EF] bg-[#F7F7F9] rounded-2xl">
      <div className="tag-line-xs leading-1.5">
        *<b>Caveat:</b> Our configuration of highs-hipo and highs-ipx return
        only feasible solutions, not necessarily basic, while gurobi and highs
        always return basic solutions by default. See our{" "}
        <span className="hover:underline underline-offset-4 font-bold">
          <Link
            className="font-bold"
            href="https://openenergybenchmark.org/blog/TODO"
          >
            blog post
          </Link>
        </span>{" "}
        for more details.
      </div>
    </div>
  );
};

export default BasicVsFeasible;
