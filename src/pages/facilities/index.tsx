import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { Plus, Edit } from "lucide-react"
import { Link } from "react-router-dom"

import { supabase } from "@/lib/supabase"
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
import { useAuth } from "@/hooks/useAuth"
import { PageTransition } from "@/components/layout/PageTransition"

// Type definition (matching Supabase Row)
type Facility = {
    id: string
    name: string
    address: string | null
    type: string
    province_code: string
    status: "active" | "inactive" | "suspended"
    created_at: string
}

export default function FacilityList() {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [isOpen, setIsOpen] = useState(false)
    const [editingFacility, setEditingFacility] = useState<Facility | null>(null)

    // Data Fetching
    const { data: facilities = [], isLoading } = useQuery({
        queryKey: ["facilities", search, statusFilter],
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
                    .update(values)
                    .eq("id", editingFacility.id)
                if (error) throw error
            } else {
                // Create
                const { error } = await supabase
                    .from("facilities")
                    .insert(values)
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
            accessorKey: "address",
            header: "Địa chỉ",
        },
        {
            accessorKey: "type",
            header: "Loại hình",
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
                    <Badge variant={colorMap[status] || "outline"}>
                        {labelMap[status] || status}
                    </Badge>
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
                    <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Quản lý Cơ sở</h2>
                    <p className="text-muted-foreground">Danh sách cơ sở sản xuất kinh doanh.</p>
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

            <div className="flex gap-4">
                <Input
                    placeholder="Tìm kiếm theo tên..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm shadow-sm focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px] shadow-sm">
                        <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
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
