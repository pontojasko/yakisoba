// Centralized query keys for TanStack Query
// Ensures consistent cache invalidation across the app

export const queryKeys = {
  products: {
    all: ["products"] as const,
    list: () => ["products", "list"] as const,
    detail: (id: string) => ["products", "detail", id] as const,
  },
  categories: {
    all: ["categories"] as const,
    list: () => ["categories", "list"] as const,
  },
  orders: {
    all: ["orders"] as const,
    active: (statuses: string[]) => ["orders", "active", statuses] as const,
    history: () => ["orders", "history"] as const,
    detail: (id: string) => ["orders", "detail", id] as const,
  },
} as const;
