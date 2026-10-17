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
import { type SVGProps, createElement } from 'react'

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
  Printer as PrinterIcon,
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
  CircleHalf as PartlyIcon,
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
  Keyboard as KeyboardIcon,
  // Brands
  LinkedinLogo as LinkedInIcon,
  FacebookLogo as FacebookIcon,
  GithubLogo as GitHubIcon,
  Globe as WebsiteIcon,
  ChatCircleText as AskedIcon,
  PaperPlaneRight as SendIcon,
  Quotes as QuoteIcon,
} from '@phosphor-icons/react/ssr'

/**
 * Brand marks that Phosphor lacks or draws as outlines. Paths from simple-icons
 * (CC0). They keep their brand colour — the only non-token colours in the app.
 */
type BrandIconProps = Omit<SVGProps<SVGSVGElement>, 'children'>

function brandIcon(name: string, path: string, colour: string) {
  function BrandIcon(props: BrandIconProps) {
    return createElement(
      'svg',
      { viewBox: '0 0 24 24', 'aria-hidden': true, focusable: false, fill: colour, ...props },
      createElement('path', { d: path }),
    )
  }
  BrandIcon.displayName = name
  return BrandIcon
}

/** The official four-colour Google "G" (see Google Sign-In branding guidelines). */
export function GoogleIcon(props: BrandIconProps) {
  return createElement(
    'svg',
    { viewBox: '0 0 48 48', 'aria-hidden': true, focusable: false, ...props },
    createElement('path', {
      fill: '#EA4335',
      d: 'M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z',
    }),
    createElement('path', {
      fill: '#4285F4',
      d: 'M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z',
    }),
    createElement('path', {
      fill: '#FBBC05',
      d: 'M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z',
    }),
    createElement('path', {
      fill: '#34A853',
      d: 'M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z',
    }),
  )
}

export const ViberIcon = brandIcon(
  'ViberIcon',
  'M11.4 0C9.473.028 5.333.344 3.02 2.467 1.302 4.187.696 6.7.633 9.817.57 12.933.488 18.776 6.12 20.36h.003l-.004 2.416s-.037.977.61 1.177c.777.242 1.234-.5 1.98-1.302.407-.44.972-1.084 1.397-1.58 3.85.326 6.812-.416 7.15-.525.776-.252 5.176-.816 5.892-6.657.74-6.02-.36-9.83-2.34-11.546-.596-.55-3.006-2.3-8.375-2.323 0 0-.395-.025-1.037-.017zm.058 1.693c.545-.004.88.017.88.017 4.542.02 6.717 1.388 7.222 1.846 1.675 1.435 2.53 4.868 1.906 9.897v.002c-.604 4.878-4.174 5.184-4.832 5.395-.28.09-2.882.737-6.153.524 0 0-2.436 2.94-3.197 3.704-.12.12-.26.167-.352.144-.13-.033-.166-.188-.165-.414l.02-4.018c-4.762-1.32-4.485-6.292-4.43-8.895.054-2.604.543-4.738 1.996-6.173 1.96-1.773 5.474-2.018 7.11-2.03zm.38 2.602c-.167 0-.303.135-.304.302 0 .167.133.303.3.305 1.624.01 2.946.537 4.028 1.592 1.073 1.046 1.62 2.468 1.633 4.334.002.167.14.3.307.3.166-.002.3-.138.3-.304-.014-1.984-.618-3.596-1.816-4.764-1.19-1.16-2.692-1.753-4.447-1.765zm-3.96.695c-.19-.032-.4.005-.616.117l-.01.002c-.43.247-.816.562-1.146.932-.002.004-.006.004-.008.008-.267.323-.42.638-.46.948-.008.046-.01.093-.007.14 0 .136.022.27.065.4l.013.01c.135.48.473 1.276 1.205 2.604.42.768.903 1.5 1.446 2.186.27.344.56.673.87.984l.132.132c.31.308.64.6.984.87.686.543 1.418 1.027 2.186 1.447 1.328.733 2.126 1.07 2.604 1.206l.01.014c.13.042.265.064.402.063.046.002.092 0 .138-.008.31-.036.627-.19.948-.46.004 0 .003-.002.008-.005.37-.33.683-.72.93-1.148l.003-.01c.225-.432.15-.842-.18-1.12-.004 0-.698-.58-1.037-.83-.36-.255-.73-.492-1.113-.71-.51-.285-1.032-.106-1.248.174l-.447.564c-.23.283-.657.246-.657.246-3.12-.796-3.955-3.955-3.955-3.955s-.037-.426.248-.656l.563-.448c.277-.215.456-.737.17-1.248-.217-.383-.454-.756-.71-1.115-.25-.34-.826-1.033-.83-1.035-.137-.165-.31-.265-.502-.297zm4.49.88c-.158.002-.29.124-.3.282-.01.167.115.312.282.324 1.16.085 2.017.466 2.645 1.15.63.688.93 1.524.906 2.57-.002.168.13.306.3.31.166.003.305-.13.31-.297.025-1.175-.334-2.193-1.067-2.994-.74-.81-1.777-1.253-3.05-1.346h-.024zm.463 1.63c-.16.002-.29.127-.3.287-.008.167.12.31.288.32.523.028.875.175 1.113.422.24.245.388.62.416 1.164.01.167.15.295.318.287.167-.008.295-.15.287-.317-.03-.644-.215-1.178-.58-1.557-.367-.378-.893-.574-1.52-.607h-.018z',
  '#7360F2',
)

export const WhatsAppIcon = brandIcon(
  'WhatsAppIcon',
  'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z',
  '#25D366',
)
