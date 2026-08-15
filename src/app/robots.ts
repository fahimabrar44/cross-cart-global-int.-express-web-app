import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/auth", "/api"],
      },
    ],
    sitemap: "https://crosscartglobal.com/sitemap.xml",
    host: "https://crosscartglobal.com",
  };
}
