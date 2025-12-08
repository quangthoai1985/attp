import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Building2, CheckCircle2, AlertTriangle, FileWarning, Calendar } from "lucide-react"
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid
} from "recharts"

// Stats Cards Component
interface StatsSummary {
    totalFacilities: number
    activeGCNCount: number
    notCertifiedOrExpiredCount: number
    inspectionsThisYear: number
}

export function StatsCards({ data }: { data: StatsSummary }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tổng số cơ sở</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.totalFacilities}</div>
                    <p className="text-xs text-muted-foreground">Toàn bộ địa bàn quản lý</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Đang hoạt động (GCN)</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.activeGCNCount}</div>
                    <p className="text-xs text-muted-foreground">Giấy chứng nhận còn hạn</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Chưa cấp / Hết hạn</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.notCertifiedOrExpiredCount}</div>
                    <p className="text-xs text-muted-foreground">Cần rà soát ngay</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Thanh tra năm nay</CardTitle>
                    <Calendar className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.inspectionsThisYear}</div>
                    <p className="text-xs text-muted-foreground">Lượt kiểm tra</p>
                </CardContent>
            </Card>
        </div>
    )
}

// Charts Component
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function AnalyticsCharts({ pieData, barData }: { pieData: any[], barData: any[] }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Kết quả kiểm tra qua các năm</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="year" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="passed" name="Đạt" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="failed" name="Vi phạm" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
            <Card className="col-span-3">
                <CardHeader>
                    <CardTitle>Cơ cấu loại hình cơ sở</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// Expiring Widget Component
export function ExpiringWidget({ facilities }: { facilities: any[] }) {
    if (facilities.length === 0) return null

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileWarning className="h-5 w-5 text-yellow-500" />
                    Cảnh báo sắp hết hạn GCN (30 ngày)
                </CardTitle>
                <CardDescription>Các cơ sở sau cần được thông báo gia hạn.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {facilities.map((item) => (
                        <div key={item.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                            <div>
                                <p className="font-medium text-sm">{item.name}</p>
                                <p className="text-xs text-muted-foreground">{item.address}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-destructive">
                                    {item.certificate_expiry ? new Date(item.certificate_expiry).toLocaleDateString("vi-VN") : "N/A"}
                                </p>
                                <p className="text-xs text-muted-foreground">Hết hạn</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
