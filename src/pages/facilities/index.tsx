import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { Plus, Edit, Filter, Building2, Store } from "lucide-react"
import { Link } from "react-router-dom"

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
    SheetTrigger
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { FacilityForm } from "@/features/facilities/components/FacilityForm"
import { FacilityFormValues } from "@/schemas/facility"

import { PageTransition } from "@/components/layout/PageTransition"

// Type definition (from Supabase schema)
type Facility = Database['public']['Tables']['facilities']['Row']
type FacilityInsert = Database['public']['Tables']['facilities']['Insert']
type FacilityType = Database['public']['Tables']['facility_types']['Row']

export default function FacilityList() {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [managementLevelFilter, setManagementLevelFilter] = useState<string>("all")
    const [facilityTypeFilter, setFacilityTypeFilter] = useState<string>("all")
    const [isOpen, setIsOpen] = useState(false)
    const [editingFacility, setEditingFacility] = useState<Facility | null>(null)

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

    // Data Fetching
    const { data: facilities = [] } = useQuery({
        queryKey: ["facilities", search, statusFilter, managementLevelFilter, facilityTypeFilter],
        queryFn: async () => {
            let query = supabase
                .from("facilities")
                .select("*")
                .order("created_at", { ascending: false })

            if (search) {
                query = query.ilike("name", `%${search}%`)
            }

            if (statusFilter !== "all") {
                query = query.eq("status", statusFilter)
            }

            if (managementLevelFilter !== "all") {
                query = query.eq("province_code", managementLevelFilter)
            }

            if (facilityTypeFilter !== "all") {
                query = query.eq("type", facilityTypeFilter)
            }

            const { data, error } = await query
            if (error) throw error
            return data as Facility[]
        },
    })

    // Mutations
    const mutation = useMutation({
        mutationFn: async (values: FacilityFormValues) => {
            if (editingFacility) {
                // Update
                const { error } = await supabase
                    .from("facilities")
                    .update(values as never)
                    .eq("id", editingFacility.id)
                if (error) throw error
            } else {
                // Create
                const insertData: FacilityInsert = values as FacilityInsert
                const { error } = await supabase
                    .from("facilities")
                    .insert(insertData as never)
                if (error) throw error
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["facilities"] })
            setIsOpen(false)
            setEditingFacility(null)
        },
    })

    const handleSubmit = async (values: FacilityFormValues) => {
        await mutation.mutateAsync(values)
    }

    const handleEdit = (facility: Facility) => {
        setEditingFacility(facility)
        setIsOpen(true)
    }

    const handleAddNew = () => {
        setEditingFacility(null)
        setIsOpen(true)
    }

    // Columns Definition
    const columns: ColumnDef<Facility>[] = [
        {
            accessorKey: "name",
            header: "Tên cơ sở",
            cell: ({ row }) => (
                <Link
                    to={`/facilities/${row.original.id}`}
                    className="font-medium hover:underline text-primary"
                >
                    {row.getValue("name")}
                </Link>
            )
        },
        {
            accessorKey: "owner_name",
            header: "Chủ cơ sở",
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {row.getValue("owner_name") || "-"}
                </span>
            )
        },
        {
            accessorKey: "address",
            header: "Địa chỉ",
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
            accessorKey: "status",
            header: "Trạng thái",
            cell: ({ row }) => {
                const status = row.getValue("status") as string
                const colorMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
                    active: "default",
                    inactive: "secondary",
                    suspended: "destructive",
                }
                const labelMap: Record<string, string> = {
                    active: "Hoạt động",
                    inactive: "Ngừng",
                    suspended: "Đình chỉ",
                }
                return (
                    <div className="flex justify-center">
                        <Badge variant={colorMap[status] || "outline"} className="whitespace-nowrap">
                            {labelMap[status] || status}
                        </Badge>
                    </div>
                )
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                return (
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                )
            },
        },
    ]

    return (
        <PageTransition className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Store className="h-6 w-6 text-primary" />
                        <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Quản lý Cơ sở</h2>
                    </div>
                    <p className="text-muted-foreground mt-1">Danh sách cơ sở sản xuất kinh doanh.</p>
                </div>

                <Sheet open={isOpen} onOpenChange={(open) => {
                    setIsOpen(open)
                    if (!open) setEditingFacility(null)
                }}>
                    <SheetTrigger asChild>
                        <Button onClick={handleAddNew} className="shadow-lg hover:shadow-xl transition-all">
                            <Plus className="mr-2 h-4 w-4" /> Thêm mới
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-md overflow-y-auto">
                        <SheetHeader>
                            <SheetTitle>
                                {editingFacility ? "Chỉnh sửa cơ sở" : "Thêm cơ sở mới"}
                            </SheetTitle>
                        </SheetHeader>
                        <div className="py-6">
                            <FacilityForm
                                onSubmit={handleSubmit}
                                loading={mutation.isPending}
                                defaultValues={editingFacility || undefined}
                            />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center bg-card p-4 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Filter className="h-4 w-4" />
                    <span className="text-sm font-medium">Bộ lọc:</span>
                </div>

                <Input
                    placeholder="Tìm kiếm theo tên..."
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
                        <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        <SelectItem value="active">Hoạt động</SelectItem>
                        <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                        <SelectItem value="suspended">Tạm đình chỉ</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border shadow-sm bg-card">
                <DataTable
                    columns={columns}
                    data={facilities}
                />
            </div>
        </PageTransition>
    )
}
