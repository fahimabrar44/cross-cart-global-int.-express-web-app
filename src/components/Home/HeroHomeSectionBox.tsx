"use client";

import { Input } from "../ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";

const HeroHomeSectionBox = () => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const router = useRouter();

  const handleTrack = () => {
    const id = trackingNumber.trim();
    if (!id) return;
    router.push(`/ship-and-track/track-shipment?trackId=${encodeURIComponent(id)}`);
  };

  return (
    <div className="w-full h-auto flex items-center align-middle justify-center pt-5 pb-36 sm:pb-24 relative z-[20] m-auto">
      <div className=" w-full max-w-[650px] bg-white rounded-xl shadow-card p-2 border border-border ">
        <div className=" w-full h-auto p-2 border-b border-soft-green">
          <div className=" border-primary border-2 rounded-xl mb-2 overflow-hidden">
            <Input
              className=" outline-0 border-none p-5 py-6 text-lg md:text-lg "
              placeholder="Enter Tracking Number"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTrack();
              }}
            />
            <button
              onClick={handleTrack}
              className=" text-white font-semibold rounded-none w-full h-auto p-3 bg-primary hover:bg-[#087F4F] cursor-pointer transition-colors"
            >
              Track shipment
            </button>
          </div>
        </div>

        <div className="p-2">
          <h3 className="font-bold text-base md:text-lg text-foreground">Can’t Find Your Order Details?</h3>
          <h4 className="font-medium text-sm md:text-base text-muted-foreground">
            We have sent your AWB (tracking) number to you via email and
            WhatsApp upon booking the shipment.
          </h4>
        </div>
      </div>
    </div>
  );
};

export default HeroHomeSectionBox;
