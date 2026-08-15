import type { MetadataRoute } from "next";

const baseUrl = "https://crosscartglobal.com";

export default function sitemap(): MetadataRoute.Sitemap {
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

  return staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
