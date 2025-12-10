import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { Plus, Edit, Trash2 } from "lucide-react"

import { supabase, Database } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { PageTransition } from "@/components/layout/PageTransition"
import { useToast } from "@/hooks/use-toast"

type FacilityType = Database['public']['Tables']['facility_types']['Row']

interface FacilityTypeFormData {
    name: string
    description: string
    is_active: boolean
}

export default function FacilityTypes() {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingType, setEditingType] = useState<FacilityType | null>(null)
    const [deleteType, setDeleteType] = useState<FacilityType | null>(null)
    const [formData, setFormData] = useState<FacilityTypeFormData>({
        name: "",
        description: "",
        is_active: true,
    })

    // Fetch facility types
    const { data: facilityTypes = [] } = useQuery({
        queryKey: ["facility_types"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("facility_types")
                .select("*")
                .order("created_at", { ascending: false })
            if (error) throw error
            return data as FacilityType[]
        },
    })

    // Create/Update mutation
    const saveMutation = useMutation({
        mutationFn: async (data: FacilityTypeFormData) => {
            if (editingType) {
                const { error } = await supabase
                    .from("facility_types")
                    .update({
                        name: data.name,
                        description: data.description || null,
                        is_active: data.is_active,
                    } as never)
                    .eq("id", editingType.id)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from("facility_types")
                    .insert({
                        name: data.name,
                        description: data.description || null,
                        is_active: data.is_active,
                    } as never)
                if (error) throw error
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["facility_types"] })
            setIsDialogOpen(false)
            setEditingType(null)
            resetForm()
            toast({
                title: "Thành công",
                description: editingType ? "Đã cập nhật loại hình" : "Đã thêm loại hình mới",
            })
        },
        onError: (error: Error) => {
            toast({
                title: "Lỗi",
                description: error.message,
                variant: "destructive",
            })
        },
    })

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("facility_types")
                .delete()
                .eq("id", id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["facility_types"] })
            setDeleteType(null)
            toast({
                title: "Thành công",
                description: "Đã xóa loại hình",
            })
        },
        onError: (error: Error) => {
            toast({
                title: "Lỗi",
                description: error.message,
                variant: "destructive",
            })
        },
    })

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            is_active: true,
        })
    }

    const handleOpenDialog = (type?: FacilityType) => {
        if (type) {
            setEditingType(type)
            setFormData({
                name: type.name,
                description: type.description || "",
                is_active: type.is_active,
            })
        } else {
            setEditingType(null)
            resetForm()
        }
        setIsDialogOpen(true)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name.trim()) {
            toast({
                title: "Lỗi",
                description: "Vui lòng nhập tên loại hình",
                variant: "destructive",
            })
            return
        }
        saveMutation.mutate(formData)
    }

    // Columns definition
    const columns: ColumnDef<FacilityType>[] = [
        {
            accessorKey: "name",
            header: "Tên loại hình",
            cell: ({ row }) => (
                <span className="font-medium">{row.getValue("name")}</span>
            ),
        },
        {
            accessorKey: "description",
            header: "Mô tả",
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {row.getValue("description") || "-"}
                </span>
            ),
        },
        {
            accessorKey: "is_active",
            header: "Trạng thái",
            cell: ({ row }) => {
                const isActive = row.getValue("is_active") as boolean
                return (
                    <Badge variant={isActive ? "default" : "secondary"}>
                        {isActive ? "Đang sử dụng" : "Tạm ẩn"}
                    </Badge>
                )
            },
        },
        {
            id: "actions",
            header: "Thao tác",
            cell: ({ row }) => {
                return (
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(row.original)}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteType(row.original)}
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                )
            },
        },
    ]

    return (
        <PageTransition className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        Quản lý Loại hình
                    </h2>
                    <p className="text-muted-foreground">
                        Danh sách các loại hình cơ sở kinh doanh thực phẩm.
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={() => handleOpenDialog()}
                            className="shadow-lg hover:shadow-xl transition-all"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Thêm mới
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingType ? "Chỉnh sửa loại hình" : "Thêm loại hình mới"}
                                </DialogTitle>
                                <DialogDescription>
                                    {editingType
                                        ? "Cập nhật thông tin loại hình cơ sở."
                                        : "Thêm loại hình mới cho cơ sở kinh doanh."}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Tên loại hình *</Label>
                                    <Input
                                        id="name"
                                        placeholder="Nhập tên loại hình..."
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Mô tả</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Mô tả chi tiết về loại hình..."
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData({ ...formData, description: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="is_active"
                                        checked={formData.is_active}
                                        onCheckedChange={(checked: boolean) =>
                                            setFormData({ ...formData, is_active: checked })
                                        }
                                    />
                                    <Label htmlFor="is_active">Đang sử dụng</Label>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsDialogOpen(false)}
                                >
                                    Hủy
                                </Button>
                                <Button type="submit" disabled={saveMutation.isPending}>
                                    {saveMutation.isPending ? "Đang lưu..." : "Lưu"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border shadow-sm bg-card">
                <DataTable
                    columns={columns}
                    data={facilityTypes}
                />
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteType} onOpenChange={() => setDeleteType(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa loại hình "{deleteType?.name}"?
                            Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteType && deleteMutation.mutate(deleteType.id)}
                        >
                            {deleteMutation.isPending ? "Đang xóa..." : "Xóa"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PageTransition>
    )
}
