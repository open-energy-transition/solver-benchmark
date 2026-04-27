import { useEffect } from "react";
import { useRouter } from "next/router";

/** Redirects to the unified /dashboard single-pager. */
const PagePerformanceHistory = () => {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    router.replace("/dashboard#performance-history");
  }, [router.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

export default PagePerformanceHistory;
