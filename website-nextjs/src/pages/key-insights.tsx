import { FooterLandingPage, Header } from "@/components/shared";

import KeyInsights from "@/components/key-insights/KeyInsights";
import SolverRuntimeComparison from "@/components/key-insights/charts/Runtime";
import LPTable from "@/components/key-insights/charts/LPTables";

const KeyInsightsPage = () => {
  return (
    <div>
      <Header />
      <div>
        <h3>Key Insights</h3>
        <div className="flex gap-2">
          <div>
            <h5>Content</h5>
          </div>
          <div className="w-full">
            <KeyInsights />
            <SolverRuntimeComparison />
            <LPTable />
          </div>
        </div>
      </div>
      <FooterLandingPage />
    </div>
  );
};

export default KeyInsightsPage;
