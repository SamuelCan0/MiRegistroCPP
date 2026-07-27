import { AppIcon } from '../ui/AppIcon'

export function Toast({ message }) {
  if (!message) return null

  return (
    <div className="toast" role="status">
      <span aria-hidden="true">
        <AppIcon name="check" />
      </span>
      {message}
    </div>
  )
}
