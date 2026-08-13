import Image from 'next/image'
import Link from 'next/link';
import React from 'react'

interface LogoProps {
  isFooter?: boolean;
  width?: number;
  height?: number;
}

const Logo: React.FC<LogoProps> = ({isFooter = false, width, height}) => {
  const imgWidth = width ?? 65;
  const imgHeight = height ?? 75;
  return (
    <Link href={"/"}>
      <Image
        src="/logo.png"
        alt="CrossCart Logo"
        width={imgWidth}
        height={imgHeight}
        className="object-contain"
        priority
      />
    </Link>
  )
}

export default Logo