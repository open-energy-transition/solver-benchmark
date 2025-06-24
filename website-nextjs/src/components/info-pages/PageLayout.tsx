import React from "react";
import { FooterLandingPage, Header } from "@/components/shared";
import Head from "next/head";

interface PageLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  description,
  children,
}) => {
  return (
    <div>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Head>
      <Header />
      <div className="bg-[#F5F4F4] mx-auto max-w-screen-2xl px-4 lg:pl-[min(62px,4.3vw)] lg:pr-[min(198px,13.75vw)] relative pb-36">
        <h3 className="py-4.5 font-bold">{title}</h3>
        <div className="flex gap-4">{children}</div>
      </div>
      <FooterLandingPage
        wrapperClassName="bg-navy text-white"
        textClassName="text-white"
        descriptionTextClassName="text-white"
        theme="dark"
      />
    </div>
  );
};
