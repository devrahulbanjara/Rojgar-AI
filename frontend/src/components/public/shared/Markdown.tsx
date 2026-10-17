import { Fragment, type ReactNode } from 'react'

type Block =
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }

const HEADING = /^#{1,6}\s+(.*)$/
const BULLET = /^[-*+•]\s+(.*)$/
const NUMBERED = /^\d+[.)]\s+(.*)$/

const normalize = (text: string) =>
  text
    .replace(/[*_`]/g, '')
    .replace(/[\s.;:]+$/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

function parse(source: string): Block[] {
  const blocks: Block[] = []
  let paragraph: string[] = []
  const flush = () => {
    if (paragraph.length) blocks.push({ kind: 'paragraph', text: paragraph.join(' ') })
    paragraph = []
  }
  for (const raw of source.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim()
    const heading = HEADING.exec(line)
    const bullet = BULLET.exec(line) ?? NUMBERED.exec(line)
    if (!line) {
      flush()
    } else if (heading) {
      flush()
      blocks.push({ kind: 'heading', text: heading[1] })
    } else if (bullet) {
      flush()
      const ordered = !BULLET.test(line)
      const last = blocks.at(-1)
      if (last?.kind === 'list' && last.ordered === ordered) last.items.push(bullet[1])
      else blocks.push({ kind: 'list', ordered, items: [bullet[1]] })
    } else {
      paragraph.push(line)
    }
  }
  flush()
  return blocks
}

/** **bold** and *italic*; everything else (links, HTML) stays plain text. */
function inline(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*|__[^_]+__|\*[^*\s][^*]*\*)/g).map((part, i) => {
    if (/^(\*\*|__).+\1$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (/^\*.+\*$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>
    return <Fragment key={i}>{part.replace(/\\([*_#`])/g, '$1')}</Fragment>
  })
}

/**
 * A job description written in Markdown, rendered as plain React elements
 * (never as HTML). List items in `omit` are dropped (they are shown elsewhere
 * on the page, e.g. must-haves), and so is a heading left with nothing under it.
 */
export function Markdown({ source, omit = [] }: { source: string; omit?: string[] }) {
  const skip = new Set(omit.map(normalize))
  const kept = parse(source)
    .map((block) =>
      block.kind === 'list'
        ? { ...block, items: block.items.filter((item) => !skip.has(normalize(item))) }
        : block,
    )
    .filter((block) => block.kind !== 'list' || block.items.length)
  const blocks = kept.filter(
    (block, i) => block.kind !== 'heading' || (kept[i + 1] && kept[i + 1].kind !== 'heading'),
  )

  return (
    <div className="flex flex-col gap-3 text-[0.95rem] leading-relaxed text-foreground">
      {blocks.map((block, i) => {
        if (block.kind === 'heading') {
          return (
            <h3 key={i} className="mt-3 font-heading text-base font-semibold first:mt-0">
              {inline(block.text)}
            </h3>
          )
        }
        if (block.kind === 'paragraph') return <p key={i}>{inline(block.text)}</p>
        const List = block.ordered ? 'ol' : 'ul'
        return (
          <List
            key={i}
            className={`flex flex-col gap-1.5 pl-5 ${block.ordered ? 'list-decimal' : 'list-disc'}`}
          >
            {block.items.map((item, j) => (
              <li key={j}>{inline(item)}</li>
            ))}
          </List>
        )
      })}
    </div>
  )
}

/** Plain text of a Markdown description, for meta tags and JSON-LD. */
export function markdownToText(source: string): string {
  return parse(source)
    .map((block) =>
      block.kind === 'list' ? block.items.map((item) => `• ${item}`).join('\n') : block.text,
    )
    .join('\n')
    .replace(/(\*\*|__|\*)/g, '')
}
