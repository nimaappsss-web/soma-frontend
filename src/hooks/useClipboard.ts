"use client";
import toast from "react-hot-toast";
import { useState } from "react";

export const useClipboard = ({ timeout = 2000 } = {}) => {
  const [error, setError] = useState<Error | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyTimeout, setCopyTimeout] = useState<
    ReturnType<typeof setTimeout> | undefined | number
  >(undefined);

  const handleCopyResult = (value: boolean) => {
    clearTimeout(copyTimeout as number);
    setCopyTimeout(setTimeout(() => setCopied(false), timeout));
    setCopied(value);
  };

  const copy = (valueToCopy: string) => {
    if ("clipboard" in navigator) {
      navigator.clipboard
        .writeText(valueToCopy)
        .then(() => {
          handleCopyResult(true);
          toast.success("Link copied to clipboard");
        })
        .catch((err) => setError(err));
    } else {
      setError(new Error("useClipboard: navigator.clipboard is not supported"));
    }
  };

  const reset = () => {
    setCopied(false);
    setError(null);
    clearTimeout(copyTimeout as number);
  };

  return { copy, reset, error, copied };
};
