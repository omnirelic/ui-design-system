import { Avatar } from "../web/Avatar";
import { LogoMark } from "../web/LogoMark";
import {
  IconBadge, IconBroom, IconBuilding, IconCalendar, IconCart, IconChart, IconChevronDown, IconClock, IconFood, IconKey, IconLaundry, IconMail,
  IconPackage, IconPhone, IconPin, IconPrinter, IconReceipt, IconTruck, IconUser, IconX,
} from "../web/icons";
import { choices } from "./live";
import type { CatalogEntrySourceInterface } from "./types";

const ICONS = {
  IconKey, IconClock, IconTruck, IconReceipt, IconUser, IconMail, IconPin, IconPhone, IconFood, IconPrinter, IconLaundry, IconCart, IconPackage,
  IconBroom, IconChevronDown, IconBuilding, IconCalendar, IconBadge, IconChart, IconX,
};

export const MARQUE_ENTRIES: CatalogEntrySourceInterface[] = [
  {
    name: "LogoMark",
    group: "marque",
    kind: "component",
    states: choices(["static", "Fixe"], ["spin", "Rotation"]),
    render: (_v, state) => <LogoMark size={48} spin={state === "spin"} />,
  },
  {
    name: "Avatar",
    group: "marque",
    kind: "component",
    variants: choices(["cover", "Photo"], ["contain", "Logo"]),
    states: choices(["initials", "Initiales"], ["image", "Image"]),
    render: (variant, state) => (
      <Avatar initials="AM" fit={variant as "cover" | "contain"} imageUrl={state === "image" ? "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='58' height='58'><rect width='58' height='58' fill='%2338bdf8'/></svg>" : null} />
    ),
  },
  ...Object.entries(ICONS).map(([name, Icon]): CatalogEntrySourceInterface => ({
    name,
    group: "marque",
    kind: "component",
    render: () => <Icon size={24} />,
  })),
];
