import Globe from "@/components/ui/globe";
import Link from "next/link";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  mainLink?: string;
  subLink?: string;
}

const PageHeader = ({
  title,
  subtitle,
  mainLink = "/",
  subLink = "/",
}: PageHeaderProps) => {
  return (
    <div className="container m-auto h-auto bg-soft-green relative overflow-hidden border-b border-border">
      <div className="flex flex-col py-20 sm:py-28 px-4 z-[20] container m-auto">
        <h1 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold text-foreground z-[20]">
          {subtitle}
        </h1>
        <div className="flex items-center gap-1 text-sm sm:text-lg font-bold text-muted-foreground mt-3 z-[20]">
          <Link href="/" className="hover:text-primary transition-colors">
            HOME
          </Link>
          <span className="text-primary">/</span>
          <Link
            href={mainLink}
            className="hover:text-primary transition-colors"
          >
            {title}
          </Link>
          {subtitle !== title ? (
            <>
              <span className="text-primary">/</span>
              <Link href={subLink} className="text-primary">
                {subtitle}
              </Link>
            </>
          ) : null}
        </div>
      </div>
      <Globe
        theta={0.2}
        dark={0}
        scale={1.2}
        diffuse={1.5}
        baseColor="#087F4F"
        markerColor="#F5C400"
        glowColor="#087F4F"
        className={` container left-0 absolute -bottom-[10%] sm:-bottom-[20%] md:-bottom-[60%] lg:-bottom-[80%] xl:-bottom-[100%] 2xl:-bottom-[150%] m-auto`}
      />
    </div>
  );
};

export default PageHeader;
