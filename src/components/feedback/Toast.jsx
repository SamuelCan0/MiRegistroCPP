export function Toast({ message }) {
  if (!message) return null

  return (
    <div className="toast" role="status">
      <span aria-hidden="true">✓</span>
      {message}
    </div>
  )
}
