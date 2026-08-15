import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/utilities/PageHeader";
import { fetchPublicObject } from "@/server/common/fetchPublic";
import { ArrowLeft, Calendar, Tag, User } from "lucide-react";

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  content: string;
  image?: string;
  category?: string;
  excerpt?: string;
  metaDescription?: string;
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

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = await fetchPublicObject<BlogPost>(`blogs/${slug}`);
  if (!blog) return {};

  const title = blog.title || "Blog Post";
  const description =
    blog.excerpt ||
    blog.metaDescription ||
    "Read this article on the Cross Cart Global International Express blog.";

  return {
    title,
    description,
    alternates: {
      canonical: `https://crosscartglobal.com/about/our-blog/${blog.slug}`,
    },
    openGraph: {
      title: `${title} | Cross Cart Global International Express`,
      description,
      url: `https://crosscartglobal.com/about/our-blog/${blog.slug}`,
      siteName: "Cross Cart Global International Express",
      type: "article",
      publishedTime: blog.createdAt,
      images: blog.image
        ? [{ url: blog.image }]
        : [{ url: "/full-logo.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Cross Cart Global International Express`,
      description,
      images: blog.image ? [blog.image] : ["/full-logo.png"],
    },
  };
}

const BlogDetail = async ({ params }: BlogDetailPageProps) => {
  const { slug } = await params;
  const blog = await fetchPublicObject<BlogPost>(`blogs/${slug}`);

  if (!blog) {
    notFound();
  }

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

      <article className="bg-white py-12 px-4 md:px-8 lg:px-16">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/about/our-blog"
            className="inline-flex items-center text-sm font-medium text-[#12352A] hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>

          {blog.image && (
            <div className="rounded-lg overflow-hidden mb-8 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={blog.image}
                alt={blog.title}
                className="w-full h-72 md:h-96 object-cover"
              />
            </div>
          )}

          <div className="mb-6">
            <span className="text-xs font-semibold text-primary uppercase tracking-wide mr-4">
              {blog.category
                ? CATEGORY_LABELS[blog.category] || blog.category
                : "General"}
            </span>
            <span className="inline-flex items-center text-xs text-gray-500">
              <Calendar className="w-4 h-4 mr-1" />
              {formatDate(blog.createdAt)}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
            {blog.title}
          </h1>

          {blog.author?.name && (
            <div className="flex items-center text-sm text-gray-500 mb-8">
              <User className="w-4 h-4 mr-1" />
              Written by {blog.author.name}
            </div>
          )}

          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
            <div
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: blog.content || "" }}
            />
          </div>

          {blog.tags && blog.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t flex flex-wrap items-center gap-2">
              <Tag className="w-4 h-4 text-gray-400" />
              {blog.tags.map((tag: string, index: number) => (
                <span
                  key={index}
                  className="text-xs bg-soft-green text-[#12352A] px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-10 pt-6 border-t text-center">
            <Link
              href="/about/our-blog"
              className="bg-[#12352A] text-white px-6 py-3 rounded-lg hover:bg-[#1c4a36] transition-colors font-medium"
            >
              Browse All Articles
            </Link>
          </div>
        </div>
      </article>
    </>
  );
};

export default BlogDetail;
