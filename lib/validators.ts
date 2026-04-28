import { z } from 'zod'

export const postCreateSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200, 'Title cannot exceed 200 characters'),
  body: z.string().trim().min(20, 'Body must be at least 20 characters'),
})

export const postUpdateSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200, 'Title cannot exceed 200 characters').optional(),
  body: z.string().trim().min(20, 'Body must be at least 20 characters').optional(),
  image_url: z.string().url().nullable().optional(),
})

export const commentCreateSchema = z.object({
  comment_text: z.string().trim().min(1, 'Comment cannot be empty').max(1000, 'Comment cannot exceed 1000 characters'),
})

export const signupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['author', 'viewer']),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})
