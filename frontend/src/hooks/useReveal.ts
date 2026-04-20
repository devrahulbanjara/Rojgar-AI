import { useEffect } from 'react'

/**
 * Observes every [data-reveal] element on the page and adds `.is-revealed`
 * once it scrolls into view. Each element fires exactly once then stops
 * being observed. Automatically respects prefers-reduced-motion.
 */
export function useReveal() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -48px 0px' },
    )

    document
      .querySelectorAll<HTMLElement>('[data-reveal]:not(.is-revealed)')
      .forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])
}
