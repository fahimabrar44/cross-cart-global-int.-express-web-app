import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import PageHeader from "@/utilities/PageHeader";
import { fetchPublicData } from "@/server/common/fetchPublic";
import { Mail, Package, PenTool } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata({
  title: "Blog & Shipping Guides",
  description:
    "Tips, guides and news from Cross Cart Global International Express — international courier advice, FedEx/DHL/UPS/Aramex rate comparisons, customs tips and eCommerce shipping from Bangladesh.",
  path: "/about/our-blog",
  keywords: [
    "courier blog",
    "shipping tips Bangladesh",
    "international shipping guide",
    "customs tips",
    "ecommerce shipping blog",
  ],
});

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  content: string;
  image?: string;
  images?: string[];
  category?: string;
  excerpt?: string;
  tags?: string[];
  author?: { name?: string; email?: string } | null;
  status: string;
  createdAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  service: "Service",
  news: "News",
  update: "Update",
  promotion: "Promotion",
};

const OurBlog = async () => {
  const blogPosts = await fetchPublicData<BlogPost>(
    "blogs?status=published&limit=100"
  );

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

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
              Welcome to the{" "}
              <span className="italic">
                Cross Cart Global International Express Blog
              </span>{" "}
              — your destination for delivery insights, eCommerce tips, and
              global shipping updates.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed text-center max-w-4xl mx-auto">
              At Cross Cart Global International Express, we believe knowledge
              empowers small businesses. Our blog shares helpful guides,
              stories, and updates to help{" "}
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
              Latest Articles
            </h2>

            {blogPosts.length === 0 ? (
              <div className="text-center py-12 bg-section rounded-lg">
                <p className="text-lg text-gray-600 mb-2">
                  No articles published yet.
                </p>
                <p className="text-gray-500">
                  Stay tuned — new shipping guides and success stories are on
                  the way.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogPosts.map((post) => {
                  const cover = post.image || post.images?.[0];
                  return (
                  <Link
                    key={post._id}
                    href={`/about/our-blog/${post.slug}`}
                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col"
                  >
                    {cover ? (
                      <div className="w-full h-48 overflow-hidden bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={cover}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-soft-green flex items-center justify-center">
                        <Package className="w-10 h-10 text-[#12352A]" />
                      </div>
                    )}
                    <div className="p-6 flex flex-col flex-1">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                          {post.category
                            ? CATEGORY_LABELS[post.category] || post.category
                            : "General"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(post.createdAt)}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {post.excerpt || "Read this article to learn more."}
                      </p>
                      <div className="mt-auto flex items-center justify-between">
                        <span className="text-[#12352A] text-sm font-medium hover:text-primary transition-colors">
                          Read More →
                        </span>
                      </div>
                    </div>
                  </Link>
                  );
                })}
              </div>
            )}
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
              to get featured on the Cross Cart Global International Express
              Blog.
            </p>
          </div>

          <div className="mt-12 text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Subscribe to Our Newsletter
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Get the latest shipping tips, industry insights, and Cross Cart
              Global International Express updates delivered to your inbox.
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
