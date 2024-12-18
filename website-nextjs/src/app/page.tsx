import {
  ContactSection,
  ContributeSection,
  FaqsSection,
  GetStartedSection,
  MainContentSection,
  MissionStartSection,
} from "./components/landing-page/sections"
import { Footer, Header } from "./components/shared"

const LandingPage = () => {
  return (
    <>
      <div>
        {/* Header Section */}
        <Header />
        {/* Main Content Section */}
        <MainContentSection />
        {/* Get Started Section */}
        <GetStartedSection />
        {/* Contribute Section */}
        <ContributeSection />
        {/* Mission Start Section*/}
        <MissionStartSection />
        {/* FAQs Section */}
        <FaqsSection />
        {/* Contact Section */}
        <ContactSection />
        {/* Footer Section */}
        <Footer />
      </div>
    </>
  )
}

export default LandingPage
