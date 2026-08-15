import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] w-full flex-col items-center justify-center gap-5 bg-section px-6 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
        <FileQuestion className="h-12 w-12 text-primary" />
      </div>
      <p className="text-6xl font-extrabold tracking-tight text-primary">404</p>
      <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
      <p className="max-w-md text-muted-foreground">
        Sorry, the page you are looking for doesn’t exist or may have been moved.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Back to home
      </Link>
    </div>
  );
}
