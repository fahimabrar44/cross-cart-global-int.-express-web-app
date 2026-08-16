"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useEffect, useState } from "react";

const slider_image = [
  { id: 135, src: "/cover-1.png" },
  { id: 2345, src: "/cover-2.png" },
  { id: 234, src: "/cover-4.png" },
  { id: 278, src: "/cover-6.png" },
  { id: 1535, src: "/cover-7.png" },
  { id: 267, src: "/cover-8.png" },
  { id: 165, src: "/cover-9.png" },
  { id: 243, src: "/cover-1.png" },
  { id: 121, src: "/cover-2.png" },
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

  return (
    <div className="w-full h-auto py-8 pb-4 bg-[#12352A] px-5">
      <div className="container h-auto m-auto p-4 sm:p-10">
        <Carousel setApi={setApi}>
          <CarouselContent>
            {slider_image.map((item) => (
              <CarouselItem key={item.id}>
                <div
                  className="w-full h-[150px] md:h-[450px] p-2 bg-cover rounded-lg bg-no-repeat bg-center"
                  style={{ backgroundImage: `url(${item.src})` }}
                ></div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </div>
  );
};

export default HomeSaliderSectation;
