import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const QUESTIONS = [
  {
    q: 'Do candidates need an account?',
    a: 'No. They upload a CV, check the details we fill in, and apply in about a minute.',
  },
  {
    q: 'Where do I put the link?',
    a: 'Anywhere you post jobs. On LinkedIn, choose "apply on an external site" and paste it.',
  },
  {
    q: 'Does the AI reject people?',
    a: 'No. It ranks applicants and says why. You make every decision.',
  },
  {
    q: 'Who sees candidate data?',
    a: 'Only your team. Candidates can ask us to delete their data at any time.',
  },
  {
    q: 'Can I try it for free?',
    a: 'Yes. The Free plan includes 2 open jobs and needs no card.',
  },
]

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 bg-card py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          Questions
        </h2>
        <Accordion type="single" collapsible className="mt-8">
          {QUESTIONS.map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger className="text-base">{item.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
