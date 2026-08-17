import type { IconProps } from "iconsax-react";

export type IconComponent = React.FC<IconProps>;

export interface NavChild {
  label: string;
  to: string;
  end?: boolean;
}

export interface NavItem {
  label: string;
  to: string;
  Icon: IconComponent;
  end?: boolean;
  hasCaret?: boolean;
  children?: NavChild[];
  roles?: string[];
}

export interface NavSection {
  items: NavItem[];
  divider?: boolean;
}