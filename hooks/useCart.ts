import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product, ProductOption } from '@/types'

interface CartStore {
  items: CartItem[]
  addItem: (product: Product, option: ProductOption | null) => void
  removeItem: (productId: string, optionId: string | null) => void
  updateQuantity: (productId: string, optionId: string | null, quantity: number) => void
  clearCart: () => void
  total: () => number
  itemCount: () => number
}

function itemKey(productId: string, optionId: string | null) {
  return `${productId}::${optionId ?? 'base'}`
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, option) => {
        const key = itemKey(product.id, option?.id ?? null)
        set((state) => {
          const existing = state.items.find(
            (i) => itemKey(i.product.id, i.option?.id ?? null) === key
          )
          if (existing) {
            return {
              items: state.items.map((i) =>
                itemKey(i.product.id, i.option?.id ?? null) === key
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            }
          }
          return { items: [...state.items, { product, option, quantity: 1 }] }
        })
      },

      removeItem: (productId, optionId) => {
        const key = itemKey(productId, optionId)
        set((state) => ({
          items: state.items.filter(
            (i) => itemKey(i.product.id, i.option?.id ?? null) !== key
          ),
        }))
      },

      updateQuantity: (productId, optionId, quantity) => {
        const key = itemKey(productId, optionId)
        if (quantity <= 0) {
          get().removeItem(productId, optionId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            itemKey(i.product.id, i.option?.id ?? null) === key
              ? { ...i, quantity }
              : i
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      total: () => {
        return get().items.reduce((sum, item) => {
          const base = item.product.price
          const mod = item.option?.price_modifier ?? 0
          return sum + (base + mod) * item.quantity
        }, 0)
      },

      itemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    { name: 'yakisoba-cart' }
  )
)
