import {
  ContactSection,
  ContributeSection,
  FaqsSection,
  GetStartedSection,
  MainContentSection,
  MissionStartSection,
} from "@/components/landing-page/sections";
import HowDoWeBenchmarkSection from "@/components/landing-page/sections/HowDoWeBenchmarkSection";
import { FooterLandingPage, Header } from "@/components/shared";
import Head from "next/head";

const LandingPage = () => {
  return (
    <>
      <div>
        <Head>
          <title>Solver benchmark</title>
          <meta name="description" content="Solver benchmark" />
        </Head>
        {/* Header Section */}
        <Header />
        {/* Main Content Section */}
        <MainContentSection />
        {/* Get Started Section */}
        <GetStartedSection />
        {/* Mission Start Section*/}
        <MissionStartSection />
        {/* HowDoWeBenchmarkSection */}
        <HowDoWeBenchmarkSection />
        {/* Contribute Section */}
        <ContributeSection />
        {/* FAQs Section */}
        <FaqsSection />
        {/* Contact Section */}
        <ContactSection />
        {/* Footer Section */}
        <FooterLandingPage />
      </div>
    </>
  );
};

export default LandingPage;
