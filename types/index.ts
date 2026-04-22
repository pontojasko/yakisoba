export type Category = {
  id: string
  name: string
  created_at: string
}

export type ProductOption = {
  id: string
  product_id: string
  name: string
  price_modifier: number
  created_at: string
}

export type Product = {
  id: string
  name: string
  description: string | null
  price: number
  category_id: string
  image_url: string | null
  available: boolean
  created_at: string
  category?: Category
  options?: ProductOption[]
}

export type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled'

export type PaymentMethod =
  | 'pix'
  | 'debit'
  | 'credit'
  | 'cash'

export type DeliveryMethod =
  | 'pickup'
  | 'delivery'

export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  option_id: string | null
  quantity: number
  unit_price: number
  subtotal: number
  product?: Product
  option?: ProductOption
}

export type Order = {
  id: string
  status: OrderStatus
  customer_name: string
  payment_method: PaymentMethod
  delivery_method: DeliveryMethod
  delivery_address: string | null
  freight_cost: number
  notes: string | null
  total: number
  created_at: string
  updated_at: string
  items?: OrderItem[]
}

// Cart types (client-side only)
export type CartItem = {
  product: Product
  option: ProductOption | null
  quantity: number
}
