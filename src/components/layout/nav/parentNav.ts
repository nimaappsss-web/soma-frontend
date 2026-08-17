import { Home, Teacher, VolumeHigh, Wallet3, Setting } from "iconsax-react";
import type { NavItem } from "../types";

export const parentNavItems: NavItem[] = [
  { label: "Home", to: "/parent", Icon: Home, end: true },
  { label: "Children", to: "/parent/children", Icon: Teacher },
  { label: "School Fees", to: "/parent/fees", Icon: Wallet3 },
  { label: "Announcements", to: "/parent/announcements", Icon: VolumeHigh },
];

export const parentSettingsItem: NavItem = { label: "Settings", to: "/parent/settings", Icon: Setting };