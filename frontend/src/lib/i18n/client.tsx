'use client'

import { type ReactNode, createContext, useContext } from 'react'

import { useRouter } from 'next/navigation'

import { DICTS, type Dict, LOCALE_COOKIE, type Locale } from './index'

const LocaleContext = createContext<Locale>('en')

/** Set once in the root layout from the server's pick; changes re-render via router.refresh(). */
export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

export const useLocale = () => useContext(LocaleContext)

export function useT(): Dict {
  return DICTS[useContext(LocaleContext)]
}

/** Remember the choice for a year and re-render server components in that language. */
export function useSetLocale() {
  const router = useRouter()
  return (locale: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`
    document.documentElement.lang = locale
    router.refresh()
  }
}
