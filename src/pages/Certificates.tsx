import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { Award, Filter, Building2, Edit, Check, X, Calendar } from "lucide-react"

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
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { isBefore, addDays, format } from "date-fns"

type Facility = Database['public']['Tables']['facilities']['Row']
type FacilityType = Database['public']['Tables']['facility_types']['Row']

// Certificate status calculation
const getCertificateStatus = (facility: Facility) => {
    if (!facility.is_certified || !facility.certificate_expiry) {
        return { status: 'not_certified', label: 'Chưa cấp', color: 'bg-slate-500' }
    }

    const today = new Date()
    const expiryDate = new Date(facility.certificate_expiry)
    const warningDate = addDays(today, 30) // 30 days before expiry

    if (isBefore(expiryDate, today)) {
        return { status: 'expired', label: 'Hết hạn', color: 'bg-red-500 text-white' }
    }

    if (isBefore(expiryDate, warningDate)) {
        return { status: 'expiring_soon', label: 'Sắp hết hạn', color: 'bg-amber-500 text-white' }
    }

    return { status: 'valid', label: 'Còn hạn', color: 'bg-emerald-500 text-white' }
}

export default function Certificates() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    // Filters
    const [search, setSearch] = useState("")
    const [managementLevelFilter, setManagementLevelFilter] = useState<string>("all")
    const [facilityTypeFilter, setFacilityTypeFilter] = useState<string>("all")
    const [statusFilter, setStatusFilter] = useState<string>("all")

    // Edit sheet
    const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    // Form state for editing
    const [formData, setFormData] = useState({
        is_certified: false,
        certificate_number: "",
        certificate_date: "",
        certificate_expiry: "",
    })

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

    // Fetch facilities
    const { data: facilities = [] } = useQuery({
        queryKey: ["facilities-certificates", search, managementLevelFilter, facilityTypeFilter, statusFilter],
        queryFn: async () => {
            let query = supabase
                .from("facilities")
                .select("*")
                .order("name")

            if (search) {
                query = query.ilike("name", `%${search}%`)
            }

            if (managementLevelFilter !== "all") {
                query = query.eq("province_code", managementLevelFilter)
            }

            if (facilityTypeFilter !== "all") {
                query = query.eq("type", facilityTypeFilter)
            }

            const { data, error } = await query
            if (error) throw error

            // Filter by certificate status on client side
            let result = data as Facility[]
            if (statusFilter !== "all") {
                result = result.filter(f => {
                    const certStatus = getCertificateStatus(f)
                    return certStatus.status === statusFilter
                })
            }

            return result
        }
    })

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async (data: {
            id: string
            is_certified: boolean
            certificate_number: string | null
            certificate_date: string | null
            certificate_expiry: string | null
        }) => {
            const { error } = await supabase
                .from("facilities")
                .update({
                    is_certified: data.is_certified,
                    certificate_number: data.certificate_number || null,
                    certificate_date: data.certificate_date || null,
                    certificate_expiry: data.certificate_expiry || null,
                } as never)
                .eq("id", data.id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["facilities-certificates"] })
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
            setIsSheetOpen(false)
            setSelectedFacility(null)
            toast({
                title: "Thành công",
                description: "Đã cập nhật thông tin giấy chứng nhận",
                variant: "success"
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

    const handleEdit = (facility: Facility) => {
        setSelectedFacility(facility)
        setFormData({
            is_certified: facility.is_certified || false,
            certificate_number: facility.certificate_number || "",
            certificate_date: facility.certificate_date || "",
            certificate_expiry: facility.certificate_expiry || "",
        })
        setIsSheetOpen(true)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedFacility) return

        updateMutation.mutate({
            id: selectedFacility.id,
            is_certified: formData.is_certified,
            certificate_number: formData.certificate_number,
            certificate_date: formData.certificate_date,
            certificate_expiry: formData.certificate_expiry,
        })
    }

    // Columns definition
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
            accessorKey: "is_certified",
            header: "Đã cấp GCN",
            cell: ({ row }) => {
                const isCertified = row.getValue("is_certified") as boolean
                return (
                    <div className="flex justify-center">
                        {isCertified ? (
                            <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        ) : (
                            <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <X className="h-4 w-4 text-slate-400" />
                            </div>
                        )}
                    </div>
                )
            }
        },
        {
            accessorKey: "certificate_number",
            header: "Số GCN",
            cell: ({ row }) => (
                <span className="font-mono text-sm">
                    {row.getValue("certificate_number") || "-"}
                </span>
            )
        },
        {
            accessorKey: "certificate_date",
            header: "Ngày cấp",
            cell: ({ row }) => {
                const date = row.getValue("certificate_date") as string
                return (
                    <span className="text-sm">
                        {date ? format(new Date(date), 'dd/MM/yyyy') : "-"}
                    </span>
                )
            }
        },
        {
            accessorKey: "certificate_expiry",
            header: "Ngày hết hạn",
            cell: ({ row }) => {
                const date = row.getValue("certificate_expiry") as string
                return (
                    <span className="text-sm">
                        {date ? format(new Date(date), 'dd/MM/yyyy') : "-"}
                    </span>
                )
            }
        },
        {
            id: "status",
            header: "Trạng thái",
            cell: ({ row }) => {
                const certStatus = getCertificateStatus(row.original)
                return (
                    <div className="flex justify-center">
                        <Badge className={`${certStatus.color} whitespace-nowrap`}>
                            {certStatus.label}
                        </Badge>
                    </div>
                )
            }
        },
        {
            id: "actions",
            header: "Thao tác",
            cell: ({ row }) => (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(row.original)}
                >
                    <Edit className="h-4 w-4" />
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
                        <Award className="h-6 w-6 text-primary" />
                        <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                            Giấy CN ĐĐK ATTP
                        </h2>
                    </div>
                    <p className="text-muted-foreground mt-1">
                        Quản lý giấy chứng nhận đủ điều kiện an toàn thực phẩm của các cơ sở
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

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Trạng thái GCN" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        <SelectItem value="valid">Còn hạn</SelectItem>
                        <SelectItem value="expiring_soon">Sắp hết hạn</SelectItem>
                        <SelectItem value="expired">Hết hạn</SelectItem>
                        <SelectItem value="not_certified">Chưa cấp</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Data Table */}
            <div className="rounded-md border shadow-sm bg-card">
                <DataTable
                    columns={columns}
                    data={facilities}
                />
            </div>

            {/* Edit Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-md overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            Cập nhật GCN
                        </SheetTitle>
                        {selectedFacility && (
                            <p className="text-sm text-muted-foreground">
                                {selectedFacility.name}
                            </p>
                        )}
                    </SheetHeader>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                        {/* Is Certified Toggle */}
                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                            <div className="space-y-0.5">
                                <Label htmlFor="is_certified" className="font-medium">
                                    Đã được cấp GCN
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Cơ sở đã có giấy chứng nhận ĐĐK ATTP
                                </p>
                            </div>
                            <Switch
                                id="is_certified"
                                checked={formData.is_certified}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, is_certified: checked })
                                }
                            />
                        </div>

                        {formData.is_certified && (
                            <>
                                {/* Certificate Number */}
                                <div className="space-y-2">
                                    <Label htmlFor="certificate_number">Số GCN</Label>
                                    <Input
                                        id="certificate_number"
                                        placeholder="Nhập số giấy chứng nhận..."
                                        value={formData.certificate_number}
                                        onChange={(e) =>
                                            setFormData({ ...formData, certificate_number: e.target.value })
                                        }
                                    />
                                </div>

                                {/* Certificate Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="certificate_date">Ngày cấp</Label>
                                    <Input
                                        id="certificate_date"
                                        type="date"
                                        value={formData.certificate_date}
                                        onChange={(e) =>
                                            setFormData({ ...formData, certificate_date: e.target.value })
                                        }
                                    />
                                </div>

                                {/* Certificate Expiry */}
                                <div className="space-y-2">
                                    <Label htmlFor="certificate_expiry">Ngày hết hạn</Label>
                                    <Input
                                        id="certificate_expiry"
                                        type="date"
                                        value={formData.certificate_expiry}
                                        onChange={(e) =>
                                            setFormData({ ...formData, certificate_expiry: e.target.value })
                                        }
                                    />
                                </div>
                            </>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => setIsSheetOpen(false)}
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                            </Button>
                        </div>
                    </form>
                </SheetContent>
            </Sheet>
        </PageTransition>
    )
}
