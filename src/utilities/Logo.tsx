import Image from "next/image";
import Link from "next/link";
import React from "react";

interface LogoProps {
  isFooter?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

const Logo: React.FC<LogoProps> = ({
  width,
  height,
  className = "",
  priority = false,
}) => {
  const imgWidth = width ?? 160;
  const imgHeight = height ?? 55;
  return (
    <Link
      href={"/"}
      aria-label="Cross Cart Global - Home"
      className="inline-flex shrink-0 items-center"
    >
      <Image
        src="/logos/full-logo.webp"
        alt="Cross Cart Global - Home"
        width={imgWidth}
        height={imgHeight}
        sizes="(max-width: 768px) 140px, 220px"
        priority={priority}
        className={`w-auto object-contain ${className}`}
      />
    </Link>
  );
};

export default Logo;
