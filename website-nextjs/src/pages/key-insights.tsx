import React, { useEffect, useState } from "react";
import {
  PageLayout,
  TableOfContents,
  ContentSection,
} from "@/components/info-pages";
import SolverPerformanceHistory from "@/components/key-insights/SolverPerformanceHistory";
import FactorsAffectingPerformanceInsights from "@/components/key-insights/FactorsAffectingPerformanceInsights";
import BenchmarkModelInsights from "@/components/key-insights/BenchmarkModelInsights";
import BenchmarkModelCases from "@/components/key-insights/BenchmarkModelCases";
import Introduction from "@/components/key-insights/Introduction";
import HowGoodIsSolver from "@/components/key-insights/HowGoodIsSolver";
import FeasibilityForOpenSource from "@/components/key-insights/FeasibilityForOpenSource";
import { useSectionsVisibility } from "@/hooks/useSectionsVisibility";

const KeyInsightsPage = () => {
  const tocItems = [
    {
      hash: "#how-good-is-each-solver-and-for-what-cases",
      label: "How good is each solver, and for what cases?",
      component: HowGoodIsSolver,
      threshold: 0.5,
    },
    {
      hash: "#how-are-solvers-evolving-over-time",
      label: "How are solvers evolving over time?",
      component: SolverPerformanceHistory,
      threshold: 0.5,
    },
    {
      hash: "#what-is-feasible-for-open-source-solvers",
      label: "What is feasible for open source solvers?",
      component: FeasibilityForOpenSource,
      threshold: 0.5,
    },
    {
      hash: "#what-factors-affect-solver-performance",
      label: "What factors affect solver performance?",
      component: FactorsAffectingPerformanceInsights,
      threshold: 0.5,
    },
    {
      hash: "#benchmark-problems-corresponding-to-representative-model-use-cases",
      label:
        "Benchmark problems corresponding to representative model use-cases",
      component: BenchmarkModelInsights,
      threshold: 0.5,
    },
    {
      hash: "#what-benchmark-problems-do-we-have-and-what-are-missing",
      label: "What benchmark problems do we have (and what are missing?)",
      component: BenchmarkModelCases,
      threshold: 0.5,
    },
  ];
  const visibilities = useSectionsVisibility(tocItems);
  const [currentSection, setCurrentSection] = useState<string | null>(null);

  useEffect(() => {
    for (let i = 0; i < visibilities.length; i++) {
      if (visibilities[i]) {
        window.history.replaceState(null, "", tocItems[i].hash);
        setCurrentSection(tocItems[i].hash);
        return;
      }
    }
  }, [visibilities]);

  return (
    <PageLayout title="Key Insights" description="Key insights">
      <TableOfContents
        title="Key Insights"
        currentSection={currentSection}
        items={tocItems}
      />
      <ContentSection>
        <div className="info-pages-content">
          <div className="info-pages-section">
            <Introduction />
          </div>
          {tocItems.map((item) => {
            const Component = item.component;
            return (
              <div key={item.hash} className="info-pages-section">
                <Component />
              </div>
            );
          })}
        </div>
      </ContentSection>
    </PageLayout>
  );
};

export default KeyInsightsPage;
