'use client'

import { useState, useSyncExternalStore } from 'react'

import type { ColumnDef, FilterFn, Updater, VisibilityState } from '@tanstack/react-table'

/** Controlled when `value` is given, otherwise local state. `onChange` always fires. */
export function useControllable<S>(
  value: S | undefined,
  onChange: ((next: S) => void) | undefined,
  initial: S,
): [S, (updater: Updater<S>) => void] {
  'use no memo'
  const [inner, setInner] = useState<S>(initial)
  const state = value === undefined ? inner : value
  const set = (updater: Updater<S>) => {
    const next = typeof updater === 'function' ? (updater as (old: S) => S)(state) : updater
    if (value === undefined) setInner(next)
    onChange?.(next)
  }
  return [state, set]
}

const STORAGE_EVENT = 'rojgar:datatable-columns'

function storageKey(tableId: string) {
  return `rojgar.table.${tableId}.columns`
}

function readStored(key: string | null): string | null {
  if (!key) return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange)
  window.addEventListener(STORAGE_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(STORAGE_EVENT, onChange)
  }
}

function parse(raw: string | null): VisibilityState | null {
  if (!raw) return null
  try {
    const value: unknown = JSON.parse(raw)
    return value && typeof value === 'object' ? (value as VisibilityState) : null
  } catch {
    return null
  }
}

/**
 * Column visibility remembered per table in localStorage. Server render and
 * first client render show every column, so hydration always matches.
 */
export function useColumnVisibility(
  tableId: string | undefined,
): [VisibilityState, (updater: Updater<VisibilityState>) => void] {
  'use no memo'
  const key = tableId ? storageKey(tableId) : null
  const raw = useSyncExternalStore(
    subscribe,
    () => readStored(key),
    () => null,
  )
  const [local, setLocal] = useState<VisibilityState>({})
  const stored = parse(raw)
  const state = stored ?? local

  const set = (updater: Updater<VisibilityState>) => {
    const next = typeof updater === 'function' ? updater(state) : updater
    setLocal(next)
    if (!key) return
    try {
      window.localStorage.setItem(key, JSON.stringify(next))
      window.dispatchEvent(new Event(STORAGE_EVENT))
    } catch {
      // Private mode or blocked storage: the choice lasts for this visit only.
    }
  }
  return [state, set]
}

/** Faceted filter match: the cell value is one of the checked options. */
export const facetFilterFn: FilterFn<unknown> = (row, columnId, value: string[]) =>
  !value?.length || value.includes(String(row.getValue(columnId)))

export function columnIdOf<T>(def: ColumnDef<T>): string | undefined {
  if (def.id) return def.id
  if ('accessorKey' in def && def.accessorKey !== undefined)
    return String(def.accessorKey).replaceAll('.', '_')
  return typeof def.header === 'string' ? def.header : undefined
}
