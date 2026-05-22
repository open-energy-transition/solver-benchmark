import { AdminHeader, ContentWrapper } from "@/components/shared";
import TableResult from "@/components/admin/raw-result/TableResult";
import { ArrowIcon, HomeIcon } from "@/assets/icons";
import { PATH_DASHBOARD } from "@/constants/path";
import Link from "next/link";

const FullResultsContent = () => {
  return (
    <ContentWrapper
      noPageMargin
      header={
        <div className="mt-8">
          <h5>Full Results</h5>
          <p className="mb-6 mt-4 max-w-screen-lg">
            This page contains the full and raw set of benchmark results from
            our platform. You can, as usual, filter the results to your area of
            interest and download the filtered data as a CSV file.
          </p>
        </div>
      }
    >
      <TableResult />
    </ContentWrapper>
  );
};

export default FullResultsContent;
