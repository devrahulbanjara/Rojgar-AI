'use client'

import { type CSSProperties, useMemo, useState } from 'react'

import Image from 'next/image'

import { avataaars, shapes } from '@dicebear/collection'
import { createAvatar } from '@dicebear/core'

type AvatarKind = 'person' | 'company'

type AvatarProps = {
  name: string
  src?: string | null
  seed?: string | null
  className: string
  sizes?: string
  kind?: AvatarKind
  style?: CSSProperties
}

const BRAND_BACKGROUND = ['b6e3f4', 'c0aede', 'ffd5dc', 'ffdfbf', 'd1d4f9']

function buildSvg(kind: AvatarKind, seed: string) {
  if (kind === 'company') {
    return createAvatar(shapes, {
      seed,
      backgroundColor: BRAND_BACKGROUND,
    }).toString()
  }
  return createAvatar(avataaars, {
    seed,
    backgroundColor: BRAND_BACKGROUND,
    topProbability: 95,
    accessoriesProbability: 10,
  }).toString()
}

export default function Avatar({
  name,
  src,
  seed,
  className,
  sizes = '40px',
  kind = 'person',
  style,
}: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showImage = Boolean(src) && src !== failedSrc

  const safeName = name?.trim() || 'User'
  const seedValue = seed?.trim() || safeName

  const svgDataUrl = useMemo(() => {
    const svg = buildSvg(kind, seedValue)
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  }, [kind, seedValue])

  return (
    <div className={`${className} media-badge`} style={style}>
      {showImage ? (
        <Image
          src={src!}
          alt={safeName}
          fill
          sizes={sizes}
          className="media-badge__image"
          onError={() => setFailedSrc(src ?? null)}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={svgDataUrl} alt={safeName} className="media-badge__image" />
      )}
    </div>
  )
}
