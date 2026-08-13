"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ApiKeysRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/settings/api-config-and-access");
  }, [router]);
  return (
    <div className="flex items-center justify-center min-h-screen text-muted-foreground">
      Redirecting...
    </div>
  );
}