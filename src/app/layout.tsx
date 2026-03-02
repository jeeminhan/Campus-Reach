import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Campus Reach",
  description: "Discover the unreached peoples behind every campus",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-950 min-h-screen text-white antialiased">
        <Header />
        {children}
      </body>
    </html>
  );
}
