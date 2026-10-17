'use client'

import {
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { cn } from '@/lib/utils'
import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

import { EmptyState } from '@/components/app/EmptyState'
import { ArrowDownIcon, ArrowUpIcon, SortIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { DataTablePagination } from './DataTablePagination'
import { columnIdOf, facetFilterFn, useColumnVisibility, useControllable } from './DataTableState'
import { type DataTableFilter, DataTableToolbar, columnLabel } from './DataTableToolbar'

export type { DataTableFilter, DataTableFilterOption } from './DataTableToolbar'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    /** Applied to header and cells, e.g. 'hidden md:table-cell' or 'text-right'. */
    className?: string
    /** Name used in the Columns menu, filter chips and sort button. */
    label?: string
  }
}

const SEARCH_DEBOUNCE_MS = 250
const SKELETON_ROWS = 5
const INTERACTIVE =
  'a, button, input, select, textarea, label, [role="checkbox"], [role="menuitem"]'

/** Header button: click sorts ascending → descending → off; shift-click adds a column. */
export function SortableHeader<T>({ column, label }: { column: Column<T>; label: string }) {
  'use no memo'
  const sorted = column.getIsSorted()
  const Icon = sorted === 'asc' ? ArrowUpIcon : sorted === 'desc' ? ArrowDownIcon : SortIcon
  const next = sorted === 'asc' ? 'descending' : sorted === 'desc' ? 'not sorted' : 'ascending'
  return (
    <Button
      variant="ghost"
      size="xs"
      onClick={column.getToggleSortingHandler()}
      aria-label={`${label}, sort ${next}`}
      className={cn(
        '-ml-2 text-xs font-medium text-muted-foreground hover:text-foreground',
        sorted && 'text-foreground',
      )}
    >
      {label}
      <Icon className={cn('size-3', !sorted && 'opacity-40')} aria-hidden />
    </Button>
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

/** Sticky bar shown while rows are selected: "3 selected · [Shortlist] [Reject]". */
export function BulkBar({ count, children }: { count: number; children: ReactNode }) {
  return (
    <div className="sticky top-16 z-20 flex h-12 items-center gap-3 border-b bg-card px-4">
      <span className="text-sm font-medium">{count} selected</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
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
    enableHiding: false,
  }
}

function ariaSort(sorted: false | 'asc' | 'desc', canSort: boolean) {
  if (sorted === 'asc') return 'ascending' as const
  if (sorted === 'desc') return 'descending' as const
  return canSort ? ('none' as const) : undefined
}

export type DataTableProps<T> = {
  columns: ColumnDef<T>[]
  data: T[]
  getRowId: (row: T) => string
  /** Render bulk actions for the selected rows; enables the checkbox column. */
  bulkActions?: (rows: T[], clear: () => void) => ReactNode
  /** Shown (as an EmptyState) when there are no rows at all. */
  emptyText?: ReactNode
  emptyAction?: ReactNode
  initialSorting?: SortingState
  pageSizes?: number[]
  /** Skeleton rows instead of data. */
  loading?: boolean

  /** Shows the search box (global filter, debounced). */
  searchPlaceholder?: string
  /** Faceted filter buttons, one per column. */
  filters?: DataTableFilter[]
  /** Enables the "Columns" menu; the choice is remembered under this id. */
  tableId?: string

  /** Enter (or a click on the row's empty space) opens the row. */
  onRowOpen?: (row: T) => void
  /** Same as onRowOpen, navigating to this URL. */
  getRowHref?: (row: T) => string

  /** Server-side mode: pass the page's rows in `data` and the full count in `rowCount`. */
  manualPagination?: boolean
  rowCount?: number
  pagination?: PaginationState
  onPaginationChange?: (next: PaginationState) => void
  manualSorting?: boolean
  sorting?: SortingState
  onSortingChange?: (next: SortingState) => void
  manualFiltering?: boolean
  globalFilter?: string
  onGlobalFilterChange?: (next: string) => void
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: (next: ColumnFiltersState) => void
}

/**
 * The one table: click-to-sort headers, search, faceted filters with chips,
 * a remembered Columns menu, paging, row selection with a sticky bulk bar,
 * keyboard-openable rows, skeleton/empty/no-results states. Client-side by
 * default; server-side when `manualPagination` + `rowCount` are given.
 */
export function DataTable<T>({
  columns,
  data,
  getRowId,
  bulkActions,
  emptyText = 'Nothing here yet.',
  emptyAction,
  initialSorting = [],
  pageSizes = [10, 25, 50],
  loading = false,
  searchPlaceholder,
  filters,
  tableId,
  onRowOpen,
  getRowHref,
  manualPagination = false,
  rowCount,
  manualSorting = false,
  manualFiltering = false,
  ...controlled
}: DataTableProps<T>) {
  // TanStack Table returns unstable functions; opt this component out of the React Compiler.
  'use no memo'
  const router = useRouter()
  const [sorting, setSorting] = useControllable(
    controlled.sorting,
    controlled.onSortingChange,
    initialSorting,
  )
  const [globalFilter, setGlobalFilter] = useControllable(
    controlled.globalFilter,
    controlled.onGlobalFilterChange,
    '',
  )
  const [columnFilters, setColumnFilters] = useControllable(
    controlled.columnFilters,
    controlled.onColumnFiltersChange,
    [],
  )
  const [pagination, setPagination] = useControllable(
    controlled.pagination,
    controlled.onPaginationChange,
    { pageIndex: 0, pageSize: pageSizes[0] },
  )
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [columnVisibility, setColumnVisibility] = useColumnVisibility(tableId)

  // The input updates at once; the table filter follows after a short pause.
  const [search, setSearch] = useState(globalFilter)
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(searchTimer.current), [])
  function onSearchChange(value: string) {
    setSearch(value)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setGlobalFilter(value.trim()), SEARCH_DEBOUNCE_MS)
  }
  function clearFilters() {
    clearTimeout(searchTimer.current)
    setSearch('')
    setGlobalFilter('')
    setColumnFilters([])
  }

  const facetIds = new Set((filters ?? []).map((filter) => filter.column))
  const tableColumns = columns.map((def) => {
    const id = columnIdOf(def)
    return id && facetIds.has(id) && !def.filterFn
      ? ({ ...def, filterFn: facetFilterFn } as ColumnDef<T>)
      : def
  })

  const table = useReactTable({
    data,
    columns: bulkActions ? [selectionColumn<T>(), ...tableColumns] : tableColumns,
    getRowId,
    state: { sorting, rowSelection, globalFilter, columnFilters, columnVisibility, pagination },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    enableRowSelection: !!bulkActions,
    sortDescFirst: false,
    manualPagination,
    manualSorting,
    manualFiltering,
    rowCount: manualPagination ? rowCount : undefined,
    autoResetPageIndex: !manualPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const selected = table.getSelectedRowModel().rows.map((row) => row.original)
  const rows = table.getRowModel().rows
  const total = manualPagination
    ? (rowCount ?? data.length)
    : table.getFilteredRowModel().rows.length
  const isFiltered = globalFilter.length > 0 || columnFilters.length > 0
  const hasToolbar = searchPlaceholder !== undefined || !!filters?.length || !!tableId
  const showBulkBar = !!bulkActions && selected.length > 0
  const visibleColumns = table.getVisibleLeafColumns()

  const open = onRowOpen ?? (getRowHref ? (row: T) => router.push(getRowHref(row)) : undefined)
  function onRowClick(event: MouseEvent<HTMLTableRowElement>, row: T) {
    if (!open || (event.target as HTMLElement).closest(INTERACTIVE)) return
    if (window.getSelection()?.toString()) return
    open(row)
  }
  function onRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, row: T) {
    if (open && event.key === 'Enter' && event.target === event.currentTarget) {
      event.preventDefault()
      open(row)
    }
  }

  if (!loading && data.length === 0 && !isFiltered) {
    return <EmptyState action={emptyAction}>{emptyText}</EmptyState>
  }

  return (
    <div className="flex flex-col gap-3">
      {hasToolbar ? (
        <DataTableToolbar
          table={table}
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
          filters={filters}
          showColumns={!!tableId}
          onReset={clearFilters}
        />
      ) : null}
      <div
        className="overflow-clip rounded-xl border bg-card md:[&_[data-slot=table-container]]:overflow-visible"
        style={{ '--dt-sticky-top': showBulkBar ? '7rem' : '4rem' } as CSSProperties}
      >
        {showBulkBar ? (
          <BulkBar count={selected.length}>
            {bulkActions(selected, () => setRowSelection({}))}
          </BulkBar>
        ) : null}
        <Table aria-busy={loading || undefined}>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="hover:bg-transparent">
                {group.headers.map((header) => {
                  const { column } = header
                  const def = column.columnDef.header
                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={ariaSort(column.getIsSorted(), column.getCanSort())}
                      className={cn(
                        'z-10 h-10 md:sticky md:top-(--dt-sticky-top) bg-card text-xs text-muted-foreground shadow-[inset_0_-1px_0_var(--border)]',
                        column.id === '_select' && 'w-10',
                        column.columnDef.meta?.className,
                      )}
                    >
                      {header.isPlaceholder ? null : typeof def === 'string' &&
                        column.getCanSort() ? (
                        <SortableHeader column={column} label={columnLabel(column)} />
                      ) : (
                        flexRender(def, header.getContext())
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: SKELETON_ROWS }, (_, i) => (
                <TableRow key={`skeleton-${i}`} className="hover:bg-transparent">
                  {visibleColumns.map((column) => (
                    <TableCell
                      key={column.id}
                      className={cn('py-3', column.columnDef.meta?.className)}
                    >
                      <Skeleton className={cn('h-4', column.id === '_select' ? 'w-4' : 'w-3/4')} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  tabIndex={open ? 0 : undefined}
                  onClick={open ? (event) => onRowClick(event, row.original) : undefined}
                  onKeyDown={open ? (event) => onRowKeyDown(event, row.original) : undefined}
                  className={cn(
                    open &&
                      'cursor-pointer outline-none focus-visible:bg-accent focus-visible:shadow-[inset_3px_0_0_var(--primary)]',
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn('py-3', cell.column.columnDef.meta?.className)}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-28 text-center text-sm text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <span>No results.</span>
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {!loading && total > pageSizes[0] ? (
          <DataTablePagination table={table} total={total} pageSizes={pageSizes} />
        ) : null}
      </div>
    </div>
  )
}
