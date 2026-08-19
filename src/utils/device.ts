const DEVICE_ID_KEY = "soma:device:id";

export const getDeviceId = (): string => {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return "web-1";
  }
};

export const getDeviceName = (): string => {
  if (typeof navigator === "undefined") return "Web";
  const ua = navigator.userAgent;
  const isPhone = /iPhone|iPad|iPod|Android/i.test(ua);
  const isTablet = /iPad|Android/i.test(ua) && /Mobile/i.test(ua) === false;
  const isMac = /Macintosh|Mac OS X/i.test(ua) && !/iPhone|iPad/i.test(ua);
  const isWindows = /Windows/i.test(ua);
  const isLinux = /Linux/i.test(ua);

  if (isPhone) {
    return /iPhone/i.test(ua) ? "iPhone" : /iPad/i.test(ua) ? "iPad" : "Android phone";
  }
  if (isTablet) return "Tablet";
  if (isMac) return "Mac";
  if (isWindows) return "Windows PC";
  if (isLinux) return "Linux computer";
  return "Web";
};