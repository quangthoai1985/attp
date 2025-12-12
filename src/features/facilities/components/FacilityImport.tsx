import { useState, useRef, useCallback } from 'react'
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, X, Loader2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import {
    generateFacilityTemplate,
    parseFacilityExcel,
    importFacilitiesToDB,
    ParseResult,
    ParsedFacility,
} from '@/lib/excelUtils'

interface FacilityImportProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function FacilityImport({ open, onOpenChange }: FacilityImportProps) {
    const queryClient = useQueryClient()
    const { toast } = useToast()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [isGenerating, setIsGenerating] = useState(false)
    const [isParsing, setIsParsing] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [parseResult, setParseResult] = useState<ParseResult | null>(null)
    const [dragActive, setDragActive] = useState(false)

    // Handle download template
    const handleDownloadTemplate = async () => {
        setIsGenerating(true)
        try {
            await generateFacilityTemplate()
            toast({
                title: 'Thành công',
                description: 'Đã tải file mẫu Excel',
            })
        } catch (error) {
            toast({
                title: 'Lỗi',
                description: 'Không thể tạo file mẫu',
                variant: 'destructive',
            })
        } finally {
            setIsGenerating(false)
        }
    }

    // Handle file selection
    const handleFileSelect = async (file: File) => {
        if (!file.name.match(/\.(xlsx|xls)$/i)) {
            toast({
                title: 'Lỗi',
                description: 'Vui lòng chọn file Excel (.xlsx hoặc .xls)',
                variant: 'destructive',
            })
            return
        }

        setSelectedFile(file)
        setIsParsing(true)

        try {
            const result = await parseFacilityExcel(file)
            setParseResult(result)

            if (result.invalidRows > 0) {
                toast({
                    title: 'Cảnh báo',
                    description: `Có ${result.invalidRows} dòng lỗi cần kiểm tra`,
                    variant: 'destructive',
                })
            }
        } catch (error) {
            toast({
                title: 'Lỗi',
                description: error instanceof Error ? error.message : 'Không thể đọc file',
                variant: 'destructive',
            })
            setParseResult(null)
        } finally {
            setIsParsing(false)
        }
    }

