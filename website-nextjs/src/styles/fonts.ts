import { Lato, League_Spartan, Space_Grotesk } from "next/font/google";

const leagueSpartan = League_Spartan({
  variable: "--font-league-spartan",
  subsets: ["latin"],
  style: ["normal"],
  weight: ["100", "300", "400", "500", "700", "900"],
});

const latoSans = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["100", "300", "400", "700", "900"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const fontClasses = `${latoSans.variable} ${leagueSpartan.variable} ${spaceGrotesk.variable}`;

export { leagueSpartan, latoSans, spaceGrotesk, fontClasses };
