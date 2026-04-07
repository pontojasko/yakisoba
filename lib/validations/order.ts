import { z } from 'zod'

export const PAYMENT_METHODS = ['pix', 'debit', 'credit', 'cash'] as const

export const paymentMethodLabels: Record<string, string> = {
  pix: 'Pix',
  debit: 'Débito',
  credit: 'Crédito',
  cash: 'Dinheiro',
}

export const orderSchema = z.object({
  customer_name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  payment_method: z.enum(PAYMENT_METHODS, {
    error: 'Selecione uma forma de pagamento',
  }),
  notes: z.string().max(500, 'Observações muito longas').optional().or(z.literal('')),
})

export type OrderFormValues = z.infer<typeof orderSchema>
