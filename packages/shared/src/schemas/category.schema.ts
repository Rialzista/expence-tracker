import { z } from 'zod';

import { idSchema } from '../common.js';
import { transactionTypeSchema } from '../enums.js';

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Название обязательно').max(50),
  type: transactionTypeSchema,
  icon: z.string().trim().max(50).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Ожидается HEX-цвет вида #RRGGBB')
    .optional(),
});

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1, 'Название обязательно').max(50).optional(),
    type: transactionTypeSchema.optional(),
    icon: z.string().trim().max(50).nullable().optional(),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, 'Ожидается HEX-цвет вида #RRGGBB')
      .nullable()
      .optional(),
  })
  .refine((dto) => Object.keys(dto).length > 0, 'Нужно передать хотя бы одно поле');

export const categoryResponseSchema = z.object({
  id: idSchema,
  name: z.string(),
  type: transactionTypeSchema,
  icon: z.string().nullable(),
  color: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
export type CategoryResponse = z.infer<typeof categoryResponseSchema>;
