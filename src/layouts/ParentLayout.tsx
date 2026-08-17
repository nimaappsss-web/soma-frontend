import { AppShell } from "../components/layout";
import { parentNavItems, parentSettingsItem } from "../components/layout/nav/parentNav";

export const ParentLayout = () => (
  <AppShell nav={[{ items: parentNavItems }]} settings={parentSettingsItem} />
);