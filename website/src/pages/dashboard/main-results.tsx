import { useEffect } from "react";
import { useRouter } from "next/router";

/** Redirects to the unified /dashboard single-pager. */
const PageMainResults = () => {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    const { tab } = router.query;
    const dest = tab ? `/dashboard?tab=${tab}` : "/dashboard";
    router.replace(dest);
  }, [router.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

export default PageMainResults;
