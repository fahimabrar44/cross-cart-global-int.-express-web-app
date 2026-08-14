"use client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RoleGuard } from "@/middleware/roleGuard";
import { ContentService } from "@/services/dashboardService";
import { BookOpen, Mail, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ContentsPage() {
  const [blogCount, setBlogCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const blogs = await ContentService.getBlogs({ limit: 1 });
        if (blogs.success) setBlogCount(blogs.meta?.total || 0);
      } catch {
        /* noop */
      }
    };
    load();
  }, []);

  const cards = [
    {
      title: "Contact Messages",
      description: "Manage customer inquiries, complaints and support requests",
      icon: <Mail className="h-6 w-6 text-primary" />,
      href: "/dashboard/contact",
      count: null,
    },
    {
      title: "Blog Posts",
      description: "Create and manage blog articles for the website",
      icon: <BookOpen className="h-6 w-6 text-primary" />,
      href: "/dashboard/contents/blogs",
      count: blogCount,
    },
  ];

  return (
    <RoleGuard allowedRoles={["admin", "moderator"]}>
      <div className="space-y-6" data-testid="contents-page">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content</h1>
          <p className="text-muted-foreground">
            Manage site content including contact messages and blog posts
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {cards.map((card) => (
            <Link key={card.title} href={card.href}>
              <Card className="hover:shadow-lg transition-shadow h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="bg-section rounded-full p-3">{card.icon}</div>
                    {card.count !== null && (
                      <Badge variant="secondary">{card.count} total</Badge>
                    )}
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-foreground">
                      {card.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {card.description}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center space-x-1 text-primary text-sm font-medium">
                    <Plus className="h-4 w-4" />
                    <span>Open</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </RoleGuard>
  );
}