    // Handle file input change
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            handleFileSelect(file)
        }
    }

    // Handle drag events
    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }, [])

    // Handle drop
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        const file = e.dataTransfer.files?.[0]
        if (file) {
            handleFileSelect(file)
        }
    }, [])

    // Handle import
    const handleImport = async () => {
        if (!parseResult || parseResult.validRows === 0) return

        setIsImporting(true)
        try {
            const result = await importFacilitiesToDB(parseResult.facilities)

            if (result.success > 0) {
                toast({
                    title: 'Import thành công',
                    description: `Đã import ${result.success} cơ sở${result.failed > 0 ? `, ${result.failed} lỗi` : ''}`,
                })
                queryClient.invalidateQueries({ queryKey: ['facilities'] })
                handleReset()
                onOpenChange(false)
            } else {
                toast({
                    title: 'Import thất bại',
                    description: result.errors.join('. '),
                    variant: 'destructive',
                })
            }
        } catch (error) {
            toast({
                title: 'Lỗi',
                description: 'Đã xảy ra lỗi khi import dữ liệu',
                variant: 'destructive',
            })
        } finally {
            setIsImporting(false)
        }
    }

    // Reset state
    const handleReset = () => {
        setSelectedFile(null)
        setParseResult(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    // Get row status badge
    const getRowBadge = (facility: ParsedFacility) => {
        if (facility.isValid) {
            return (
                <Badge className="bg-emerald-500 hover:bg-emerald-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    OK
                </Badge>
            )
        }
        return (
            <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Lỗi
            </Badge>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-primary" />
                        Import cơ sở từ Excel
                    </DialogTitle>
                    <DialogDescription>
                        Tải file mẫu, nhập liệu, sau đó upload để import dữ liệu vào hệ thống
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Step 1: Download Template */}
                    <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm">
                                1
                            </span>
                            Tải file mẫu
                        </h4>
                        <p className="text-sm text-muted-foreground ml-8">
                            File mẫu sẽ có sẵn các cột cần thiết và hướng dẫn nhập liệu
                        </p>
                        <div className="ml-8">
                            <Button
                                variant="outline"
                                onClick={handleDownloadTemplate}
                                disabled={isGenerating}
                            >
                                {isGenerating ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Download className="h-4 w-4 mr-2" />
                                )}
                                Tải file mẫu Excel
                            </Button>
                        </div>
                    </div>

                    {/* Step 2: Upload File */}
                    <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm">
                                2
                            </span>
                            Upload file đã nhập liệu
                        </h4>

                        <div className="ml-8">
                            {/* Drop Zone */}
                            <div
                                className={`
                                    relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                                    ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
                                    ${isParsing ? 'opacity-50 pointer-events-none' : ''}
                                `}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileInputChange}
                                    className="hidden"
                                />

                                {isParsing ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                        <p className="text-sm text-muted-foreground">Đang xử lý file...</p>
                                    </div>
                                ) : selectedFile ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <FileSpreadsheet className="h-10 w-10 text-emerald-500" />
                                        <p className="font-medium">{selectedFile.name}</p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleReset()
                                            }}
                                        >
                                            <X className="h-4 w-4 mr-1" />
                                            Xóa file
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <Upload className="h-10 w-10 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">
                                            Kéo thả file Excel vào đây hoặc click để chọn file
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Chỉ chấp nhận file .xlsx và .xls
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Preview & Import */}
                    {parseResult && (
                        <div className="space-y-2">
                            <h4 className="font-medium flex items-center gap-2">
                                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm">
                                    3
                                </span>
                                Xem trước và Import
                            </h4>

                            {/* Summary */}
                            <div className="ml-8 flex gap-4 p-4 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Tổng số dòng:</span>
                                    <Badge variant="outline">{parseResult.totalRows}</Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Hợp lệ:</span>
                                    <Badge className="bg-emerald-500">{parseResult.validRows}</Badge>
                                </div>
                                {parseResult.invalidRows > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">Lỗi:</span>
                                        <Badge variant="destructive">{parseResult.invalidRows}</Badge>
                                    </div>
                                )}
                            </div>

                            {/* Preview Table */}
                            <div className="ml-8 border rounded-lg overflow-hidden">
                                <div className="max-h-[300px] overflow-y-auto">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-background">
                                            <TableRow>
                                                <TableHead className="w-[80px]">Dòng</TableHead>
                                                <TableHead className="w-[80px]">Trạng thái</TableHead>
                                                <TableHead>Tên cơ sở</TableHead>
                                                <TableHead>Loại hình</TableHead>
                                                <TableHead>Cấp QL</TableHead>
                                                <TableHead>Lỗi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {parseResult.facilities.map((facility) => (
                                                <TableRow
                                                    key={facility.rowIndex}
                                                    className={!facility.isValid ? 'bg-destructive/5' : ''}
                                                >
                                                    <TableCell className="font-mono text-sm">
                                                        {facility.rowIndex}
                                                    </TableCell>
                                                    <TableCell>{getRowBadge(facility)}</TableCell>
                                                    <TableCell className="font-medium">
                                                        {facility.data.name || '-'}
                                                    </TableCell>
                                                    <TableCell>{facility.data.type || '-'}</TableCell>
                                                    <TableCell>
                                                        {facility.data.province_code === 'tinh' ? 'Tỉnh' :
                                                            facility.data.province_code === 'huyen' ? 'Huyện' : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-destructive text-sm max-w-[300px]">
                                                        {facility.errors.join('. ')}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {/* Import Button */}
                            <div className="ml-8 flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => onOpenChange(false)}>
                                    Hủy
                                </Button>
                                <Button
                                    onClick={handleImport}
                                    disabled={parseResult.validRows === 0 || isImporting}
                                >
                                    {isImporting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Đang import...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-4 w-4 mr-2" />
                                            Import {parseResult.validRows} cơ sở
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
