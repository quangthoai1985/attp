import { useDashboardStats } from "@/hooks/useDashboardStats"
import { StatsCards, AnalyticsCharts, ExpiringWidget } from "@/features/dashboard/components/DashboardWidgets"
import { Loader2, Sparkles } from "lucide-react"
import { PageTransition } from "@/components/layout/PageTransition"

export default function Dashboard() {
    const { data, isLoading, error } = useDashboardStats()

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                        <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
                    </div>
                    <p className="text-sm text-muted-foreground animate-pulse">Đang tải dữ liệu...</p>
                </div>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center space-y-2">
                    <p className="text-destructive font-medium">Không thể tải dữ liệu Dashboard.</p>
                    <p className="text-sm text-muted-foreground">Vui lòng thử lại sau.</p>
                </div>
            </div>
        )
    }

    return (
        <PageTransition className="flex-1 space-y-8 p-1">
            {/* Header Section */}
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                        <span className="text-sm font-medium text-primary">Dashboard</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight">
                        <span className="bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
                            Tổng quan hệ thống
                        </span>
                    </h1>
                    <p className="text-muted-foreground">
                        Theo dõi và quản lý cơ sở kinh doanh thực phẩm trên địa bàn
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                        <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                        Hệ thống hoạt động bình thường
                    </div>
                </div>
            </div>

            {/* Stats Cards with stagger animation */}
            <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <StatsCards data={data.summary} />
            </div>

            {/* Charts Section */}
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <AnalyticsCharts pieData={data.charts.pie} barData={data.charts.bar} />
            </div>

            {/* Expiring Widget */}
            <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="grid gap-6 lg:grid-cols-2">
                    <ExpiringWidget facilities={data.expiringSoon || []} />
                </div>
            </div>
        </PageTransition>
    )
}
