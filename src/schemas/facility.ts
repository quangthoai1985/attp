import { z } from "zod"

export const facilitySchema = z.object({
    name: z.string().min(1, "Tên cơ sở là bắt buộc"),
    address: z.string().nullable(),
    type: z.string().min(1, "Loại hình là bắt buộc"),
    province_code: z.string().min(1, "Vui lòng chọn xã/phường/tỉnh"),
    status: z.enum(["active", "inactive", "suspended"]).default("active"),
})

export type FacilityFormValues = z.infer<typeof facilitySchema>
