import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { addDays, isBefore, isAfter } from "date-fns"

export const useDashboardStats = () => {
    const { data, isLoading, error } = useQuery({
        queryKey: ["dashboard-stats"],
        queryFn: async () => {
            // 1. Fetch Facilities
            const { data: facilitiesData, error: facError } = await supabase
                .from("facilities")
                .select("*")

            if (facError) throw facError

            // Explicit cast to avoid type inference issues
            const facilities = facilitiesData as any[] | null

            // 2. Fetch Inspections
            const { data: inspectionsData, error: insError } = await supabase
                .from("inspections")
                .select("*")

            if (insError) throw insError

            const inspections = inspectionsData as any[] | null

            // Calculations
            const totalFacilities = facilities?.length || 0
            const today = new Date()
            const thirtyDaysFromNow = addDays(today, 30)

            const certifiedFacilities = facilities?.filter(f =>
                f.is_certified &&
                f.certificate_expiry &&
                isAfter(new Date(f.certificate_expiry), today)
            ) || []

            const activeGCNCount = certifiedFacilities.length

            // Expired or Not Certified
            const notCertifiedOrExpiredCount = facilities?.filter(f =>
                !f.is_certified ||
                (f.certificate_expiry && isBefore(new Date(f.certificate_expiry), today))
            ).length || 0

            // Expiring Soon (Certified + Expiry within next 30 days)
            const expiringSoon = facilities?.filter(f =>
                f.is_certified &&
                f.certificate_expiry &&
                isAfter(new Date(f.certificate_expiry), today) &&
                isBefore(new Date(f.certificate_expiry), thirtyDaysFromNow)
            ).sort((a, b) => new Date(a.certificate_expiry!).getTime() - new Date(b.certificate_expiry!).getTime())
                .slice(0, 5) // Top 5

            // Inspections this year
            const currentYear = today.getFullYear()
            const inspectionsThisYear = inspections?.filter(i => i.year === currentYear).length || 0

            // New: Inspection statistics
            const inspectionsByResult = {
                dat: inspections?.filter(i => i.result === 'dat' || i.result === 'passed').length || 0,
                cho_khac_phuc: inspections?.filter(i => i.result === 'cho_khac_phuc' || i.result === 'pending').length || 0,
                da_khac_phuc: inspections?.filter(i => i.result === 'da_khac_phuc').length || 0,
                khong_dat: inspections?.filter(i => i.result === 'khong_dat' || i.result === 'failed').length || 0,
            }

            // Total penalties
            const totalPenalties = inspections?.reduce((sum, i) => {
                if (i.has_penalty && i.penalty_amount) {
                    return sum + Number(i.penalty_amount)
                }
                return sum
            }, 0) || 0

            const penaltyCount = inspections?.filter(i => i.has_penalty).length || 0

            // Data for Charts

            // Pie: By Type
            const typeStats = facilities?.reduce((acc, curr) => {
                acc[curr.type] = (acc[curr.type] || 0) + 1
                return acc
            }, {} as Record<string, number>) || {}

            const pieChartData = Object.entries(typeStats).map(([name, value]) => ({ name, value }))

            // Bar: Inspections by Result (per year)
            const barChartMap: Record<number, { year: number, passed: number, failed: number }> = {}

            inspections?.forEach(i => {
                if (!barChartMap[i.year]) {
                    barChartMap[i.year] = { year: i.year, passed: 0, failed: 0 }
                }
                if (i.result === 'passed' || i.result === 'dat' || i.result === 'da_khac_phuc') {
                    barChartMap[i.year].passed++
                }
                if (i.result === 'failed' || i.result === 'khong_dat') {
                    barChartMap[i.year].failed++
                }
            })

            const barChartData = Object.values(barChartMap).sort((a, b) => a.year - b.year)

            return {
                summary: {
                    totalFacilities,
                    activeGCNCount,
                    notCertifiedOrExpiredCount,
                    inspectionsThisYear,
                    // New inspection stats
                    inspectionsByResult,
                    totalPenalties,
                    penaltyCount,
                },
                charts: {
                    pie: pieChartData,
                    bar: barChartData
                },
                expiringSoon
            }
        }
    })

    return { data, isLoading, error }
}

