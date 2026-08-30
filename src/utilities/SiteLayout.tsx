"use client";
import FooterBar from "@/components/Footer/FooterBar";
import NavBar from "@/components/Nav/NavBar";
import WhatsAppButton from "@/components/WhatsApp/WhatsAppButton";
import { useAuth } from "@/hooks/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { Toaster } from "sonner";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) { 
  const pathName = usePathname().split("/")[1];
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    // The AuthContext already handles auto-refresh, so no need to manually trigger it here
  }, []);

  if (pathName == "auth" && auth?.accessToken) {
    router.push("/dashboard");
  }

  // Dashboard has its own layout, so don't handle it here
  if (pathName == "dashboard") {
    return (
      <>
        {children}
        <Toaster expand={false} position="top-center" closeButton />
      </>
    );
  }

  if (pathName != "dashboard") {
    return (
      <>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <NavBar />
        <div className="w-full h-[70px]" aria-hidden="true"></div>
        <main id="main-content">{children}</main>
        <FooterBar />
        <WhatsAppButton />
        <Toaster expand={false} position="top-center" closeButton />
      </>
    );
  }
}
