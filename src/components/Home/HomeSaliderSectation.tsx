"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import Image from "next/image";
import { useEffect, useState } from "react";

const slider_image = [
  { id: 135, src: "/cover-1-1600.webp", alt: "Cross Cart Global - Fast and Reliable Shipping Solutions" },
  { id: 2345, src: "/cover-2-1600.webp", alt: "Cross Cart Global - Global Shipping Services" },
  { id: 234, src: "/cover-4-1600.webp", alt: "Cross Cart Global - Real-Time Shipment Tracking" },
  { id: 278, src: "/cover-6-1600.webp", alt: "Cross Cart Global - International Courier from Bangladesh" },
  { id: 1535, src: "/cover-7-1600.webp", alt: "Cross Cart Global - Competitive Shipping Rates" },
  { id: 267, src: "/cover-8-1600.webp", alt: "Cross Cart Global - Trusted Logistics Partner" },
  { id: 165, src: "/cover-9-1600.webp", alt: "Cross Cart Global - Comprehensive Shipping Solutions" },
  { id: 243, src: "/cover-1-1600.webp", alt: "Cross Cart Global - Fast and Reliable Shipping Solutions" },
  { id: 121, src: "/cover-2-1600.webp", alt: "Cross Cart Global - Global Shipping Services" },
];

const HomeSaliderSectation = () => {
  const [api, setApi] = useState<CarouselApi | null>(null);

  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 6000);

    return () => clearInterval(interval);
  }, [api]);

  const firstId = slider_image[0].id;

  return (
    <section className="w-full h-auto py-8 pb-4 bg-[#12352A] px-5">
      <div className="container h-auto m-auto p-4 sm:p-10">
        <Carousel setApi={setApi}>
          <CarouselContent>
            {slider_image.map((item) => (
              <CarouselItem key={item.id}>
                <div className="relative w-full h-[150px] md:h-[450px] p-2 overflow-hidden rounded-lg">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1200px"
                    priority={item.id === firstId}
                    className="object-cover rounded-lg"
                    fetchPriority={item.id === firstId ? "high" : undefined}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </section>
  );
};

export default HomeSaliderSectation;
