import { createRouter } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";
import { createQueryClient } from "./lib/queryClient";

export interface RouterContext {
  queryClient: QueryClient;
}

export const getRouter = () => {
  const queryClient = createQueryClient();
  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });
  return router;
};

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}