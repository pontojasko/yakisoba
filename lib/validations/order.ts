import { z } from 'zod'

export const PAYMENT_METHODS = ['pix', 'debit', 'credit', 'cash'] as const
export const DELIVERY_METHODS = ['pickup', 'delivery'] as const

export const paymentMethodLabels: Record<string, string> = {
  pix: 'Pix',
  debit: 'Débito',
  credit: 'Crédito',
  cash: 'Dinheiro',
}

export const deliveryMethodLabels: Record<string, string> = {
  pickup: 'Retirada no local',
  delivery: 'Envio/Entrega',
}

export const orderSchema = z
  .object({
    customer_name: z
      .string()
      .min(2, 'Nome deve ter pelo menos 2 caracteres')
      .max(100, 'Nome muito longo'),
    payment_method: z.enum(PAYMENT_METHODS, {
      error: 'Selecione uma forma de pagamento',
    }),
    delivery_method: z.enum(DELIVERY_METHODS, {
      error: 'Selecione um método de entrega',
    }),
    delivery_address: z.string().max(300, 'Endereço muito longo').optional().or(z.literal('')),
    notes: z.string().max(500, 'Observações muito longas').optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.delivery_method === 'delivery' && (!data.delivery_address || data.delivery_address.trim().length < 10)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe um endereço completo para entrega',
        path: ['delivery_address'],
      })
    }
  })

export type OrderFormValues = z.infer<typeof orderSchema>
