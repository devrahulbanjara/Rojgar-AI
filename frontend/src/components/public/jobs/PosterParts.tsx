'use client'

import { QRCodeSVG } from 'qrcode.react'

import { useT } from '@/lib/i18n/client'

import { PrinterIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'

export function PosterQr({ url }: { url: string }) {
  // Black on white with a quiet zone, so it scans from a photocopy too.
  return (
    <QRCodeSVG
      value={url}
      size={512}
      level="M"
      marginSize={2}
      bgColor="#ffffff"
      fgColor="#000000"
      className="h-auto w-full"
      title={url}
    />
  )
}

export function PrintButton() {
  const t = useT()
  return (
    <Button size="lg" onClick={() => window.print()}>
      <PrinterIcon />
      {t.poster.print}
    </Button>
  )
}
