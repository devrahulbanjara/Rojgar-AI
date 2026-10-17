'use client'

import { useT } from '@/lib/i18n/client'
import { notify } from '@/lib/notify'

import { CopyIcon, ViberIcon, WhatsAppIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'

/** Send a link to yourself (`self`) or a friend: Viber, WhatsApp, or copy it. */
export function SendLink({ text, url, self = false }: { text: string; url: string; self?: boolean }) {
  const t = useT()
  const message = encodeURIComponent(`${text} ${url}`)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      notify.success(t.common.linkCopied)
    } catch {
      notify.error(t.common.copyFailed)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button asChild size="lg" className="w-full">
        <a href={`viber://forward?text=${message}`}>
          <ViberIcon />
          {self ? t.send.toMyViber : t.send.viber}</a>
      </Button>
      <Button asChild size="lg" variant="outline" className="w-full">
        <a href={`https://wa.me/?text=${message}`} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon />
          {self ? t.send.toMyWhatsapp : t.send.whatsapp}
        </a>
      </Button>
      <Button size="lg" variant="outline" className="w-full" onClick={copy}>
        <CopyIcon />
        {t.send.copy}
      </Button>
    </div>
  )
}
