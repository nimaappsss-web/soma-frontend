import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import * as React from "react";
import type { DefaultOptions } from "@tanstack/react-query";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

interface ReactQueryProviderProps {
  children: React.ReactNode;
}

const ReactQueryProvider: React.FunctionComponent<ReactQueryProviderProps> = ({
  children,
}) => {
  const twelveHoursInMs = 1000 * 60 * 60 * 12;
  const sixtySeconds = 60 * 1000;
  const defaultOptions: DefaultOptions = {
    queries: {
      refetchOnWindowFocus: true,
      retry: 0,
      staleTime: twelveHoursInMs,
      gcTime: twelveHoursInMs,
      refetchInterval: sixtySeconds,
    },
  };

  const queryCache = new QueryCache({
    onError: (error) => {
      error.message = "An error occurred. Please try again later.";
    },
  });

  const [queryClient] = React.useState(
    () => new QueryClient({ defaultOptions, queryCache }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
};

export default ReactQueryProvider;
