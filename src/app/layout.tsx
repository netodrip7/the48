import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "The 48 | WC26 space",
  description: "Data-driven analysis of all 48 nations at the 2026 FIFA World Cup.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <div className="page-wrapper">
          {children}
        </div>
      </body>
    </html>
  );
}