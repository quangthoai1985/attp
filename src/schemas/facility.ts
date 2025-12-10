import { z } from "zod"

export const facilitySchema = z.object({
    name: z.string().min(1, "Tên cơ sở là bắt buộc"),
    owner_name: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    type: z.string().min(1, "Loại hình là bắt buộc"),
    province_code: z.string().min(1, "Vui lòng chọn cấp quản lý"),
    status: z.enum(["active", "inactive", "suspended"]).default("active"),
})

export type FacilityFormValues = z.infer<typeof facilitySchema>

