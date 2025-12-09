import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Loader2, Plus, Store } from "lucide-react"

import { supabase, Database } from "@/lib/supabase"

type Facility = Database['public']['Tables']['facilities']['Row']
type Inspection = Database['public']['Tables']['inspections']['Row']
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { InspectionList } from "@/features/inspections/components/InspectionList"
import { InspectionForm } from "@/features/inspections/components/InspectionForm"
import { InspectionFormValues } from "@/schemas/inspection"
import { useState } from "react"
import { PageTransition } from "@/components/layout/PageTransition"

export default function FacilityDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    // 1. Fetch Facility Info
    const { data: facility, isLoading: loadingFacility } = useQuery<Facility | null>({
        queryKey: ["facility", id],
        queryFn: async (): Promise<Facility | null> => {
            if (!id) throw new Error("ID not found")
            const { data, error } = await supabase
                .from("facilities")
                .select("*")
                .eq("id", id)
                .single()
            if (error) throw error
            return data as Facility
        },
        enabled: !!id
    })

    // 2. Fetch Inspections
    const { data: inspections = [], isLoading: loadingInspections } = useQuery<Inspection[]>({
        queryKey: ["inspections", id],
        queryFn: async (): Promise<Inspection[]> => {
            if (!id) throw new Error("ID not found")
            const { data, error } = await supabase
                .from("inspections")
                .select("*")
                .eq("facility_id", id)
                .order("inspection_date", { ascending: false }) // Newest first
            if (error) throw error
            return data as Inspection[]
        },
        enabled: !!id
    })

    // 3. Mutation for Add Inspection
    type InspectionInsert = Database['public']['Tables']['inspections']['Insert']
    const mutation = useMutation({
        mutationFn: async (values: InspectionFormValues) => {
            if (!id) throw new Error("No Facility ID")
            const insertData: InspectionInsert = {
                facility_id: id,
                ...values,
            }
            const { error } = await supabase.from("inspections").insert(insertData as never)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inspections", id] })
            setIsSheetOpen(false)
        },
    })

    if (loadingFacility && !facility) {
        return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    if (!facility) {
        return <div className="p-8 text-center text-muted-foreground">Không tìm thấy cơ sở.</div>
    }

    return (
        <PageTransition className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate("/facilities")} className="h-10 w-10 rounded-full hover:bg-muted/80 transition-all">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        <Store className="h-8 w-8 text-primary" />
                        {facility.name}
                    </h1>
                    <p className="text-muted-foreground flex items-center gap-2 mt-1">
                        {facility.address}
                    </p>
                </div>
                <div className="ml-auto">
                    <Badge variant={facility.status === 'active' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
                        {facility.status}
                    </Badge>
                </div>
            </div>

            <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px] bg-muted/50 p-1">
                    <TabsTrigger value="info" className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">Thông tin chung</TabsTrigger>
                    <TabsTrigger value="history" className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">Lịch sử kiểm tra</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="mt-6">
                    <Card className="shadow-lg border-t-4 border-t-primary/20">
                        <CardHeader>
                            <CardTitle>Thông tin cơ sở</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Loại hình</span>
                                    <span className="block text-lg font-medium">{facility.type}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Địa bàn (Mã)</span>
                                    <span className="block text-lg font-medium">{facility.province_code}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Ngày tạo</span>
                                    <span className="block text-lg font-medium">{new Date(facility.created_at).toLocaleDateString("vi-VN")}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Giấy chứng nhận</span>
                                    <span className="block text-lg font-medium">
                                        {facility.is_certified ? (
                                            <span className="text-green-600 flex items-center gap-1">
                                                Đã cấp ({facility.certificate_number}) - HH: {facility.certificate_expiry ? new Date(facility.certificate_expiry).toLocaleDateString("vi-VN") : "N/A"}
                                            </span>
                                        ) : (
                                            <span className="text-amber-600">Chưa cấp</span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Danh sách các lần kiểm tra</h3>

                        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                            <SheetTrigger asChild>
                                <Button className="shadow-md hover:shadow-lg transition-all">
                                    <Plus className="mr-2 h-4 w-4" /> Thêm lượt kiểm tra
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="overflow-y-auto">
                                <SheetHeader>
                                    <SheetTitle>Thêm kết quả kiểm tra</SheetTitle>
                                    <CardDescription>Nhập thông tin đợt kiểm tra mới cho cơ sở này.</CardDescription>
                                </SheetHeader>
                                <div className="py-6">
                                    <InspectionForm
                                        onSubmit={async (val) => await mutation.mutateAsync(val)}
                                        loading={mutation.isPending}
                                    />
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    {loadingInspections ? (
                        <div className="flex justify-center p-8 text-muted-foreground">Đang tải lịch sử...</div>
                    ) : (
                        <div className="bg-card rounded-lg border shadow-sm p-1">
                            <InspectionList inspections={inspections} />
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </PageTransition>
    )
}
