type ButtonSpinnerProps = {
  label: string
}

export default function ButtonSpinner({ label }: ButtonSpinnerProps) {
  return (
    <span className="button-spinner">
      <svg viewBox="0 0 16 16" aria-hidden="true" className="button-spinner__icon">
        <circle
          cx="8"
          cy="8"
          r="5.25"
          fill="none"
          opacity="0.25"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M8 2.75a5.25 5.25 0 014.52 2.58"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.5"
        />
      </svg>
      <span>{label}</span>
    </span>
  )
}
