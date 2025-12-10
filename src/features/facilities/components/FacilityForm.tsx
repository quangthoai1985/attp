import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { facilitySchema, FacilityFormValues } from "@/schemas/facility"
import { supabase, Database } from "@/lib/supabase"

type FacilityType = Database['public']['Tables']['facility_types']['Row']

interface FacilityFormProps {
    defaultValues?: Partial<FacilityFormValues>
    onSubmit: (data: FacilityFormValues) => Promise<void>
    loading?: boolean
}

const MANAGEMENT_LEVELS = [
    { code: "tinh", name: "Cấp Tỉnh" },
    { code: "huyen", name: "Cấp Huyện" },
]

export function FacilityForm({ defaultValues, onSubmit, loading }: FacilityFormProps) {
    // Fetch facility types from database
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
        },
    })

    const form = useForm<FacilityFormValues>({
        resolver: zodResolver(facilitySchema),
        defaultValues: {
            name: "",
            owner_name: "",
            address: "",
            type: "",
            province_code: "",
            status: "active",
            ...defaultValues,
        },
    })

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tên cơ sở *</FormLabel>
                            <FormControl>
                                <Input placeholder="Nhập tên cơ sở..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="owner_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Chủ cơ sở</FormLabel>
                            <FormControl>
                                <Input placeholder="Tên chủ cơ sở..." {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Địa chỉ</FormLabel>
                            <FormControl>
                                <Input placeholder="Địa chỉ chi tiết..." {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Loại hình *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn loại hình" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {facilityTypes.map((type) => (
                                            <SelectItem key={type.id} value={type.name}>
                                                {type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="province_code"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cấp quản lý *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn cấp quản lý" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {MANAGEMENT_LEVELS.map((level) => (
                                            <SelectItem key={level.code} value={level.code}>
                                                {level.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Trạng thái</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Trạng thái" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="active">Hoạt động</SelectItem>
                                    <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                                    <SelectItem value="suspended">Tạm đình chỉ</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Lưu thông tin
                    </Button>
                </div>
            </form>
        </Form>
    )
}

