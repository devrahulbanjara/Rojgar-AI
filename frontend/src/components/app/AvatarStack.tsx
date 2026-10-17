import { AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar'

import { EntityAvatar } from './EntityAvatar'

/** Overlapping avatars with a "+N" counter. */
export function AvatarStack({
  people,
  max = 4,
}: {
  people: { name: string; src?: string | null }[]
  max?: number
}) {
  const shown = people.slice(0, max)
  const rest = people.length - shown.length
  return (
    <AvatarGroup>
      {shown.map((person) => (
        <EntityAvatar
          key={person.name}
          name={person.name}
          src={person.src}
          className="size-7 ring-2 ring-card"
        />
      ))}
      {rest > 0 ? <AvatarGroupCount className="size-7 text-xs">+{rest}</AvatarGroupCount> : null}
    </AvatarGroup>
  )
}
