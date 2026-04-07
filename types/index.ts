export type Category = {
  id: string
  name: string
  created_at: string
}

export type DeliveryArea = {
  id: string
  name: string
  fee_amount: number
  active: boolean
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
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'

export type OrderType = 'local' | 'pickup' | 'delivery'

export type PaymentMethod =
  | 'pix'
  | 'debit'
  | 'credit'
  | 'cash'

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
  order_type: OrderType
  customer_name: string
  payment_method: PaymentMethod
  delivery_area_id: string | null
  delivery_fee: number
  notes: string | null
  total: number
  created_at: string
  updated_at: string
  items?: OrderItem[]
  delivery_area?: DeliveryArea
}

// Cart types (client-side only)
export type CartItem = {
  product: Product
  option: ProductOption | null
  quantity: number
}
