import { z } from 'zod';

export const createSpecializationSchema = z.object({
  body: z.object({
    name: z.string()
      .min(1, 'Name is required')
      .max(100, 'Name must be less than 100 characters')
      .trim(),
    description: z.string()
      .max(500, 'Description must be less than 500 characters')
      .optional()
      .nullable(),
    department: z.string()
      .max(100, 'Department must be less than 100 characters')
      .trim()
      .optional()
      .nullable()
  })
});

export const updateSpecializationSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a valid number')
  }),
  body: z.object({
    name: z.string()
      .min(1, 'Name is required')
      .max(100, 'Name must be less than 100 characters')
      .trim()
      .optional(),
    description: z.string()
      .max(500, 'Description must be less than 500 characters')
      .optional()
      .nullable(),
    department: z.string()
      .max(100, 'Department must be less than 100 characters')
      .trim()
      .optional()
      .nullable(),
    isActive: z.boolean().optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update'
  })
});

export const getSpecializationByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a valid number')
  })
});

export const deleteSpecializationSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a valid number')
  })
});

export const toggleSpecializationStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a valid number')
  })
});

export const getSpecializationsQuerySchema = z.object({
  query: z.object({
    department: z.string().optional(),
    isActive: z.enum(['true', 'false']).optional()
  })
});

export type CreateSpecializationInput = z.infer<typeof createSpecializationSchema>;
export type UpdateSpecializationInput = z.infer<typeof updateSpecializationSchema>;
export type GetSpecializationByIdInput = z.infer<typeof getSpecializationByIdSchema>;
export type DeleteSpecializationInput = z.infer<typeof deleteSpecializationSchema>;
export type ToggleSpecializationStatusInput = z.infer<typeof toggleSpecializationStatusSchema>;
export type GetSpecializationsQueryInput = z.infer<typeof getSpecializationsQuerySchema>;