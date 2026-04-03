import type { Metadata } from "next";
import Providers from "@/components/Providers";
import PageLoader from "@/components/PageLoader";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "FLEbyRayane — Apprenez le français",
  description: "Plateforme interactive FLE avec cours, activités ludiques et suivi de progression.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-surface-50 antialiased">
        <Providers><Suspense fallback={null}><PageLoader /></Suspense>{children}</Providers>
      </body>
    </html>
  );
}
