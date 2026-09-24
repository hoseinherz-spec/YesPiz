import type { IconComponent } from "@repo/icons";
import {
  ArrowDown as StaticArrowDown,
  ArrowRight as StaticArrowRight,
  ArrowUp as StaticArrowUp,
  Banknote as StaticBanknote,
  Bell1 as StaticBell1,
  Bookmark as StaticBookmark,
  Check as StaticCheck,
  ChevronLeft as StaticChevronLeft,
  ChevronRight as StaticChevronRight,
  Clock as StaticClock,
  CreditCard as StaticCreditCard,
  EnvelopeOpen1 as StaticEnvelopeOpen1,
  Eye as StaticEye,
  EyeSlash as StaticEyeSlash,
  FileText as StaticFileText,
  Gift as StaticGift,
  GridFour as StaticGridFour,
  Heart as StaticHeart,
  Home as StaticHome,
  Info as StaticInfo,
  ListThreeBullet as StaticListThreeBullet,
  Lock1 as StaticLock1,
  MapPin as StaticMapPin,
  MenuGrid as StaticMenuGrid,
  MessageCircle as StaticMessageCircle,
  Moon as StaticMoon,
  Phone as StaticPhone,
  Pizza as StaticPizza,
  Plus as StaticPlus,
  Search as StaticSearch,
  Shield as StaticShield,
  ShoppingBag as StaticShoppingBag,
  Star as StaticStar,
  Sun as StaticSun,
  Trash1 as StaticTrash1,
  Trash2 as StaticTrash2,
  Truck as StaticTruck,
  User as StaticUser,
  UserPlus as StaticUserPlus,
  Wallet as StaticWallet,
  X as StaticX,
} from "@repo/icons";

// Compatibility aliases for existing imports. These are the static components
// from @repo/icons; no wrapper markup or icon animation is applied.
function animated(StaticIcon: IconComponent, _motion = "pop"): IconComponent {
  void _motion;
  return StaticIcon;
}

export const ArrowDown = animated(StaticArrowDown, "pop");
export const ArrowRight = animated(StaticArrowRight, "nudge");
export const ArrowUp = animated(StaticArrowUp, "pop");
export const Banknote = animated(StaticBanknote, "pop");
export const Bell1 = animated(StaticBell1, "ring");
export const Bookmark = animated(StaticBookmark, "pulse");
export const Check = animated(StaticCheck, "pulse");
export const ChevronLeft = animated(StaticChevronLeft, "nudge-left");
export const ChevronRight = animated(StaticChevronRight, "nudge");
export const Clock = animated(StaticClock, "pop");
export const CreditCard = animated(StaticCreditCard, "pop");
export const EnvelopeOpen1 = animated(StaticEnvelopeOpen1, "pop");
export const Eye = animated(StaticEye, "pop");
export const EyeSlash = animated(StaticEyeSlash, "pop");
export const FileText = animated(StaticFileText, "pop");
export const Gift = animated(StaticGift, "pulse");
export const GridFour = animated(StaticGridFour, "pop");
export const Heart = animated(StaticHeart, "pulse");
export const Home = animated(StaticHome, "pop");
export const Info = animated(StaticInfo, "pop");
export const ListThreeBullet = animated(StaticListThreeBullet, "pop");
export const Lock1 = animated(StaticLock1, "pop");
export const MapPin = animated(StaticMapPin, "pop");
export const MenuGrid = animated(StaticMenuGrid, "pop");
export const MessageCircle = animated(StaticMessageCircle, "pop");
export const Moon = animated(StaticMoon, "pop");
export const Phone = animated(StaticPhone, "pop");
export const Pizza = animated(StaticPizza, "pop");
export const Plus = animated(StaticPlus, "pop");
export const Search = animated(StaticSearch, "pop");
export const Shield = animated(StaticShield, "pop");
export const ShoppingBag = animated(StaticShoppingBag, "pop");
export const Star = animated(StaticStar, "pulse");
export const Sun = animated(StaticSun, "pop");
export const Trash1 = animated(StaticTrash1, "pop");
export const Trash2 = animated(StaticTrash2, "pop");
export const Truck = animated(StaticTruck, "nudge");
export const User = animated(StaticUser, "pop");
export const UserPlus = animated(StaticUserPlus, "pop");
export const Wallet = animated(StaticWallet, "pop");
export const X = animated(StaticX, "pop");
