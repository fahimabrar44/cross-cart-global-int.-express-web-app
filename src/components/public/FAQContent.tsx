"use client";

import { Badge } from "@/components/ui/badge";
import { HelpCircle, Search } from "lucide-react";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import PageHeader from "@/utilities/PageHeader";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FAQ = any;

export default function FAQContent({ initialFaqs }: { initialFaqs: FAQ[] }) {
  const [faqs] = useState<FAQ[]>(initialFaqs);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = useMemo(() => {
    const set = new Set(faqs.map((f) => f.category || "General"));
    return ["All", ...Array.from(set)];
  }, [faqs]);

  const filtered = useMemo(() => {
    return faqs.filter((f) => {
      const categoryMatch =
        activeCategory === "All" || (f.category || "General") === activeCategory;
      const q = query.trim().toLowerCase();
      const queryMatch =
        !q ||
        (f.question || "").toLowerCase().includes(q) ||
        (f.answer || "").toLowerCase().includes(q);
      return categoryMatch && queryMatch;
    });
  }, [faqs, activeCategory, query]);

  return (
    <div className="w-full h-auto bg-soft-green overflow-x-hidden">
      <PageHeader
        title="FAQ"
        subtitle="Frequently Asked Questions"
        mainLink="/faq"
        subLink="/faq"
      />

      <div className="w-full bg-white">
        <section className="bg-background container m-auto py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <div className="bg-soft-green rounded-full p-4 inline-flex mb-4">
                <HelpCircle className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Frequently Asked Questions
              </h1>
              <p className="text-muted-foreground mt-3">
                Everything you need to know about shipping with Cross Cart Global
                International Express. Can&apos;t find an answer?{" "}
                <Link href="/contact" className="text-primary hover:underline">
                  Contact our team
                </Link>
                .
              </p>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search questions..."
                className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Category filters */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === cat
                      ? "bg-primary text-white"
                      : "bg-soft-green text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* FAQ list */}
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No FAQs found. Try a different search or category.
                </p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full space-y-3">
                {filtered.map((faq) => (
                  <AccordionItem
                    key={faq._id}
                    value={faq._id}
                    className="border border-border rounded-lg px-4"
                  >
                    <AccordionTrigger className="text-left font-medium hover:no-underline py-4">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4">
                      <Badge variant="secondary" className="mb-2">
                        {faq.category || "General"}
                      </Badge>
                      <div className="whitespace-pre-line">{faq.answer}</div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
