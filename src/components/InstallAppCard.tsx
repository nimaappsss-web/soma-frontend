import { useState } from "react";
import { DocumentDownload } from "iconsax-react";

import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { InstallGuideSteps } from "./InstallGuideSteps";
import { usePwaInstall } from "../utils/pwaInstall";

export const InstallAppCard = () => {
  const { installed, install } = usePwaInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (installed) {
    return (
      <Card className="rounded-3xl border-gray100 shadow-none">
        <CardHeader className="p-5 pb-0">
          <CardTitle className="text-base font-semibold text-gray900">Soma App</CardTitle>
          <CardDescription className="text-xs text-gray500 mt-1">
            Your installed app experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray900">
              <DocumentDownload size={20} color="#FFFFFF" variant="Bold" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray900">Soma is installed</p>
              <p className="text-xs text-gray500">The app icon is on your home screen.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleInstall = async () => {
    const { available, accepted } = await install();
    if (!available && !accepted) setShowGuide(true);
  };

  return (
    <Card className="rounded-3xl border-gray100 shadow-none">
      <CardHeader className="p-5 pb-0">
        <CardTitle className="text-base font-semibold text-gray900">Install Soma</CardTitle>
        <CardDescription className="text-xs text-gray500 mt-1">
          Get the app on your device for a faster, offline-first experience.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray900">
            <DocumentDownload size={20} color="#FFFFFF" variant="Bold" />
          </div>
          <Button onClick={handleInstall} className="rounded-full">
            Install now
          </Button>
        </div>
        {showGuide && <InstallGuideSteps />}
      </CardContent>
    </Card>
  );
};