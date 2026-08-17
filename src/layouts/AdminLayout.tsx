import { AppShell } from "../components/layout";
import type { NavSection } from "../components/layout/types";
import { useAuth } from "../contexts/AuthContext";
import { adminNavSections } from "../components/layout/nav/adminNav";
import { SchoolSetupWizard } from "../features/principal/components/SchoolSetupWizard";
import { PhoneSetupDialog } from "../features/principal/components/PhoneSetupDialog";

export const AdminLayout = () => {
  const { user } = useAuth();

  const needsSchoolSetup = user?.needsSchoolSetup ?? user?.hasSchool === false;
  if (needsSchoolSetup) {
    return <SchoolSetupWizard />;
  }

  const userRole = user?.role?.toLowerCase() ?? "";
  const filterByRole = (items: NavSection["items"]) =>
    items.filter((item) => !item.roles || item.roles.includes(userRole));
  const nav = adminNavSections.map((section) => ({
    ...section,
    items: filterByRole(section.items),
  }));

  return (
    <>
      {user?.needsPhoneSetup && <PhoneSetupDialog />}
      <AppShell nav={nav} />
    </>
  );
};