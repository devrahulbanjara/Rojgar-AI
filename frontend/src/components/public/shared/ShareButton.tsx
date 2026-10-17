'use client'

import { useT } from '@/lib/i18n/client'
import { notify } from '@/lib/notify'

import { ShareIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'

/** Phone share sheet (Viber, WhatsApp, Messenger…) where there is one, else copy the link. */
export function ShareButton({ path, text }: { path: string; text: string }) {
  const t = useT()

  async function share() {
    const url = new URL(path, window.location.origin).toString()
    if (navigator.share) {
      try {
        await navigator.share({ text, url })
        return
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`)
      notify.success(t.common.linkCopied)
    } catch {
      notify.error(t.common.copyFailed)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={share}>
      <ShareIcon />
      {t.common.share}
    </Button>
  )
}
