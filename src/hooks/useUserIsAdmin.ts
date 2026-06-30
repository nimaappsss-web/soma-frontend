import React from "react";

export const useUserIsAdmin = () => {
  const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const userData = JSON.parse(
      window.localStorage.getItem("userData") || "{}"
    );
    const roleIsAdmin = userData.role !== "team_member";
    setIsAdmin(roleIsAdmin);
  }, []);

  return { isAdmin };
};
