import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  description: z.string().max(500, 'Descrição muito longa').optional().or(z.literal('')),
  price: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Preço deve ser maior que zero',
    }),
  category_id: z.string().uuid('Selecione uma categoria'),
  available: z.boolean(),
})

export type ProductFormValues = z.infer<typeof productSchema>

export const productOptionSchema = z.object({
  name: z.string().min(1, 'Nome da opção é obrigatório').max(50, 'Nome muito longo'),
  price_modifier: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), {
      message: 'Valor deve ser um número',
    }),
})

export type ProductOptionFormValues = z.infer<typeof productOptionSchema>

export const categorySchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(50),
})

export type CategoryFormValues = z.infer<typeof categorySchema>
