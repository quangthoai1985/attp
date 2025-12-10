import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { ClipboardCheck, Plus, Eye, Filter, Calendar, Building2 } from "lucide-react"

import { supabase, Database } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { PageTransition } from "@/components/layout/PageTransition"
import { useToast } from "@/hooks/use-toast"
import { InspectionForm } from "@/features/inspections/components/InspectionForm"
import { RESULT_LABELS, RESULT_COLORS, TEAM_TYPE_LABELS, InspectionFormValues } from "@/schemas/inspection"
import { isBefore } from "date-fns"

type Facility = Database['public']['Tables']['facilities']['Row']
type Inspection = Database['public']['Tables']['inspections']['Row']
type FacilityType = Database['public']['Tables']['facility_types']['Row']

export default function Inspections() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    // Filters
    const [search, setSearch] = useState("")
    const [managementLevelFilter, setManagementLevelFilter] = useState<string>("all")
    const [facilityTypeFilter, setFacilityTypeFilter] = useState<string>("all")

    // Selected facility for inspection history
    const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null)
    const [isInspectionSheetOpen, setIsInspectionSheetOpen] = useState(false)
    const [showAddForm, setShowAddForm] = useState(false)

    // Fetch facility types for filter
    const { data: facilityTypes = [] } = useQuery({
        queryKey: ["facility_types"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("facility_types")
                .select("*")
                .eq("is_active", true)
                .order("name")
            if (error) throw error
            return data as FacilityType[]
        }
    })

    // Fetch facilities with filters
    const { data: facilities = [] } = useQuery({
        queryKey: ["facilities", search, managementLevelFilter, facilityTypeFilter],
        queryFn: async () => {
            let query = supabase
                .from("facilities")
                .select("*")
                .order("name")

            if (search) {
                query = query.ilike("name", `%${search}%`)
            }

            if (managementLevelFilter !== "all") {
                query = query.eq("province_code", managementLevelFilter === "tinh" ? "tinh" : "huyen")
            }

            if (facilityTypeFilter !== "all") {
                query = query.eq("type", facilityTypeFilter)
            }

            const { data, error } = await query
            if (error) throw error
            return data as Facility[]
        }
    })

    // Fetch inspections for selected facility
    const { data: inspections = [], refetch: refetchInspections } = useQuery({
        queryKey: ["inspections", selectedFacility?.id],
        queryFn: async () => {
            if (!selectedFacility) return []
            const { data, error } = await supabase
                .from("inspections")
                .select("*")
                .eq("facility_id", selectedFacility.id)
                .order("inspection_date", { ascending: false })
            if (error) throw error
            return data as Inspection[]
        },
        enabled: !!selectedFacility
    })

    // Auto-update status for overdue remediation
    useEffect(() => {
        const updateOverdueInspections = async () => {
            const today = new Date()
            const overdueItems = inspections.filter(i =>
                i.result === 'cho_khac_phuc' &&
                i.remediation_deadline &&
                isBefore(new Date(i.remediation_deadline), today)
            )

            for (const item of overdueItems) {
                await supabase
                    .from("inspections")
                    .update({ result: 'khong_dat' } as never)
                    .eq("id", item.id)
            }

            if (overdueItems.length > 0) {
                refetchInspections()
                toast({
                    title: "Cập nhật trạng thái",
                    description: `${overdueItems.length} cơ sở đã quá hạn khắc phục được chuyển sang "Không đạt"`,
                })
            }
        }

        if (inspections.length > 0) {
            updateOverdueInspections()
        }
    }, [inspections, refetchInspections, toast])

    // Create inspection mutation
    const createMutation = useMutation({
        mutationFn: async (values: InspectionFormValues) => {
            if (!selectedFacility) return

            const insertData = {
                facility_id: selectedFacility.id,
                inspection_date: values.inspection_date,
                year: new Date(values.inspection_date).getFullYear(),
                team_type: values.team_type,
                result: values.result,
                remediation_deadline: values.remediation_deadline || null,
                has_penalty: values.has_penalty,
                penalty_amount: values.penalty_amount || null,
                penalty_agency: values.penalty_agency || null,
                sanction_type: values.sanction_type || null,
                notes: values.notes || null,
            }

            const { error } = await supabase
                .from("inspections")
                .insert(insertData as never)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inspections"] })
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
            setShowAddForm(false)
            toast({
                title: "Thành công",
                description: "Đã thêm thông tin kiểm tra mới"
            })
        },
        onError: (error: Error) => {
            toast({
                title: "Lỗi",
                description: error.message,
                variant: "destructive"
            })
        }
    })

    // Mark as remediated mutation
    const markRemediatedMutation = useMutation({
        mutationFn: async (inspectionId: string) => {
            const { error } = await supabase
                .from("inspections")
                .update({ result: 'da_khac_phuc' } as never)
                .eq("id", inspectionId)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inspections"] })
            toast({
                title: "Thành công",
                description: "Đã đánh dấu hoàn thành khắc phục"
            })
        }
    })

    const handleViewInspections = (facility: Facility) => {
        setSelectedFacility(facility)
        setIsInspectionSheetOpen(true)
        setShowAddForm(false)
    }

    const handleSubmitInspection = async (values: InspectionFormValues) => {
        await createMutation.mutateAsync(values)
    }


    // Columns for facility list
    const columns: ColumnDef<Facility>[] = [
        {
            accessorKey: "name",
            header: "Tên cơ sở",
            cell: ({ row }) => (
                <div className="font-medium">{row.getValue("name")}</div>
            )
        },
        {
            accessorKey: "owner_name",
            header: "Chủ cơ sở",
            cell: ({ row }) => (
                <span className="text-sm">{row.getValue("owner_name") || "-"}</span>
            )
        },
        {
            accessorKey: "address",
            header: "Địa chỉ",
            cell: ({ row }) => (
                <span className="text-muted-foreground text-sm">
                    {row.getValue("address") || "-"}
                </span>
            )
        },
        {
            accessorKey: "type",
            header: "Loại hình",
            cell: ({ row }) => (
                <div className="max-w-[200px]">
                    <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 leading-snug">
                        {row.getValue("type")}
                    </span>
                </div>
            )
        },
        {
            id: "actions",
            header: "Lịch sử kiểm tra",
            cell: ({ row }) => (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewInspections(row.original)}
                    className="gap-2"
                >
                    <Eye className="h-4 w-4" />
                    Xem chi tiết
                </Button>
            )
        }
    ]

    return (
        <PageTransition className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <ClipboardCheck className="h-6 w-6 text-primary" />
                        <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                            Thanh kiểm tra
                        </h2>
                    </div>
                    <p className="text-muted-foreground mt-1">
                        Quản lý lịch sử thanh kiểm tra an toàn thực phẩm của các cơ sở
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center bg-card p-4 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Filter className="h-4 w-4" />
                    <span className="text-sm font-medium">Bộ lọc:</span>
                </div>

                <Input
                    placeholder="Tìm theo tên cơ sở..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-xs"
                />

                <Select value={managementLevelFilter} onValueChange={setManagementLevelFilter}>
                    <SelectTrigger className="w-[180px]">
                        <Building2 className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Cấp quản lý" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả cấp</SelectItem>
                        <SelectItem value="tinh">Cấp Tỉnh</SelectItem>
                        <SelectItem value="huyen">Cấp Huyện</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={facilityTypeFilter} onValueChange={setFacilityTypeFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Loại hình" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả loại hình</SelectItem>
                        {facilityTypes.map((type) => (
                            <SelectItem key={type.id} value={type.name}>
                                {type.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Facilities Table */}
            <div className="rounded-md border shadow-sm bg-card">
                <DataTable
                    columns={columns}
                    data={facilities}
                />
            </div>

            {/* Inspection History Sheet */}
            <Sheet open={isInspectionSheetOpen} onOpenChange={setIsInspectionSheetOpen}>
                <SheetContent className="sm:max-w-xl overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            Lịch sử kiểm tra
                        </SheetTitle>
                        {selectedFacility && (
                            <p className="text-sm text-muted-foreground">
                                {selectedFacility.name}
                            </p>
                        )}
                    </SheetHeader>

                    <div className="mt-6 space-y-6">
                        {/* Add New Button */}
                        {!showAddForm && (
                            <Button
                                onClick={() => setShowAddForm(true)}
                                className="w-full gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Thêm lần kiểm tra mới
                            </Button>
                        )}

                        {/* Add Form */}
                        {showAddForm && (
                            <div className="p-4 border rounded-lg bg-muted/30">
                                <h4 className="font-medium mb-4">Thêm thông tin kiểm tra</h4>
                                <InspectionForm
                                    onSubmit={handleSubmitInspection}
                                    loading={createMutation.isPending}
                                    onCancel={() => setShowAddForm(false)}
                                />
                            </div>
                        )}

                        {/* Inspection History List */}
                        <div className="space-y-4">
                            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                                Lịch sử ({inspections.length} lần kiểm tra)
                            </h4>

                            {inspections.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    Chưa có lịch sử kiểm tra
                                </div>
                            ) : (
                                inspections.map((inspection) => (
                                    <div
                                        key={inspection.id}
                                        className="p-4 border rounded-lg bg-card space-y-3"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">
                                                        {inspection.inspection_date
                                                            ? new Date(inspection.inspection_date).toLocaleDateString('vi-VN')
                                                            : 'Chưa có ngày'}
                                                    </span>
                                                    <Badge className={RESULT_COLORS[inspection.result] || ''}>
                                                        {RESULT_LABELS[inspection.result] || inspection.result}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Đoàn {TEAM_TYPE_LABELS[inspection.team_type] || inspection.team_type}
                                                </p>
                                            </div>

                                            {inspection.result === 'cho_khac_phuc' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => markRemediatedMutation.mutate(inspection.id)}
                                                    disabled={markRemediatedMutation.isPending}
                                                >
                                                    Đã khắc phục
                                                </Button>
                                            )}
                                        </div>

                                        {inspection.remediation_deadline && (
                                            <p className="text-sm">
                                                <span className="text-muted-foreground">Hạn khắc phục:</span>{' '}
                                                <span className="font-medium">
                                                    {new Date(inspection.remediation_deadline).toLocaleDateString('vi-VN')}
                                                </span>
                                            </p>
                                        )}

                                        {inspection.has_penalty && (
                                            <div className="p-3 bg-destructive/10 rounded-lg text-sm space-y-1">
                                                <p className="font-medium text-destructive">Có xử phạt</p>
                                                {inspection.penalty_amount && (
                                                    <p>Số tiền: <strong>{inspection.penalty_amount.toLocaleString('vi-VN')} VNĐ</strong></p>
                                                )}
                                                {inspection.penalty_agency && (
                                                    <p>Cơ quan: {inspection.penalty_agency}</p>
                                                )}
                                                {inspection.sanction_type && (
                                                    <p>Hình thức: {inspection.sanction_type}</p>
                                                )}
                                            </div>
                                        )}

                                        {inspection.notes && (
                                            <p className="text-sm italic text-muted-foreground border-l-2 pl-3">
                                                {inspection.notes}
                                            </p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </PageTransition>
    )
}
