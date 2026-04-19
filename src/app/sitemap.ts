import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = "https://flebyrayane.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: BASE_URL + "/cours", lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: BASE_URL + "/activites", lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: BASE_URL + "/login", lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: BASE_URL + "/register", lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: BASE_URL + "/mentions-legales", lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: BASE_URL + "/confidentialite", lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: BASE_URL + "/cgu", lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const courses = await prisma.course.findMany({
      where: { published: true, requiresEnrollment: false },
      select: { slug: true, updatedAt: true },
    });

    const coursePages: MetadataRoute.Sitemap = courses.map(c => ({
      url: BASE_URL + "/cours/" + c.slug,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    return [...staticPages, ...coursePages];
  } catch {
    return staticPages;
  }
}
