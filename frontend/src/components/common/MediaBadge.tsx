'use client'

import { useState } from 'react'

import Image from 'next/image'

type MediaBadgeProps = {
  src?: string | null
  alt: string
  fallback: string
  className: string
  sizes: string
  style?: React.CSSProperties
}

export default function MediaBadge({
  src,
  alt,
  fallback,
  className,
  sizes,
  style,
}: MediaBadgeProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  const showImage = Boolean(src) && src !== failedSrc

  return (
    <div className={`${className}${showImage ? ' media-badge' : ''}`} style={style}>
      {showImage ? (
        <Image
          src={src!}
          alt={alt}
          fill
          sizes={sizes}
          className="media-badge__image"
          onError={() => setFailedSrc(src ?? null)}
        />
      ) : (
        fallback
      )}
    </div>
  )
}
