/**
 * The ONLY module that imports an icon library (ESLint enforces this).
 *
 * Phosphor, SSR-safe build (works in server and client components).
 * - Default weight "regular"; active nav items pass weight="fill".
 * - Size comes from CSS: 16px inside buttons/inputs/pills (the primitives size
 *   child SVGs), 20px in nav/top bar, 24px in empty states. Colour = currentColor.
 * - Use an icon only where it carries meaning: nav, buttons with a clear verb,
 *   status, empty states. No decorative icons next to headings.
 */
export type { Icon as IconComponent, IconProps, IconWeight } from '@phosphor-icons/react'

export {
  // Navigation
  Sun as TodayIcon,
  Briefcase as JobsIcon,
  Users as CandidatesIcon,
  CalendarBlank as InterviewsIcon,
  UsersThree as TeamIcon,
  Gear as SettingsIcon,
  ChartBar as InsightsIcon,
  SidebarSimple as SidebarIcon,
  List as MenuIcon,
  // Actions
  ShareNetwork as ShareIcon,
  Link as LinkIcon,
  Copy as CopyIcon,
  QrCode as QrIcon,
  DownloadSimple as DownloadIcon,
  UploadSimple as UploadIcon,
  Plus as PlusIcon,
  Minus as MinusIcon,
  PencilSimple as EditIcon,
  Trash as TrashIcon,
  MagnifyingGlass as SearchIcon,
  Funnel as FilterIcon,
  ArrowsDownUp as SortIcon,
  ArrowUp as ArrowUpIcon,
  ArrowDown as ArrowDownIcon,
  ArrowRight as ArrowRightIcon,
  ArrowLeft as ArrowLeftIcon,
  ArrowSquareOut as ExternalLinkIcon,
  DotsThree as MoreIcon,
  SignOut as SignOutIcon,
  VideoCamera as VideoIcon,
  // Chevrons
  CaretDown as ChevronDownIcon,
  CaretUp as ChevronUpIcon,
  CaretLeft as ChevronLeftIcon,
  CaretRight as ChevronRightIcon,
  CaretUpDown as ChevronUpDownIcon,
  // Status & feedback
  Check as CheckIcon,
  X as XIcon,
  X as CloseIcon,
  WarningCircle as AlertIcon,
  Briefcase as JobIcon,
  Money as SalaryIcon,
  CursorClick as ClickIcon,
  EnvelopeSimpleOpen as MailCheckIcon,
  UserMinus as NoAccountIcon,
  UserCheck as PersonDecidesIcon,
  FileMagnifyingGlass as ReadCvIcon,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Circle as CircleIcon,
  CircleNotch as SpinnerIcon,
  Sparkle as SparkleIcon,
  Bell as BellIcon,
  // Objects
  FileText as FileIcon,
  FilePdf as FilePdfIcon,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  ShieldCheck as ShieldCheckIcon,
  MapPin as LocationIcon,
  EnvelopeSimple as MailIcon,
  Phone as PhoneIcon,
  Eye as EyeIcon,
  EyeSlash as EyeOffIcon,
  User as UserIcon,
  Buildings as CompanyIcon,
  ClipboardText as AuditIcon,
  House as HomeIcon,
  // Businesses and platform admin
  SealCheck as VerifiedIcon,
  Flag as FlagIcon,
  Bank as PaymentsIcon,
  Hourglass as WaitingIcon,
  Storefront as BusinessIcon,
  ShieldStar as StaffIcon,
  ArrowsLeftRight as SwitchIcon,
  // Brands
  LinkedinLogo as LinkedInIcon,
  FacebookLogo as FacebookIcon,
  GoogleLogo as GoogleIcon,
} from '@phosphor-icons/react/ssr'
