import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

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

interface FacilityFormProps {
    defaultValues?: Partial<FacilityFormValues>
    onSubmit: (data: FacilityFormValues) => Promise<void>
    loading?: boolean
}

const FACILITY_TYPES = [
    "Nhà hàng",
    "Bếp ăn tập thể",
    "Cơ sở sản xuất",
    "Tạp hóa",
    "Quán ăn đường phố",
]

const PROVINCES = [
    { code: "AG", name: "An Giang (Tỉnh)" },
    { code: "LX", name: "Long Xuyên" },
    { code: "CD", name: "Châu Đốc" },
    // Fake data for now
]

export function FacilityForm({ defaultValues, onSubmit, loading }: FacilityFormProps) {
    const form = useForm<FacilityFormValues>({
        resolver: zodResolver(facilitySchema),
        defaultValues: {
            name: "",
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
                                        {FACILITY_TYPES.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {type}
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
                                <FormLabel>Địa bàn (Xã/Phường) *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn địa bàn" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {PROVINCES.map((prov) => (
                                            <SelectItem key={prov.code} value={prov.code}>
                                                {prov.name}
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
