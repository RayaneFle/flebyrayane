import type { Metadata } from "next";
import Providers from "@/components/Providers";
import PageLoader from "@/components/PageLoader";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://flebyrayane.vercel.app"),
  title: {
    default: "FLE by Rayane — Apprendre le français en ligne",
    template: "%s | FLE by Rayane",
  },
  description: "Plateforme interactive d\'apprentissage du français langue étrangère (FLE). Cours structurés, activités ludiques, suivi de progression. Niveaux A1 à C2.",
  keywords: ["FLE", "français langue étrangère", "apprendre le français", "cours de français", "exercices français", "A1", "A2", "B1", "B2", "C1", "C2"],
  authors: [{ name: "Rayane" }],
  creator: "Rayane",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://flebyrayane.vercel.app",
    siteName: "FLE by Rayane",
    title: "FLE by Rayane — Apprendre le français en ligne",
    description: "Plateforme interactive d\'apprentissage du français langue étrangère. Cours, activités ludiques, suivi de progression.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FLE by Rayane — Apprendre le français en ligne",
    description: "Plateforme interactive d\'apprentissage du français langue étrangère.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" translate="no" className="notranslate">
      <body className="min-h-screen bg-surface-50 antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              "name": "FLE by Rayane",
              "description": "Plateforme interactive d'apprentissage du français langue étrangère",
              "url": "https://flebyrayane.vercel.app",
              "sameAs": [],
              "inLanguage": "fr",
              "audience": {
                "@type": "EducationalAudience",
                "educationalRole": "student",
              },
            }),
          }}
        />
        <Providers><Suspense fallback={null}><PageLoader /></Suspense>{children}</Providers>
      </body>
    </html>
  );
}
