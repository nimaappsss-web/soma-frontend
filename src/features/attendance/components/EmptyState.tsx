import { CloudCross, Refresh } from "iconsax-react";
interface EmptyStateProps {
  loading: boolean;
  error?: string;
  onRetry: () => void;
}
export const EmptyState = ({ loading, error, onRetry }: EmptyStateProps) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray100 p-8 mt-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray100 border-t-gray900 mx-auto" />
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl border border-gray100 p-8 mt-4 text-center">
      <CloudCross size={28} className="mx-auto text-gray300 mb-2" />
      <p className="text-sm font-medium text-gray900">No attendance data available</p>
      <p className="text-xs text-gray500 mt-1 max-w-xs mx-auto">
        {error ?? "Connect to the internet to get current data, then try again."}
      </p>
      <button
        onClick={onRetry}
        className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full border border-gray100 px-6 py-3 md:px-4 md:py-2 text-sm md:text-xs font-medium text-gray700 hover:bg-gray50 active:scale-95 transition-colors"
      >
        <Refresh size={14} variant="Bold" />
        Retry
      </button>
    </div>
  );
};
