import { z } from 'zod'

/** Mirrors api-contract.md request constraints so users never hit a server 400. */
export const tripFormSchema = z.object({
  current_location: z
    .string()
    .trim()
    .min(1, 'Required')
    .max(255, 'Too long (255 max)'),
  pickup_location: z.string().trim().min(1, 'Required').max(255, 'Too long (255 max)'),
  dropoff_location: z.string().trim().min(1, 'Required').max(255, 'Too long (255 max)'),
  current_cycle_used_hours: z
    .number({ invalid_type_error: 'Enter a number' })
    .min(0, 'Cannot be negative')
    .max(70, 'Cannot exceed 70'),
})

export type TripFormValues = z.infer<typeof tripFormSchema>

export const DEFAULT_VALUES: TripFormValues = {
  current_location: '',
  pickup_location: '',
  dropoff_location: '',
  current_cycle_used_hours: 0,
}

export const EXAMPLE_VALUES: TripFormValues = {
  current_location: 'San Francisco, CA',
  pickup_location: 'Sacramento, CA',
  dropoff_location: 'Reno, NV',
  current_cycle_used_hours: 0,
}
