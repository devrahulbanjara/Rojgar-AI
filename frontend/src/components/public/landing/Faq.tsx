import type { Dict } from '@/lib/i18n'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export function Faq({ t }: { t: Dict }) {
  return (
    <section id="faq" className="scroll-mt-20 bg-card py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          {t.landing.faq.title}
        </h2>
        <Accordion type="single" collapsible className="mt-8">
          {t.landing.faq.items.map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger className="text-left text-base">{item.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
