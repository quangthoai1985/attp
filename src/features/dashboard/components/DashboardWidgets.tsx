import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Building2, CheckCircle2, AlertTriangle, Calendar, FileWarning, TrendingUp, TrendingDown } from "lucide-react"
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

// Modern Color Palette for Charts
const CHART_COLORS = {
    primary: '#6366f1',    // Indigo
    success: '#10b981',    // Emerald  
    warning: '#f59e0b',    // Amber
    info: '#0ea5e9',       // Sky
    danger: '#f43f5e',     // Rose
    purple: '#a855f7',     // Purple
}

const PIE_COLORS = [CHART_COLORS.primary, CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.info, CHART_COLORS.purple]

// Stats Cards Component
interface StatsSummary {
    totalFacilities: number
    activeGCNCount: number
    notCertifiedOrExpiredCount: number
    inspectionsThisYear: number
}

const statsConfig = [
    {
        key: 'totalFacilities',
        title: 'Tổng số cơ sở',
        description: 'Toàn bộ địa bàn quản lý',
        icon: Building2,
        gradient: 'stat-gradient-primary',
        iconBg: 'bg-primary/10',
        iconColor: 'text-primary',
        trend: null
    },
    {
        key: 'activeGCNCount',
        title: 'Đang hoạt động (GCN)',
        description: 'Giấy chứng nhận còn hạn',
        icon: CheckCircle2,
        gradient: 'stat-gradient-success',
        iconBg: 'bg-success/10',
        iconColor: 'text-success',
        trend: 'up'
    },
    {
        key: 'notCertifiedOrExpiredCount',
        title: 'Chưa cấp / Hết hạn',
        description: 'Cần rà soát ngay',
        icon: AlertTriangle,
        gradient: 'stat-gradient-danger',
        iconBg: 'bg-destructive/10',
        iconColor: 'text-destructive',
        trend: 'down'
    },
    {
        key: 'inspectionsThisYear',
        title: 'Thanh tra năm nay',
        description: 'Lượt kiểm tra đã thực hiện',
        icon: Calendar,
        gradient: 'stat-gradient-info',
        iconBg: 'bg-info/10',
        iconColor: 'text-info',
        trend: null
    }
]

export function StatsCards({ data }: { data: StatsSummary }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statsConfig.map((stat, index) => {
                const Icon = stat.icon
                const value = data[stat.key as keyof StatsSummary]

                return (
                    <Card
                        key={stat.key}
                        className={`${stat.gradient} border-0 shadow-soft card-hover overflow-hidden relative group`}
                        style={{ animationDelay: `${index * 0.1}s` }}
                    >
                        {/* Decorative gradient orb */}
                        <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-foreground/80">
                                {stat.title}
                            </CardTitle>
                            <div className={`p-2.5 rounded-xl ${stat.iconBg} ring-1 ring-inset ring-black/5 dark:ring-white/10`}>
                                <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end gap-2">
                                <div className="text-3xl font-display font-bold tracking-tight">
                                    {value.toLocaleString('vi-VN')}
                                </div>
                                {stat.trend && (
                                    <div className={`flex items-center gap-0.5 text-xs font-medium mb-1 ${stat.trend === 'up' ? 'text-success' : 'text-destructive'
                                        }`}>
                                        {stat.trend === 'up' ? (
                                            <TrendingUp className="h-3 w-3" />
                                        ) : (
                                            <TrendingDown className="h-3 w-3" />
                                        )}
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3">
                <p className="font-medium text-sm mb-1">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground">{entry.name}:</span>
                        <span className="font-semibold">{entry.value}</span>
                    </div>
                ))}
            </div>
        )
    }
    return null
}

// Charts Component
export function AnalyticsCharts({ pieData, barData }: { pieData: any[], barData: any[] }) {
    return (
        <div className="grid gap-6 lg:grid-cols-7">
            {/* Bar Chart */}
            <Card className="lg:col-span-4 border-0 shadow-soft card-hover">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-display">
                                Kết quả kiểm tra qua các năm
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Thống kê đạt/vi phạm theo từng năm
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.success }} />
                                <span className="text-muted-foreground">Đạt</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.danger }} />
                                <span className="text-muted-foreground">Vi phạm</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} barGap={8}>
                                <defs>
                                    <linearGradient id="gradientPassed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={CHART_COLORS.success} stopOpacity={1} />
                                        <stop offset="100%" stopColor={CHART_COLORS.success} stopOpacity={0.7} />
                                    </linearGradient>
                                    <linearGradient id="gradientFailed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={CHART_COLORS.danger} stopOpacity={1} />
                                        <stop offset="100%" stopColor={CHART_COLORS.danger} stopOpacity={0.7} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                <XAxis
                                    dataKey="year"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} />
                                <Bar
                                    dataKey="passed"
                                    name="Đạt"
                                    fill="url(#gradientPassed)"
                                    radius={[6, 6, 0, 0]}
                                    maxBarSize={48}
                                />
                                <Bar
                                    dataKey="failed"
                                    name="Vi phạm"
                                    fill="url(#gradientFailed)"
                                    radius={[6, 6, 0, 0]}
                                    maxBarSize={48}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card className="lg:col-span-3 border-0 shadow-soft card-hover">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-display">
                        Cơ cấu loại hình cơ sở
                    </CardTitle>
                    <CardDescription>
                        Phân bố theo ngành nghề kinh doanh
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <defs>
                                    {PIE_COLORS.map((color, index) => (
                                        <linearGradient key={index} id={`pieGradient${index}`} x1="0" y1="0" x2="1" y2="1">
                                            <stop offset="0%" stopColor={color} stopOpacity={1} />
                                            <stop offset="100%" stopColor={color} stopOpacity={0.8} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={4}
                                    dataKey="value"
                                    strokeWidth={0}
                                >
                                    {pieData.map((_entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={`url(#pieGradient${index % PIE_COLORS.length})`}
                                            className="transition-all duration-300 hover:opacity-80"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    formatter={(value) => (
                                        <span className="text-sm text-foreground">{value}</span>
                                    )}
                                />
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
        <Card className="border-0 shadow-soft card-hover border-l-4 border-l-warning">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-warning/10">
                        <FileWarning className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-display">
                            Cảnh báo sắp hết hạn GCN
                        </CardTitle>
                        <CardDescription>
                            {facilities.length} cơ sở cần được thông báo gia hạn trong 30 ngày tới
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {facilities.map((item, index) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                                    {item.name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                    {item.address}
                                </p>
                            </div>
                            <div className="text-right flex-shrink-0 ml-4">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-semibold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                                    {item.certificate_expiry
                                        ? new Date(item.certificate_expiry).toLocaleDateString("vi-VN")
                                        : "N/A"
                                    }
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
