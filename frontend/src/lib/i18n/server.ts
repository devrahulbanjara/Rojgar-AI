import { cookies, headers } from 'next/headers'

import { DICTS, type Dict, LOCALE_COOKIE, type Locale, pickLocale } from './index'

/** Locale for server components: the cookie set by the language toggle, else the browser's. */
export async function getLocale(): Promise<Locale> {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()])
  return pickLocale(cookieStore.get(LOCALE_COOKIE)?.value, headerStore.get('accept-language'))
}

export async function getT(): Promise<Dict> {
  return DICTS[await getLocale()]
}
