import { z } from "zod"

export const inspectionSchema = z.object({
    inspection_date: z.string().nullable(), // Changed to string for input type="date"
    year: z.number().min(2000).max(2100).default(new Date().getFullYear()),
    batch: z.string().nullable(),
    result: z.enum(["passed", "failed", "pending"]).default("pending"),
    notes: z.string().nullable(),
})

export type InspectionFormValues = z.infer<typeof inspectionSchema>
