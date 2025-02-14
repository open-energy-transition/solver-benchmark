import type { Metadata } from "next"

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
    <>
      {children}
    </>
  )
}
