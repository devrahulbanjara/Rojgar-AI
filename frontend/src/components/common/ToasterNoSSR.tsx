'use client'

import dynamic from 'next/dynamic'

// dynamic with ssr:false must live in a Client Component.
// This thin wrapper is imported statically in the Server Component layout.
const Toaster = dynamic(() => import('./Toaster'), { ssr: false })

export default function ToasterNoSSR() {
  return <Toaster />
}
