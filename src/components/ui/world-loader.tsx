import { cn } from "@/lib/utils";

type WorldLoaderProps = {
  fullScreen?: boolean;
  label?: string;
  className?: string;
};

export default function WorldLoader({
  fullScreen = false,
  label = "Loading...",
  className,
}: WorldLoaderProps) {
  const globe = (
    <img
      src="/world.svg"
      alt="Loading"
      className={cn("h-48 w-48", className)}
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
        {globe}
        {label ? (
          <p className="text-sm text-muted-foreground">{label}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10">
      {globe}
      {label ? (
        <p className="text-sm text-muted-foreground">{label}</p>
      ) : null}
    </div>
  );
}
