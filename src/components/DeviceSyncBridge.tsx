import { DeviceActivityBanner } from "./DeviceActivityBanner";
import { useReopenFreshnessCheck } from "../hooks/useReopenFreshnessCheck";

// Mounts the "active on another device" banner and the reopen freshness check
// (invalidates queries when server data changed while the PWA was closed).
export const DeviceSyncBridge = () => {
  useReopenFreshnessCheck();
  return <DeviceActivityBanner />;
};