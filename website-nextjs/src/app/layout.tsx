import type { Metadata } from "next"
import { Lato } from "next/font/google"
import { League_Spartan } from "next/font/google"
import "./globals.css"
import Head from "next/head"

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

export const metadata: Metadata = {
  title: "Solver Benchmark",
  description: "Solver Benchmark",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <body
        className={`${latoSans.variable} ${latoSans.variable} ${leagueSpartan.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
