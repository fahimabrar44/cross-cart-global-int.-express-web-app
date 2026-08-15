import type { MetadataRoute } from "next";
import connectDB from "@/config/db";
import { Blog } from "@/server/models/Blog.model";

const baseUrl = "https://crosscartglobal.com";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/about",
    "/about/our-story",
    "/about/our-services",
    "/about/our-work-process",
    "/about/coverage-area",
    "/about/our-team",
    "/about/help-and-support",
    "/about/our-blog",
    "/about/trust-and-safety",
    "/about/refund-policy",
    "/about/privacy-policy",
    "/career",
    "/contact",
    "/crosscart-corporate",
    "/faq",
    "/api-integration",
    "/ship-and-track",
    "/ship-and-track/claculate-shipping-charge",
    "/ship-and-track/create-shipment",
    "/ship-and-track/track-shipment",
    "/logistics-solutions",
    "/logistics-solutions/bussiness-solution",
    "/logistics-solutions/e-commerce-solutions",
    "/logistics-solutions/industry-solutions",
  ];

  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));

  // Include published blog posts so they are indexed
  try {
    await connectDB();
    const blogs = (await Blog.find({ status: "published" })
      .select("slug updatedAt")
      .lean()) as Array<{ slug?: string; updatedAt?: Date }>;

    for (const blog of blogs) {
      if (!blog.slug) continue;
      entries.push({
        url: `${baseUrl}/about/our-blog/${blog.slug}`,
        lastModified: blog.updatedAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch (error) {
    console.error("Sitemap blog fetch failed:", error);
  }

  return entries;
}
