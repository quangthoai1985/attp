import { Badge } from "@/components/ui/badge"
import { Database } from "@/lib/supabase"
import { format } from "date-fns" // Optional but recommend using native date if date-fns not installed
// Using native date formatting to avoid extra dependency for now unless user asked

type Inspection = Database["public"]["Tables"]["inspections"]["Row"]

interface InspectionListProps {
    inspections: Inspection[]
}

export function InspectionList({ inspections }: InspectionListProps) {
    if (!inspections.length) {
        return <div className="text-center py-8 text-muted-foreground">Chưa có lịch sử kiểm tra.</div>
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "passed":
                return <Badge className="bg-green-600 hover:bg-green-700">Đạt</Badge>
            case "failed":
                return <Badge variant="destructive">Không đạt / Xử phạt</Badge>
            case "pending":
            default:
                return <Badge variant="secondary">Chờ xử lý</Badge>
        }
    }

    return (
        <div className="space-y-4">
            {inspections.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg bg-card shadow-sm gap-4">
                    <div className="space-y-1">
                        <div className="font-semibold flex items-center gap-2">
                            Năm {item.year} - {item.batch || "Đợt thường xuyên"}
                            {getStatusBadge(item.result)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Ngày kiểm tra: {item.inspection_date ? new Date(item.inspection_date).toLocaleDateString("vi-VN") : "Chưa cập nhật"}
                        </div>
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
