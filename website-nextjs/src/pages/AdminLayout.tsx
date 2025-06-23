import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Open Energy Benchmark",
  description:
    "An open-source benchmark of optimization solvers on representative problems from the energy planning domain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
