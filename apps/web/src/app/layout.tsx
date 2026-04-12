import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Footer from "@/components/Footer";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CarpoolingAR",
  description: "Compartí el viaje, compartí los gastos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geist.className} h-full`}>
      <body className="min-h-full bg-gray-50 flex flex-col">
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
