import { useDashboardStats } from "@/hooks/useDashboardStats"
import { StatsCards, AnalyticsCharts, ExpiringWidget } from "@/features/dashboard/components/DashboardWidgets"
import { Loader2 } from "lucide-react"

import { PageTransition } from "@/components/layout/PageTransition"

export default function Dashboard() {
    const { data, isLoading, error } = useDashboardStats()

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    if (error || !data) {
        return <div className="p-8 text-destructive">Không thể tải dữ liệu Dashboard.</div>
    }

    return (
        <PageTransition className="flex-1 space-y-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    Tổng quan
                </h2>
                <div className="flex items-center space-x-2">
                    {/* Add DateRangePicker here later if needed */}
                </div>
            </div>

            <StatsCards data={data.summary} />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-7">
                    <AnalyticsCharts pieData={data.charts.pie} barData={data.charts.bar} />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
                    <ExpiringWidget facilities={data.expiringSoon || []} />
                </div>
            </div>
        </PageTransition>
    )
}
