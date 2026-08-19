import { isIOS } from "../utils/pwaInstall";

export const InstallGuideSteps = ({ showTip = true }: { showTip?: boolean }) => (
  <>
    <ol className="mt-3 space-y-2 text-sm text-gray600">
      <li className="flex items-start gap-2">
        <span className="shrink-0 font-semibold text-gray900">1.</span>
        {isIOS() ? (
          <>
            Tap the{" "}
            <span className="inline-flex items-center gap-1 rounded-md bg-gray100 px-1.5 py-0.5 text-xs text-gray900">Share</span>{" "}
            button in Safari.
          </>
        ) : (
          <>
            Tap the{" "}
            <span className="rounded-md bg-gray100 px-1.5 py-0.5 text-xs text-gray900">⋮</span>{" "}
            menu in Chrome and select{" "}
            <span className="rounded-md bg-gray100 px-1.5 py-0.5 text-xs text-gray900">Add to Home screen</span>.
          </>
        )}
      </li>
      {isIOS() ? (
        <>
          <li className="flex items-start gap-2">
            <span className="shrink-0 font-semibold text-gray900">2.</span>
            Scroll down and tap{" "}
            <span className="rounded-md bg-gray100 px-1.5 py-0.5 text-xs text-gray900">
              Add to Home Screen
            </span>
            .
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 font-semibold text-gray900">3.</span>
            Tap <span className="rounded-md bg-gray100 px-1.5 py-0.5 text-xs text-gray900">Add</span> in the
            top-right corner.
          </li>
        </>
      ) : (
        <li className="flex items-start gap-2">
          <span className="shrink-0 font-semibold text-gray900">2.</span>
          Tap{" "}
          <span className="rounded-md bg-gray100 px-1.5 py-0.5 text-xs text-gray900">Install</span>{" "}
          or{" "}
          <span className="rounded-md bg-gray100 px-1.5 py-0.5 text-xs text-gray900">Add</span>{" "}
          to confirm.
        </li>
      )}
    </ol>
    {showTip && !isIOS() && (
      <p className="mt-4 rounded-lg bg-gray100 px-3 py-2 text-xs text-gray600">
        Tip: Chrome only offers the one-tap{" "}
        <span className="rounded-md bg-white px-1 py-0.5 text-gray900">Install</span> after you've used
        Soma a few times. Until then, the menu steps above work just fine.
      </p>
    )}
  </>
);