import Link from "next/link";

// Temporary: remove this component and its uses (landing page, key insights,
// performance history dashboard) once the v3 benchmark results are published.
const ScipVersionNote = ({ className = "" }: { className?: string }) => {
  return (
    <div
      role="note"
      className={`px-5 py-3 text-navy font-lato border border-[#E9C46A] bg-[#FFF8E5] rounded-2xl text-left ${className}`}
    >
      <p className="text-sm leading-relaxed">
        <b>Correction:</b> all SCIP results ran SCIP 9.2.4, whatever version
        they are labelled with.{" "}
        <Link
          href="/blog/scip_version_correction"
          className="font-bold underline underline-offset-2 hover:opacity-75"
        >
          Read more
        </Link>
      </p>
    </div>
  );
};

export default ScipVersionNote;
