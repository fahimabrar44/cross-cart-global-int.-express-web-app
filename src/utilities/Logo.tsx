import Image from 'next/image'
import Link from 'next/link';
import React from 'react'

interface LogoProps {
  isFooter?: boolean;
  width?: number;
  height?: number;
}

const Logo: React.FC<LogoProps> = ({ width, height }) => {
  const imgWidth = width ?? 160;
  const imgHeight = height ?? 55;
  return (
    <Link href={"/"} aria-label="Cross Cart Global - Home">
      <Image
        src="/logos/full-logo.webp"
        alt="Cross Cart Global - Home"
        width={imgWidth}
        height={imgHeight}
        sizes="(max-width: 768px) 140px, 220px"
        className="object-contain"
      />
    </Link>
  )
}

export default Logo
