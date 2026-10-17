'use client'

import { cn } from '@/lib/utils'
import type { Column, Table } from '@tanstack/react-table'

import { CheckIcon, ChevronDownIcon, PlusIcon, SearchIcon, XIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export type DataTableFilterOption = {
  value: string
  label: string
  /** Server-side tables pass counts; client tables count the rows themselves. */
  count?: number
}

/** A faceted filter button: one per column you want people to narrow by. */
export type DataTableFilter = {
  column: string
  title: string
  /** Defaults to the distinct values in the column, labelled as-is. */
  options?: DataTableFilterOption[]
}

/** "Status", "Applied"… taken from `meta.label`, a string header, or the column id. */
export function columnLabel<T>(column: Column<T, unknown>): string {
  const { meta, header } = column.columnDef
  return meta?.label ?? (typeof header === 'string' ? header : column.id)
}

function filterOptions<T>(column: Column<T, unknown>, filter: DataTableFilter) {
  const counts = new Map<string, number>()
  for (const [value, count] of column.getFacetedUniqueValues()) {
    counts.set(String(value), (counts.get(String(value)) ?? 0) + count)
  }
  const options: DataTableFilterOption[] =
    filter.options ??
    [...counts.keys()].sort((a, b) => a.localeCompare(b)).map((value) => ({ value, label: value }))
  return options.map((option) => ({
    ...option,
    count: option.count ?? counts.get(option.value) ?? 0,
  }))
}

function FacetFilter<T>({
  column,
  filter,
}: {
  column: Column<T, unknown>
  filter: DataTableFilter
}) {
  'use no memo'
  const selected = new Set((column.getFilterValue() as string[] | undefined) ?? [])
  const options = filterOptions(column, filter)

  function toggle(value: string) {
    const next = new Set(selected)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    column.setFilterValue(next.size ? [...next] : undefined)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('border-dashed', selected.size && 'border-solid border-foreground/40')}
        >
          <PlusIcon className={cn(selected.size && 'hidden')} />
          {filter.title}
          {selected.size ? (
            <span className="rounded-full bg-foreground px-1.5 text-xs text-background tabular-nums">
              {selected.size}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-0" align="start">
        <Command>
          {options.length > 7 ? <CommandInput placeholder={filter.title} /> : null}
          <CommandList>
            <CommandEmpty>No matches.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const checked = selected.has(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.value}`}
                    onSelect={() => toggle(option.value)}
                    aria-checked={checked}
                  >
                    <span
                      className={cn(
                        'flex size-4 items-center justify-center rounded-[4px] border border-input',
                        checked && 'border-primary bg-primary text-primary-foreground',
                      )}
                    >
                      {checked ? <CheckIcon className="size-3 text-primary-foreground" /> : null}
                    </span>
                    <span className="truncate">{option.label}</span>
                    <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                      {option.count}
                    </span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selected.size ? (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => column.setFilterValue(undefined)}
                    className="justify-center"
                  >
                    Clear
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function ColumnsMenu<T>({ table }: { table: Table<T> }) {
  'use no memo'
  const columns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide() && column.id !== '_select')
  if (columns.length < 2) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          Columns
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Show columns
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={column.getIsVisible()}
            onCheckedChange={(value) => column.toggleVisibility(!!value)}
            onSelect={(event) => event.preventDefault()}
          >
            {columnLabel(column)}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Search · filter buttons · Columns, then the active filters as removable chips. */
export function DataTableToolbar<T>({
  table,
  search,
  onSearchChange,
  searchPlaceholder,
  filters = [],
  showColumns,
  onReset,
}: {
  table: Table<T>
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters?: DataTableFilter[]
  showColumns: boolean
  onReset: () => void
}) {
  'use no memo'
  const facets = filters
    .map((filter) => ({ filter, column: table.getColumn(filter.column) }))
    .filter((facet): facet is { filter: DataTableFilter; column: Column<T, unknown> } =>
      Boolean(facet.column),
    )
  const chips = facets.flatMap(({ filter, column }) => {
    const values = (column.getFilterValue() as string[] | undefined) ?? []
    return values.map((value) => ({
      key: `${column.id}:${value}`,
      label: `${filter.title}: ${filter.options?.find((o) => o.value === value)?.label ?? value}`,
      remove: () => {
        const rest = values.filter((v) => v !== value)
        column.setFilterValue(rest.length ? rest : undefined)
      },
    }))
  })
  const filtered = chips.length > 0 || search.trim().length > 0

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {searchPlaceholder !== undefined ? (
          <div className="relative w-full sm:w-64">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="h-8 rounded-full bg-card pl-9"
            />
          </div>
        ) : null}
        {facets.map(({ filter, column }) => (
          <FacetFilter key={column.id} column={column} filter={filter} />
        ))}
        {filtered ? (
          <Button variant="ghost" size="sm" onClick={onReset}>
            Reset
          </Button>
        ) : null}
        {showColumns ? (
          <div className="ml-auto">
            <ColumnsMenu table={table} />
          </div>
        ) : null}
      </div>
      {chips.length ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Active filters">
          {chips.map((chip) => (
            <li key={chip.key}>
              <Button
                variant="secondary"
                size="xs"
                onClick={chip.remove}
                aria-label={`Remove ${chip.label}`}
              >
                {chip.label}
                <XIcon />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
