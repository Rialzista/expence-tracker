import { z } from 'zod';

import { idSchema } from '../common.js';

export const registerSchema = z.object({
  email: z.email('Некорректный адрес электронной почты'),
  password: z.string().min(8, 'Минимум 8 символов').max(128),
  name: z.string().trim().min(1, 'Введите имя').max(100),
});

export const loginSchema = z.object({
  email: z.email('Некорректный адрес электронной почты'),
  password: z.string().min(1, 'Введите пароль'),
});

export const userResponseSchema = z.object({
  id: idSchema,
  email: z.email(),
  name: z.string(),
  createdAt: z.iso.datetime(),
});

export const authResponseSchema = z.object({
  accessToken: z.string(),
  user: userResponseSchema,
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
