'use client'

import { type ReactNode, useState } from 'react'

import Link from 'next/link'

import { cn } from '@/lib/utils'
import {
  type Column,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { EntityAvatar } from './EntityAvatar'

/** Header button with a small sort arrow. */
export function SortableHeader<T>({ column, label }: { column: Column<T>; label: string }) {
  const sorted = column.getIsSorted()
  const Icon = sorted === 'asc' ? ArrowUp : sorted === 'desc' ? ArrowDown : ArrowUpDown
  return (
    <button
      type="button"
      onClick={() => column.toggleSorting(sorted === 'asc')}
      className="-ml-1 inline-flex items-center gap-1 rounded px-1 text-xs font-medium hover:text-foreground"
    >
      {label}
      <Icon className={cn('size-3', !sorted && 'opacity-40')} />
    </button>
  )
}

/** First cell: avatar/thumbnail + bold name + muted meta. */
export function PrimaryCell({
  name,
  meta,
  src,
  kind = 'person',
  href,
}: {
  name: string
  meta?: ReactNode
  src?: string | null
  kind?: 'person' | 'company'
  href?: string
}) {
  const body = (
    <span className="flex min-w-0 items-center gap-3">
      <EntityAvatar name={name} src={src} kind={kind} className="size-8" />
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium text-foreground">{name}</span>
        {meta ? <span className="truncate text-xs text-muted-foreground">{meta}</span> : null}
      </span>
    </span>
  )
  return href ? (
    <Link href={href} className="hover:underline">
      {body}
    </Link>
  ) : (
    body
  )
}

/** Right-aligned text link: "Open →", "Review →". */
export function RowLink({ href, children = 'Open' }: { href: string; children?: ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm font-medium whitespace-nowrap text-primary hover:underline"
    >
      {children} →
    </Link>
  )
}

function selectionColumn<T>(): ColumnDef<T> {
  return {
    id: '_select',
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all on this page"
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select row"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
  }
}

/**
 * The workhorse table: sortable headers, optional checkbox column with a
 * sticky bulk bar, and a "Showing 1–10 of 48" footer with page size + paging.
 */
export function DataTable<T>({
  columns,
  data,
  getRowId,
  bulkActions,
  emptyText = 'Nothing here yet.',
  initialSorting = [],
  pageSizes = [10, 25, 50],
}: {
  columns: ColumnDef<T>[]
  data: T[]
  getRowId: (row: T) => string
  /** Render bulk actions for the selected rows; enables the checkbox column. */
  bulkActions?: (rows: T[], clear: () => void) => ReactNode
  emptyText?: string
  initialSorting?: SortingState
  pageSizes?: number[]
}) {
  // TanStack Table returns unstable functions; opt this component out of the React Compiler.
  'use no memo'
  const [sorting, setSorting] = useState<SortingState>(initialSorting)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const table = useReactTable({
    data,
    columns: bulkActions ? [selectionColumn<T>(), ...columns] : columns,
    getRowId,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: !!bulkActions,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: pageSizes[0] } },
  })

  const selected = table.getSelectedRowModel().rows.map((row) => row.original)
  const { pageIndex, pageSize } = table.getState().pagination
  const total = data.length
  const from = total === 0 ? 0 : pageIndex * pageSize + 1
  const to = Math.min(total, (pageIndex + 1) * pageSize)

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {bulkActions && selected.length > 0 ? (
        <div className="sticky top-16 z-10 flex items-center gap-3 border-b bg-card px-4 py-2">
          <span className="text-sm font-medium">{selected.length} selected</span>
          <div className="flex items-center gap-2">
            {bulkActions(selected, () => setRowSelection({}))}
          </div>
        </div>
      ) : null}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id} className="hover:bg-transparent">
              {group.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cn(
                    'h-10 text-xs text-muted-foreground',
                    header.column.id === '_select' && 'w-10',
                  )}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={table.getVisibleLeafColumns().length}
                className="h-24 text-center text-sm text-muted-foreground"
              >
                {emptyText}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {total > pageSizes[0] ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-xs text-muted-foreground">
          <span>
            Showing {from}–{to} of {total}
          </span>
          <div className="flex items-center gap-3">
            <Select
              value={String(pageSize)}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger size="sm" className="h-8 w-20" aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizes.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Previous page"
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Next page"
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
