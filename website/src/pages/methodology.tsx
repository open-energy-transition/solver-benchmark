import React, { useEffect, useState, useRef } from "react";
import {
  PageLayout,
  TableOfContents,
  ContentSection,
} from "@/components/info-pages";
import { MathJaxContext } from "better-react-mathjax";
import Metrics from "@/components/methodology/Metrics";
import RankingSolvers from "@/components/methodology/RankingSolvers";
import WhenNotUseSGM from "@/components/methodology/WhenNotUseSGM";
import HardwareConfigurations from "@/components/methodology/HardwareConfigurations";
import DetailsOfTheRunner from "@/components/methodology/DetailsOfTheRunner";
import MethodologySection from "@/components/methodology/MethodologySection";
import { useSectionsVisibility } from "@/hooks/useSectionsVisibility";
import { useStaggerReveal } from "@/hooks/useGsapAnimation";
import gsap from "gsap";

const Methodology = () => {
  const config = {
    loader: { load: ["[tex]/html"] },
    tex: {
      packages: { "[+]": ["html"] },
      inlineMath: [["$", "$"]],
    },
  };

  const tocItems = [
    {
      hash: "#metrics",
      label: "Metrics",
      threshold: 0.7,
    },
    {
      hash: "#ranking-solvers",
      label: "Ranking Solvers: SGM",
      threshold: 0.7,
    },
    {
      hash: "#when-not-to-use-sgm",
      label: "When Not to Use SGM",
      threshold: 0.7,
    },
    {
      hash: "#methodology",
      label: "Methodology",
      threshold: 0.7,
    },
    {
      hash: "#hardware-configurations",
      label: "Hardware Configurations",
      threshold: 0.7,
    },
    {
      hash: "#details-of-the-runner",
      label: "Details of the Runner",
      threshold: 0.7,
    },
  ];

  const visibilities = useSectionsVisibility(tocItems);

  const tocRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    const el = tocRef.current;
    if (!el) return;
    gsap.set(el, { opacity: 0, x: -40 });
    gsap.to(el, {
      opacity: 1,
      x: 0,
      duration: 0.8,
      ease: "power3.out",
      delay: 0.2,
    });
  }, []);

  const contentRef = useStaggerReveal<HTMLDivElement>(".info-pages-section", {
    fromDirection: "bottom",
    y: 30,
    stagger: 0.12,
    duration: 0.8,
    threshold: 0.05,
  });

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
    <PageLayout
      title="Methodology"
      description="Benchmarking Metrics and Methodology"
    >
      <style jsx>{`
        :global(.info-pages-content p) {
          font-size: 16px;
        }
        .info-pages-section {
          opacity: 0;
        }
      `}</style>
      <div ref={tocRef} className="opacity-0">
        <TableOfContents
          title="Methodology"
          currentSection={currentSection}
          items={tocItems}
          enableAnimation={false}
        />
      </div>
      <ContentSection>
        <MathJaxContext config={config}>
          <div ref={contentRef} className="info-pages-content">
            <div className="info-pages-section">
              <Metrics />
            </div>

            <div className="info-pages-section">
              <RankingSolvers />
            </div>

            <div className="info-pages-section">
              <WhenNotUseSGM />
            </div>

            <MethodologySection />

            <div className="info-pages-section">
              <HardwareConfigurations />
            </div>

            <div className="info-pages-section">
              <DetailsOfTheRunner />
            </div>
          </div>
        </MathJaxContext>
      </ContentSection>
    </PageLayout>
  );
};

export default Methodology;
