"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Star } from "lucide-react";
import { useEffect, useState } from "react";

const fallbackTestimonials = [
  {
    name: "John Doe",
    avatar: "/professional-male-avatar.png",
    quote:
      "This platform has transformed how we manage our business. The results speak for themselves.",
    rating: 5,
    _id: "fb1",
  },
  {
    name: "Jane Doe",
    avatar: "/professional-female-avatar.png",
    quote:
      "Outstanding technical capabilities and seamless integration. Highly recommended.",
    rating: 5,
    _id: "fb2",
  },
  {
    name: "John Smith",
    avatar: "/business-professional-avatar.png",
    quote:
      "The efficiency gains we've seen are remarkable. This solution exceeded all expectations.",
    rating: 4,
    _id: "fb3",
  },
  {
    name: "Jane Smith",
    avatar: "/tech-professional-avatar.png",
    quote:
      "Clean, intuitive interface with powerful features. Perfect for our development workflow.",
    rating: 5,
    _id: "fb4",
  },
  {
    name: "Richard Doe",
    avatar: "/creative-professional-avatar.png",
    quote:
      "Beautiful design and excellent user experience. Everything we needed in one platform.",
    rating: 5,
    _id: "fb5",
  },
  {
    name: "Gordon Doe",
    avatar: "/developer-professional-avatar.png",
    quote:
      "Robust architecture and great developer tools. Makes our job so much easier.",
    rating: 4,
    _id: "fb6",
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Review = any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReview(r: any) {
  return {
    _id: r._id,
    name: r.user?.name || "Verified Customer",
    avatar: r.user?.avatar || "",
    quote: r.comment,
    rating: r.rating,
    isVerified: r.isVerified,
  };
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i <= Math.round(rating || 0)
              ? "fill-amber-400 text-amber-400"
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

const HomeCustomerReviewSection = ({
  initialReviews = [],
}: {
  initialReviews?: Review[];
}) => {
  const [api1, setApi1] = useState<CarouselApi>();
  const [api2, setApi2] = useState<CarouselApi>();
  const [reviews, setReviews] = useState<Review[]>(() =>
    (initialReviews || []).map(mapReview)
  );

  useEffect(() => {
    // Reviews are server-rendered; only refetch from the client when the SSR
    // list was empty (e.g. the API was unavailable during the render).
    if ((initialReviews || []).length > 0) return;
    const fetchReviews = async () => {
      try {
        const response = await fetch(
          `${window.location.origin}/api/v1/reviews?status=approved&limit=12`
        );
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          const mapped = data.data.map(mapReview);
          if (mapped.length > 0) setReviews(mapped);
        }
      } catch {
        // fallback to default testimonials
      }
    };
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const testimonials = reviews.length > 0 ? reviews : fallbackTestimonials;

  useEffect(() => {
    if (!api1 || !api2) return;

    const interval1 = setInterval(() => {
      api1.scrollNext();
    }, 3000);

    const interval2 = setInterval(() => {
      api2.scrollPrev();
    }, 3000);

    return () => {
      clearInterval(interval1);
      clearInterval(interval2);
    };
  }, [api1, api2]);

  const renderRow = (row: "row1" | "row2") => {
    const items = row === "row1" ? testimonials.slice(0, 6) : testimonials.slice(6);
    const list = items.length ? items : testimonials;

    return list.map((testimonial) => (
      <CarouselItem key={`${row}-${testimonial._id}`} className="pl-4 basis-auto">
        <Card className="max-w-68 p-3 select-none bg-white border border-border shadow-card h-full flex flex-col">
          <div className="mb-2 flex gap-4 items-center align-middle">
            <Avatar className="size-9 ring-1 ring-input">
              <AvatarImage
                src={testimonial.avatar || "/placeholder.svg"}
                alt={testimonial.name}
              />
              <AvatarFallback>
                {testimonial.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .slice(0, 2)
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <p className="font-medium text-lg text-foreground">
              {testimonial.name}
            </p>
          </div>
          <StarRow rating={testimonial.rating} />
          <blockquote className="text-sm text-muted-foreground mt-2 flex-1">
            &ldquo;{testimonial.quote}&ldquo;
          </blockquote>
        </Card>
      </CarouselItem>
    ));
  };

  return (
    <section className="py-15 w-full h-auto bg-soft-green px-4">
      <div className="container m-auto">
        <div className="lg:container m-auto">
          <div className="mt-5 space-y-4">
            {/* First carousel row - slides right */}
            <Carousel
              className="w-full"
              setApi={setApi1}
              opts={{
                align: "center",
                loop: true,
              }}
            >
              <CarouselContent className="-ml-4">
                {renderRow("row1")}
              </CarouselContent>
            </Carousel>

            {/* Second carousel row - slides left */}
            <Carousel
              className="w-full"
              setApi={setApi2}
              opts={{
                align: "center",
                loop: true,
              }}
            >
              <CarouselContent className="-ml-4">
                {renderRow("row2")}
              </CarouselContent>
            </Carousel>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeCustomerReviewSection;