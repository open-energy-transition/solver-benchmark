import TopBanner from "@/components/shared/TopBanner";
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body className="antialiased">
        <TopBanner />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
