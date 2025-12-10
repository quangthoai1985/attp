import { Badge } from "@/components/ui/badge"
import { Database } from "@/lib/supabase"
import { RESULT_LABELS, RESULT_COLORS, TEAM_TYPE_LABELS } from "@/schemas/inspection"

type Inspection = Database["public"]["Tables"]["inspections"]["Row"]

interface InspectionListProps {
    inspections: Inspection[]
}

export function InspectionList({ inspections }: InspectionListProps) {
    if (!inspections.length) {
        return <div className="text-center py-8 text-muted-foreground">Chưa có lịch sử kiểm tra.</div>
    }

    return (
        <div className="space-y-4">
            {inspections.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg bg-card shadow-sm gap-4">
                    <div className="space-y-1">
                        <div className="font-semibold flex items-center gap-2">
                            Năm {item.year} - Đoàn {TEAM_TYPE_LABELS[item.team_type] || item.team_type}
                            <Badge className={RESULT_COLORS[item.result] || ''}>
                                {RESULT_LABELS[item.result] || item.result}
                            </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Ngày kiểm tra: {item.inspection_date ? new Date(item.inspection_date).toLocaleDateString("vi-VN") : "Chưa cập nhật"}
                        </div>
                        {item.remediation_deadline && (
                            <div className="text-sm text-muted-foreground">
                                Hạn khắc phục: {new Date(item.remediation_deadline).toLocaleDateString("vi-VN")}
                            </div>
                        )}
                        {item.has_penalty && item.penalty_amount && (
                            <div className="text-sm text-destructive font-medium">
                                Xử phạt: {item.penalty_amount.toLocaleString('vi-VN')} VNĐ
                            </div>
                        )}
                        {item.notes && (
                            <div className="text-sm mt-2 italic text-gray-600">
                                "{item.notes}"
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
