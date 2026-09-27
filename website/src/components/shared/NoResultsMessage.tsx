const NoResultsMessage = ({
  message = "No benchmark problems match the selected filters.",
}: {
  message?: string;
}) => {
  return (
    <div className="px-6 py-4 text-navy font-lato border border-[#CAD9EF] bg-[#F4F6FA] rounded-2xl flex items-center gap-3">
      <svg
        className="w-6 h-6 text-navy"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <div>
        <div className="font-semibold mb-1 h6">{message}</div>
      </div>
    </div>
  );
};

export default NoResultsMessage;
