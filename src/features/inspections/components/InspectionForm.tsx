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
import { Textarea } from "@/components/ui/textarea"
import { inspectionSchema, InspectionFormValues } from "@/schemas/inspection"

interface InspectionFormProps {
    onSubmit: (data: InspectionFormValues) => Promise<void>
    loading?: boolean
}

export function InspectionForm({ onSubmit, loading }: InspectionFormProps) {
    const form = useForm<InspectionFormValues>({
        resolver: zodResolver(inspectionSchema),
        defaultValues: {
            inspection_date: new Date().toISOString().split('T')[0],
            year: new Date().getFullYear(),
            batch: "",
            result: "pending",
            notes: "",
        },
    })

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="inspection_date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ngày kiểm tra</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="year"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Năm</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="batch"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Đợt kiểm tra</FormLabel>
                            <FormControl>
                                <Input placeholder="VD: Tết Nguyên Đán, Tháng ATTP..." {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="result"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Kết quả</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn kết quả" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="passed">Đạt</SelectItem>
                                    <SelectItem value="failed">Không đạt / Xử phạt</SelectItem>
                                    <SelectItem value="pending">Chờ xử lý</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ghi chú</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Ghi chú chi tiết..." {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Lưu kết quả
                    </Button>
                </div>
            </form>
        </Form>
    )
}
