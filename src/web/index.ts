export * from "./theme";
export * from "./hooks";
export { LogoMark } from "./LogoMark";
export type { LogoMarkProps } from "./LogoMark";
export { QrCard } from "./QrCard";
export type { QrCardProps } from "./QrCard";
export { InfoRow } from "./InfoRow";
export type { InfoRowProps } from "./InfoRow";
export { Reactive } from "./Reactive";
export type { ReactiveVariant } from "./Reactive";
export { Text } from "./Text";
export type { TextVariant, TextProps } from "./Text";
export {
  IconKey,
  IconClock,
  IconTruck,
  IconReceipt,
  IconUser,
  IconMail,
  IconPin,
  IconPhone,
  IconFood,
  IconPrinter,
  IconLaundry,
  IconCart,
  IconPackage,
  IconBroom,
  IconChevronDown,
  IconBuilding,
  IconCalendar,
  IconBadge,
  IconChart,
  IconX,
} from "./icons";
export { PublicHeader } from "./PublicHeader";
export type { PublicHeaderProps } from "./PublicHeader";
export { PublicShell } from "./PublicShell";
export type { PublicShellProps } from "./PublicShell";
export { Button } from "./Button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./Button";
export { Field, TextInput, SelectInput, TextField } from "./Field";
export type { FieldProps, TextFieldProps } from "./Field";
export { Checkbox } from "./Checkbox";
export type { CheckboxProps } from "./Checkbox";
export { Panel } from "./Panel";
export type { PanelProps } from "./Panel";
export { Modal } from "./Modal";
export type { ModalProps } from "./Modal";
export { Tabs } from "./Tabs";
export type { TabItem, TabsProps } from "./Tabs";
export { ToastProvider, useToast } from "./Toast";
export { SearchableSelect } from "./SearchableSelect";
export type { SearchableSelectOption, SearchableSelectProps } from "./SearchableSelect";
export { Badge } from "./Badge";
export type { BadgeVariant, BadgeProps } from "./Badge";
export { Tooltip } from "./Tooltip";
export type { TooltipProps } from "./Tooltip";
export { Avatar } from "./Avatar";
export type { AvatarProps } from "./Avatar";
export { Pastille } from "./Pastille";
export type { PastilleProps, PastilleSize } from "./Pastille";
export { PASTILLE_TONES, STATUS_TONE, formatCount, statusTone, toneColor } from "./pastille-model";
export type { PastilleTone } from "./pastille-model";
// PhoneInput et utilitaires E.164 : sous-export `@omnirelic/ui-design-system/phone` (libphonenumber-js, dépendance du consommateur).

// Briques de base de Chez la Petite (lot 2 du désossage) : mêmes props, états et comportements que web/src/ui et web/src/admin/ui de CLP.
export { Icon } from "./Icon";
export type { IconName, IconProps } from "./Icon";
export { ICONS } from "./icon-registry";
export { Spinner } from "./Spinner";
export type { SpinnerProps } from "./Spinner";
export { Alert } from "./Alert";
export type { AlertProps, AlertType } from "./Alert";
export { Sk, SkRows, SkTable, SkGrid, SkBar } from "./Skeleton";
export { Pagination } from "./Pagination";
export type { PaginationProps } from "./Pagination";
export { Drawer } from "./Drawer";
export type { DrawerProps } from "./Drawer";
export { ConfirmDialog } from "./ConfirmDialog";
export type { ConfirmDialogProps } from "./ConfirmDialog";
export { CopyButton, CopyTextButton } from "./CopyButton";
export type { CopyButtonProps } from "./CopyButton";
export { useCopied, writeClipboard } from "./useCopied";
