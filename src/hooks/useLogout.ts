"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { storage } from "../utils/storage";

export const useHandleLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    queryClient.removeQueries();
    storage.clear();
    window.localStorage.removeItem("userData");
    navigate("/login", { replace: true });
  };

  return {
    handleLogout,
  };
};
