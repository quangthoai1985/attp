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
import { Switch } from "@/components/ui/switch"
import { inspectionSchema, InspectionFormValues, TEAM_TYPE_LABELS, RESULT_LABELS } from "@/schemas/inspection"

interface InspectionFormProps {
    onSubmit: (data: InspectionFormValues) => Promise<void>
    loading?: boolean
    onCancel?: () => void
    defaultValues?: Partial<InspectionFormValues>
}

export function InspectionForm({ onSubmit, loading, onCancel, defaultValues }: InspectionFormProps) {
    const form = useForm<InspectionFormValues>({
        resolver: zodResolver(inspectionSchema),
        defaultValues: {
            inspection_date: defaultValues?.inspection_date || new Date().toISOString().split('T')[0],
            year: defaultValues?.year || new Date().getFullYear(),
            team_type: defaultValues?.team_type || "chuyen_nganh",
            result: defaultValues?.result || "dat",
            remediation_deadline: defaultValues?.remediation_deadline || null,
            has_penalty: defaultValues?.has_penalty || false,
            penalty_amount: defaultValues?.penalty_amount || null,
            penalty_agency: defaultValues?.penalty_agency || null,
            sanction_type: defaultValues?.sanction_type || null,
            notes: defaultValues?.notes || null,
        },
    })

    const watchResult = form.watch("result")
    const watchHasPenalty = form.watch("has_penalty")

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Ngày kiểm tra */}
                <FormField
                    control={form.control}
                    name="inspection_date"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ngày kiểm tra *</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Đoàn kiểm tra */}
                <FormField
                    control={form.control}
                    name="team_type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Đoàn kiểm tra *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn loại đoàn kiểm tra" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {Object.entries(TEAM_TYPE_LABELS).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Kết quả */}
                <FormField
                    control={form.control}
                    name="result"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Kết quả kiểm tra *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn kết quả" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="dat">{RESULT_LABELS.dat}</SelectItem>
                                    <SelectItem value="cho_khac_phuc">{RESULT_LABELS.cho_khac_phuc}</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Thời hạn khắc phục - chỉ hiển thị khi result = cho_khac_phuc */}
                {watchResult === "cho_khac_phuc" && (
                    <FormField
                        control={form.control}
                        name="remediation_deadline"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Thời hạn khắc phục *</FormLabel>
                                <FormControl>
                                    <Input
                                        type="date"
                                        {...field}
                                        value={field.value || ""}
                                        onChange={(e) => field.onChange(e.target.value || null)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {/* Toggle Xử phạt */}
                <div className="border rounded-lg p-4 space-y-4">
                    <FormField
                        control={form.control}
                        name="has_penalty"
                        render={({ field }) => (
                            <FormItem className="flex items-center justify-between">
                                <FormLabel className="cursor-pointer">Có xử phạt</FormLabel>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    {/* Các trường xử phạt - chỉ hiển thị khi has_penalty = true */}
                    {watchHasPenalty && (
                        <div className="space-y-4 pt-2 border-t">
                            <FormField
                                control={form.control}
                                name="penalty_amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Số tiền xử phạt (VNĐ) *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="VD: 5000000"
                                                {...field}
                                                value={field.value || ""}
                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="penalty_agency"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cơ quan xử phạt</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="VD: Chi cục ATVSTP"
                                                {...field}
                                                value={field.value || ""}
                                                onChange={(e) => field.onChange(e.target.value || null)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="sanction_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Hình thức chế tài</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="VD: Phạt tiền, đình chỉ hoạt động..."
                                                {...field}
                                                value={field.value || ""}
                                                onChange={(e) => field.onChange(e.target.value || null)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )}
                </div>

                {/* Ghi chú */}
                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ghi chú</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Ghi chú thêm về kết quả kiểm tra..."
                                    {...field}
                                    value={field.value || ""}
                                    onChange={(e) => field.onChange(e.target.value || null)}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Buttons */}
                <div className="flex justify-end gap-2 pt-4">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Hủy
                        </Button>
                    )}
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Lưu kết quả
                    </Button>
                </div>
            </form>
        </Form>
    )
}
