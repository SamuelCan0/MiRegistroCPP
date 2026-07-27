import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRight,
  faCalendarCheck,
  faCalendarDays,
  faCheck,
  faChevronLeft,
  faChevronRight,
  faCircleInfo,
  faClipboardList,
  faClock,
  faEnvelope,
  faLock,
  faRightFromBracket,
  faFloppyDisk,
  faHouse,
  faMoon,
  faPen,
  faPlus,
  faRotateRight,
  faSpinner,
  faSun,
  faTrashCan,
  faTriangleExclamation,
  faUser,
  faUsers,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'

const icons = {
  arrowRight: faArrowRight,
  calendar: faCalendarDays,
  calendarCheck: faCalendarCheck,
  check: faCheck,
  chevronLeft: faChevronLeft,
  chevronRight: faChevronRight,
  clock: faClock,
  delete: faTrashCan,
  edit: faPen,
  email: faEnvelope,
  help: faCircleInfo,
  home: faHouse,
  info: faCircleInfo,
  lock: faLock,
  moon: faMoon,
  plus: faPlus,
  requests: faClipboardList,
  signOut: faRightFromBracket,
  retry: faRotateRight,
  save: faFloppyDisk,
  spinner: faSpinner,
  sun: faSun,
  warning: faTriangleExclamation,
  user: faUser,
  users: faUsers,
  xmark: faXmark,
}

export function AppIcon({ className = '', name, ...props }) {
  return (
    <FontAwesomeIcon
      aria-hidden="true"
      className={`app-icon ${className}`.trim()}
      fixedWidth
      icon={icons[name]}
      {...props}
    />
  )
}
