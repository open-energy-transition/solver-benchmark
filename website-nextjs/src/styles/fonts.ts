import { Lato } from "next/font/google"
import { League_Spartan } from "next/font/google"

const leagueSpartan = League_Spartan({
  variable: "--font-league-spartan",
  subsets: ["latin"],
  weight: ["400", "700"],
})

const latoSans = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
})

const fontClasses = `${latoSans.variable} ${leagueSpartan.variable}`

export { leagueSpartan, latoSans, fontClasses }
