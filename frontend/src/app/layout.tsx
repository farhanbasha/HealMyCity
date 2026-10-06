import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "HealMyCity — Civic Issue Reporting",
  description:
    "Report and track civic infrastructure issues in your community. Clean, transparent municipal triage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} font-sans bg-[#FBFBFD] text-[#1D1D1F] antialiased min-h-screen flex flex-col`}>
        {children}
        <Toaster
          position="top-center"
          richColors={false}
          toastOptions={{
            style: {
              background: "#ffffff",
              border: "1px solid #e5e5ea",
              color: "#1d1d1f",
              borderRadius: "12px",
              boxShadow: "0 6px 24px rgba(0,0,0,0.08)",
              fontSize: "0.875rem",
              fontWeight: 500,
            },
          }}
        />
      </body>
    </html>
  );
}
