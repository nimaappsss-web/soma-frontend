import { useCallback } from "react";

export function useMergeRefs<T>(
  refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
  
  return useCallback(
    (value: T | null) => {
      refs.forEach((ref) => {
        if (!ref) {
          return;
        }

        if (typeof ref === 'object') {
          (ref as React.RefObject<T | null>).current = value;
        } 
        // If the ref is a callback ref
        else if (typeof ref === 'function') {
          (ref as React.RefCallback<T>)(value);
        }
      });
    },
    [refs]
  );
}