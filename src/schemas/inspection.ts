import { z } from "zod"

export const inspectionSchema = z.object({
    inspection_date: z.string().min(1, "Vui lòng chọn ngày kiểm tra"),
    year: z.number().min(2000).max(2100).default(new Date().getFullYear()),
    team_type: z.enum(["chuyen_nganh", "lien_nganh"], {
        required_error: "Vui lòng chọn loại đoàn kiểm tra"
    }),
    result: z.enum(["dat", "cho_khac_phuc", "da_khac_phuc", "khong_dat"]).default("dat"),
    remediation_deadline: z.string().nullable().optional(),
    has_penalty: z.boolean().default(false),
    penalty_amount: z.number().nullable().optional(),
    penalty_agency: z.string().nullable().optional(),
    sanction_type: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
}).refine((data) => {
    // If result is "cho_khac_phuc", remediation_deadline is required
    if (data.result === "cho_khac_phuc" && !data.remediation_deadline) {
        return false
    }
    return true
}, {
    message: "Thời hạn khắc phục là bắt buộc khi kết quả là 'Chờ khắc phục'",
    path: ["remediation_deadline"]
}).refine((data) => {
    // If has_penalty is true, penalty_amount should be provided
    if (data.has_penalty && (!data.penalty_amount || data.penalty_amount <= 0)) {
        return false
    }
    return true
}, {
    message: "Số tiền xử phạt phải lớn hơn 0",
    path: ["penalty_amount"]
})

export type InspectionFormValues = z.infer<typeof inspectionSchema>

// Helper labels for display
export const TEAM_TYPE_LABELS: Record<string, string> = {
    chuyen_nganh: "Chuyên ngành",
    lien_nganh: "Liên ngành"
}

export const RESULT_LABELS: Record<string, string> = {
    dat: "Đạt",
    cho_khac_phuc: "Chờ khắc phục",
    da_khac_phuc: "Đã khắc phục",
    khong_dat: "Không đạt"
}

export const RESULT_COLORS: Record<string, string> = {
    dat: "bg-green-600 hover:bg-green-700",
    cho_khac_phuc: "bg-yellow-600 hover:bg-yellow-700",
    da_khac_phuc: "bg-blue-600 hover:bg-blue-700",
    khong_dat: "bg-red-600 hover:bg-red-700"
}
