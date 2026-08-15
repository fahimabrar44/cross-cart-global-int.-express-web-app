import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[70vh] w-full flex-col items-center justify-center gap-4 bg-section px-6">
      <Loader2 className="h-14 w-14 animate-spin text-primary" />
      <p className="text-lg font-medium text-muted-foreground">
        Loading, please wait…
      </p>
    </div>
  );
}
