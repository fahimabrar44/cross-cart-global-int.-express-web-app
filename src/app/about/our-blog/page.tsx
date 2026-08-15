import type { Metadata } from "next";
import PageHeader from "@/utilities/PageHeader";
import { Globe, Mail, Package, PenTool, Plane, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "Our Blog",
  description:
    "The Cross Cart Global International Express blog — shipping tips, customs guides, e-commerce advice and success stories to help Bangladeshi sellers grow globally.",
  keywords: [
    "international shipping tips",
    "courier blog Bangladesh",
    "e-commerce shipping guide",
    "customs documentation guide",
    "Cross Cart Global blog",
  ],
  alternates: {
    canonical: "https://crosscartglobal.com/about/our-blog",
  },
  openGraph: {
    title: "Our Blog | Cross Cart Global International Express",
    description:
      "Shipping tips, customs guides and success stories to help Bangladeshi sellers grow globally with Cross Cart Global International Express.",
    url: "https://crosscartglobal.com/about/our-blog",
    siteName: "Cross Cart Global International Express",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/full-logo.png",
        width: 1200,
        height: 630,
        alt: "Cross Cart Global International Express",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@crosscartglobal",
    creator: "@crosscartglobal",
    title: "Our Blog | Cross Cart Global International Express",
    description:
      "Shipping tips, customs guides and success stories to help Bangladeshi sellers grow globally with Cross Cart Global International Express.",
    images: ["/full-logo.png", "/logo.png"],
  },
};

const OurBlog = () => {
  // Sample blog posts data
  const blogPosts = [
    {
      id: 1,
      title: "How to Save on International Shipping",
      excerpt:
        "Discover cost-effective strategies for Bangladeshi businesses to reduce shipping expenses while maintaining quality service.",
      icon: <Package className="w-6 h-6 text-[#12352A]" />,
      date: "Coming Soon",
      category: "Cost Saving",
    },
    {
      id: 2,
      title: "Behind the Scenes: How Cross Cart Global International Express Partners with Global Couriers",
      excerpt:
        "Learn about our partnerships with DHL, FedEx, UPS, and more to deliver reliable shipping solutions.",
      icon: <Globe className="w-6 h-6 text-[#12352A]" />,
      date: "Coming Soon",
      category: "Partnerships",
    },
    {
      id: 3,
      title: "How Small Businesses in Bangladesh Are Going Global",
      excerpt:
        "Success stories from local entrepreneurs who expanded their reach with CrossCart Global Int Express's shipping solutions.",
      icon: <TrendingUp className="w-6 h-6 text-[#12352A]" />,
      date: "Coming Soon",
      category: "Success Stories",
    },
    {
      id: 4,
      title: "Step-by-Step Customs & Documentation Guides",
      excerpt:
        "Navigate international shipping regulations with our comprehensive customs documentation guide.",
      icon: <Plane className="w-6 h-6 text-[#12352A]" />,
      date: "Coming Soon",
      category: "Documentation",
    },
  ];

  return (
    <>
      <div className="w-full h-auto bg-soft-green overflow-x-hidden">
        <PageHeader
          title="ABOUT US"
          subtitle="OUR BLOG"
          mainLink="/about"
          subLink="/about/our-blog"
        />
      </div>

      <div className="bg-white py-12 px-4 md:px-8 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center text-gray-800">
              Our Blog
            </h1>
            <p className="text-lg text-gray-700 leading-relaxed mb-8 text-center max-w-4xl mx-auto">
              Welcome to the <span className="italic">Cross Cart Global International Express Blog</span> — your
              destination for delivery insights, eCommerce tips, and global
              shipping updates.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed text-center max-w-4xl mx-auto">
              At Cross Cart Global International Express, we believe knowledge empowers small businesses. Our blog
              shares helpful guides, stories, and updates to help{" "}
              <span className="italic">Bangladeshi sellers grow globally</span>{" "}
              — from packaging tips to courier comparisons and success stories
              from local entrepreneurs.
            </p>
          </div>

          <div className="bg-section rounded-lg p-8 mb-12 text-center">
            <div className="max-w-3xl mx-auto">
              <p className="text-gray-700 mb-6">
                Even if we{"'"}re just getting started, our goal is simple:
              </p>
              <blockquote className="text-xl md:text-2xl font-semibold text-[#12352A] italic">
                {'"'}To make international shipping easier, smarter, and more
                affordable for everyone.{'"'}
              </blockquote>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-8">
              Stay tuned for upcoming topics:
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {blogPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-center w-12 h-12 bg-soft-green rounded-full mb-4">
                      {post.icon}
                    </div>
                    <div className="mb-2">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                        {post.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{post.date}</span>
<button className="text-[#12352A] text-sm font-medium hover:text-primary transition-colors">
                        Read More →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#12352A] text-white rounded-lg p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <PenTool className="w-8 h-8 text-[#F5C400] mr-3" />
              <h2 className="text-2xl font-bold">Have Something to Share?</h2>
            </div>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              We{"'"}d love to feature your business story or shipping
              experience!
            </p>
            <div className="flex items-center justify-center">
              <Mail className="w-5 h-5 text-[#F5C400] mr-2" />
              <a
                href="mailto:cross.cart.bd@gmail.com"
                className="text-[#F5C400] hover:underline font-medium"
              >
                cross.cart.bd@gmail.com
              </a>
            </div>
            <p className="text-gray-300 mt-2">
              to get featured on the Cross Cart Global International Express Blog.
            </p>
          </div>

          <div className="mt-12 text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Subscribe to Our Newsletter
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Get the latest shipping tips, industry insights, and Cross Cart Global International Express updates
              delivered to your inbox.
            </p>
            <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              />
              <button className="bg-[#12352A] text-white px-6 py-3 rounded-lg hover:bg-[#1c4a36] transition-colors font-medium">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OurBlog;
