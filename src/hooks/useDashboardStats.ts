import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { startOfYear, endOfYear, addDays, isBefore, isAfter } from "date-fns"

export const useDashboardStats = () => {
    const { data, isLoading, error } = useQuery({
        queryKey: ["dashboard-stats"],
        queryFn: async () => {
            // 1. Fetch Facilities
            const { data: facilities, error: facError } = await supabase
                .from("facilities")
                .select("*")

            if (facError) throw facError

            // 2. Fetch Inspections
            const { data: inspections, error: insError } = await supabase
                .from("inspections")
                .select("*")

            if (insError) throw insError

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
            // User requested: "Chưa cấp/Hết hạn". 
            // - Not Certified: is_certified == false/null
            // - Expired: is_certified == true AND expiry <= today
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

            // Data for Charts

            // Pie: By Type
            const typeStats = facilities?.reduce((acc, curr) => {
                acc[curr.type] = (acc[curr.type] || 0) + 1
                return acc
            }, {} as Record<string, number>) || {}

            const pieChartData = Object.entries(typeStats).map(([name, value]) => ({ name, value }))

            // Bar: Inspections by Result (per year or just filtered by current year/all time)
            // Requirement: "Số lượng cơ sở đạt/không đạt qua các năm"
            // Let's grouping by Year then Result
            const barChartMap: Record<number, { year: number, passed: number, failed: number }> = {}

            inspections?.forEach(i => {
                if (!barChartMap[i.year]) {
                    barChartMap[i.year] = { year: i.year, passed: 0, failed: 0 }
                }
                if (i.result === 'passed') barChartMap[i.year].passed++
                if (i.result === 'failed') barChartMap[i.year].failed++
                // pending ignored or added if needed
            })

            const barChartData = Object.values(barChartMap).sort((a, b) => a.year - b.year)

            return {
                summary: {
                    totalFacilities,
                    activeGCNCount,
                    notCertifiedOrExpiredCount,
                    inspectionsThisYear
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
