import styles from './page.module.css'

export default function LoadingInterviewsPage() {
  return (
    <div
      className={`dash-content container container--app-shell ${styles.page}`}
      aria-hidden="true"
    >
      <section className={styles.contentCard}>
        <div className={styles.loadingBlock} />
        <div className={styles.loadingBlock} />
        <div className={styles.loadingBlock} />
      </section>
    </div>
  )
}
