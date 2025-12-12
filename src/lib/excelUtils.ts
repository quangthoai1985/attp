import * as XLSX from 'xlsx'
import { supabase, Database } from './supabase'

type FacilityInsert = Database['public']['Tables']['facilities']['Insert']

// Excel column headers for the template
export const FACILITY_COLUMNS = [
    { key: 'name', header: 'Tên cơ sở (*)', required: true },
    { key: 'owner_name', header: 'Chủ cơ sở', required: false },
    { key: 'address', header: 'Địa chỉ', required: false },
    { key: 'type', header: 'Loại hình (*)', required: true },
    { key: 'province_code', header: 'Cấp quản lý (*)', required: true },
    { key: 'status', header: 'Trạng thái', required: false },
    { key: 'is_certified', header: 'Đã cấp GCN', required: false },
    { key: 'certificate_number', header: 'Số GCN', required: false },
    { key: 'certificate_date', header: 'Ngày cấp GCN', required: false },
    { key: 'certificate_expiry', header: 'Ngày hết hạn GCN', required: false },
    { key: 'latitude', header: 'Vĩ độ', required: false },
    { key: 'longitude', header: 'Kinh độ', required: false },
]

export interface ParsedFacility {
    data: Partial<FacilityInsert>
    rowIndex: number
    errors: string[]
    isValid: boolean
}

export interface ParseResult {
    facilities: ParsedFacility[]
    totalRows: number
    validRows: number
    invalidRows: number
}

// Helper to convert Excel date serial number to Date
function excelDateToJSDate(serial: number): Date {
    const utc_days = Math.floor(serial - 25569)
    const utc_value = utc_days * 86400
    return new Date(utc_value * 1000)
}

// Helper to parse date from various formats
function parseDate(value: unknown): string | null {
    if (!value) return null

    // If it's a number (Excel date serial)
    if (typeof value === 'number') {
        const date = excelDateToJSDate(value)
        return date.toISOString().split('T')[0]
    }

    // If it's already a Date object
    if (value instanceof Date) {
        return value.toISOString().split('T')[0]
    }

    // If it's a string, try to parse DD/MM/YYYY format
    if (typeof value === 'string') {
        const trimmed = value.trim()

        // Try DD/MM/YYYY format
        const ddmmyyyy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
        if (ddmmyyyy) {
            const [, day, month, year] = ddmmyyyy
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        }

        // Try YYYY-MM-DD format
        const yyyymmdd = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
        if (yyyymmdd) {
            return trimmed
        }

        // Try to parse as Date
        const parsed = new Date(trimmed)
        if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split('T')[0]
        }
    }

    return null
}

// Helper to parse boolean values
function parseBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value === 1
    if (typeof value === 'string') {
        const lower = value.toLowerCase().trim()
        return ['true', '1', 'có', 'yes', 'x'].includes(lower)
    }
    return false
}

// Helper to parse number
function parseNumber(value: unknown): number | null {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
        const parsed = parseFloat(value.replace(',', '.'))
        return isNaN(parsed) ? null : parsed
    }
    return null
}

// Validate a single facility row
function validateFacilityRow(
    row: Record<string, unknown>,
    rowIndex: number,
    validTypes: string[]
): ParsedFacility {
    const errors: string[] = []
    const data: Partial<FacilityInsert> = {}

    // Parse name (required)
    const name = row['Tên cơ sở (*)'] || row['Tên cơ sở']
    if (!name || String(name).trim() === '') {
        errors.push('Tên cơ sở là bắt buộc')
    } else {
        data.name = String(name).trim()
    }

    // Parse owner_name
    const ownerName = row['Chủ cơ sở']
    if (ownerName) {
        data.owner_name = String(ownerName).trim()
    }

    // Parse address
    const address = row['Địa chỉ']
    if (address) {
        data.address = String(address).trim()
    }

    // Parse type (required)
    const type = row['Loại hình (*)'] || row['Loại hình']
    if (!type || String(type).trim() === '') {
        errors.push('Loại hình là bắt buộc')
    } else {
        const typeStr = String(type).trim()
        if (validTypes.length > 0 && !validTypes.includes(typeStr)) {
            errors.push(`Loại hình "${typeStr}" không hợp lệ. Các giá trị hợp lệ: ${validTypes.join(', ')}`)
        } else {
            data.type = typeStr
        }
    }

    // Parse province_code (required)
    const provinceCode = row['Cấp quản lý (*)'] || row['Cấp quản lý']
    if (!provinceCode || String(provinceCode).trim() === '') {
        errors.push('Cấp quản lý là bắt buộc')
    } else {
        const codeStr = String(provinceCode).toLowerCase().trim()
        if (!['tinh', 'huyen', 'tỉnh', 'huyện'].includes(codeStr)) {
            errors.push('Cấp quản lý phải là "tinh" hoặc "huyen"')
        } else {
            data.province_code = codeStr === 'tỉnh' ? 'tinh' : codeStr === 'huyện' ? 'huyen' : codeStr
        }
    }

    // Parse status
    const status = row['Trạng thái']
    if (status) {
        const statusStr = String(status).toLowerCase().trim()
        const statusMap: Record<string, 'active' | 'inactive' | 'suspended'> = {
            'active': 'active',
            'hoạt động': 'active',
            'inactive': 'inactive',
            'ngừng hoạt động': 'inactive',
            'ngừng': 'inactive',
            'suspended': 'suspended',
            'tạm đình chỉ': 'suspended',
            'đình chỉ': 'suspended',
        }
        data.status = statusMap[statusStr] || 'active'
    } else {
        data.status = 'active'
    }

    // Parse is_certified
    const isCertified = row['Đã cấp GCN']
    data.is_certified = parseBoolean(isCertified)

    // Parse certificate_number
    const certNumber = row['Số GCN']
    if (certNumber) {
        data.certificate_number = String(certNumber).trim()
    }

    // Parse certificate_date
    const certDate = row['Ngày cấp GCN']
    if (certDate) {
        const parsed = parseDate(certDate)
        if (parsed) {
            data.certificate_date = parsed
        } else {
            errors.push('Ngày cấp GCN không đúng định dạng (sử dụng DD/MM/YYYY)')
        }
    }

    // Parse certificate_expiry
    const certExpiry = row['Ngày hết hạn GCN']
    if (certExpiry) {
        const parsed = parseDate(certExpiry)
        if (parsed) {
            data.certificate_expiry = parsed
        } else {
            errors.push('Ngày hết hạn GCN không đúng định dạng (sử dụng DD/MM/YYYY)')
        }
    }

    // Parse latitude
    const latitude = row['Vĩ độ']
    if (latitude) {
        const parsed = parseNumber(latitude)
        if (parsed !== null && parsed >= -90 && parsed <= 90) {
            data.latitude = parsed
        } else if (parsed !== null) {
            errors.push('Vĩ độ phải trong khoảng -90 đến 90')
        }
    }

    // Parse longitude
    const longitude = row['Kinh độ']
    if (longitude) {
        const parsed = parseNumber(longitude)
        if (parsed !== null && parsed >= -180 && parsed <= 180) {
            data.longitude = parsed
        } else if (parsed !== null) {
            errors.push('Kinh độ phải trong khoảng -180 đến 180')
        }
    }

    return {
        data,
        rowIndex,
        errors,
        isValid: errors.length === 0,
    }
}

// Generate Excel template with facility types from database
export async function generateFacilityTemplate(): Promise<void> {
    // Fetch facility types from database
    const { data: facilityTypes } = await supabase
        .from('facility_types')
        .select('name')
        .eq('is_active', true)
        .order('name')

    const typeNames = (facilityTypes as { name: string }[] | null)?.map(t => t.name) || []

    // Create workbook
    const wb = XLSX.utils.book_new()

    // Sheet 1: Data template
    const headers = FACILITY_COLUMNS.map(col => col.header)
    const sampleRow = [
        'Quán ăn ABC',           // Tên cơ sở
        'Nguyễn Văn A',          // Chủ cơ sở
        '123 Đường XYZ, Phường ABC', // Địa chỉ
        typeNames[0] || 'Dịch vụ ăn uống', // Loại hình
        'huyen',                 // Cấp quản lý
        'active',                // Trạng thái
        'true',                  // Đã cấp GCN
        'GCN-001',              // Số GCN
        '01/01/2024',           // Ngày cấp GCN
        '01/01/2027',           // Ngày hết hạn GCN
        '',                      // Vĩ độ
        '',                      // Kinh độ
    ]

    const dataSheet = XLSX.utils.aoa_to_sheet([headers, sampleRow])

    // Set column widths
    dataSheet['!cols'] = [
        { wch: 30 }, // Tên cơ sở
        { wch: 20 }, // Chủ cơ sở
        { wch: 40 }, // Địa chỉ
        { wch: 25 }, // Loại hình
        { wch: 15 }, // Cấp quản lý
        { wch: 15 }, // Trạng thái
        { wch: 12 }, // Đã cấp GCN
        { wch: 15 }, // Số GCN
        { wch: 15 }, // Ngày cấp GCN
        { wch: 18 }, // Ngày hết hạn GCN
        { wch: 12 }, // Vĩ độ
        { wch: 12 }, // Kinh độ
    ]

    XLSX.utils.book_append_sheet(wb, dataSheet, 'DỮ LIỆU IMPORT')

    // Sheet 2: Instructions
    const instructions = [
        ['HƯỚNG DẪN NHẬP LIỆU'],
        [''],
        ['1. CÁC CỘT BẮT BUỘC (đánh dấu *)'],
        ['   - Tên cơ sở (*): Không được để trống'],
        ['   - Loại hình (*): Phải là một trong các giá trị trong sheet "DANH SÁCH LOẠI HÌNH"'],
        ['   - Cấp quản lý (*): Phải là "tinh" hoặc "huyen"'],
        [''],
        ['2. ĐỊNH DẠNG DỮ LIỆU'],
        ['   - Ngày tháng: DD/MM/YYYY (ví dụ: 31/12/2024)'],
        ['   - Đã cấp GCN: true hoặc false (hoặc 1/0, có/không)'],
        ['   - Vĩ độ/Kinh độ: Số thập phân (ví dụ: 10.123456)'],
        [''],
        ['3. GIÁ TRỊ HỢP LỆ'],
        ['   - Trạng thái:'],
        ['     + active: Hoạt động'],
        ['     + inactive: Ngừng hoạt động'],
        ['     + suspended: Tạm đình chỉ'],
        [''],
        ['   - Cấp quản lý:'],
        ['     + tinh: Cấp Tỉnh'],
        ['     + huyen: Cấp Huyện'],
        [''],
        ['4. LƯU Ý'],
        ['   - Các cột không bắt buộc có thể để trống'],
        ['   - Xóa dòng dữ liệu mẫu trước khi nhập liệu thực'],
        ['   - Không thay đổi tên các cột tiêu đề'],
    ]

    const instructionSheet = XLSX.utils.aoa_to_sheet(instructions)
    instructionSheet['!cols'] = [{ wch: 80 }]
    XLSX.utils.book_append_sheet(wb, instructionSheet, 'HƯỚNG DẪN')

    // Sheet 3: Facility Types
    const typesData = [
        ['DANH SÁCH LOẠI HÌNH'],
        [''],
        ...typeNames.map(name => [name])
    ]

    const typesSheet = XLSX.utils.aoa_to_sheet(typesData)
    typesSheet['!cols'] = [{ wch: 40 }]
    XLSX.utils.book_append_sheet(wb, typesSheet, 'DANH SÁCH LOẠI HÌNH')

    // Generate and download file
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const fileName = `mau_import_coso_${timestamp}.xlsx`
    XLSX.writeFile(wb, fileName)
}

// Parse Excel file and validate data
export async function parseFacilityExcel(file: File): Promise<ParseResult> {
    // Fetch valid facility types
    const { data: facilityTypes } = await supabase
        .from('facility_types')
        .select('name')
        .eq('is_active', true)

    const validTypes = (facilityTypes as { name: string }[] | null)?.map(t => t.name) || []

    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (e) => {
            try {
                const data = e.target?.result
                const workbook = XLSX.read(data, { type: 'binary' })

                // Get the first sheet (data sheet)
                const sheetName = workbook.SheetNames[0]
                const sheet = workbook.Sheets[sheetName]

                // Convert to JSON
                const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)

                // Parse and validate each row
                const facilities: ParsedFacility[] = rows.map((row, index) =>
                    validateFacilityRow(row, index + 2, validTypes) // +2 because Excel rows are 1-indexed and we skip header
                )

                const validFacilities = facilities.filter(f => f.isValid)
                const invalidFacilities = facilities.filter(f => !f.isValid)

                resolve({
                    facilities,
                    totalRows: facilities.length,
                    validRows: validFacilities.length,
                    invalidRows: invalidFacilities.length,
                })
            } catch (error) {
                reject(new Error('Không thể đọc file Excel. Vui lòng kiểm tra định dạng file.'))
            }
        }

        reader.onerror = () => {
            reject(new Error('Lỗi khi đọc file'))
        }

        reader.readAsBinaryString(file)
    })
}

// Import facilities to database
export async function importFacilitiesToDB(
    facilities: ParsedFacility[]
): Promise<{ success: number; failed: number; errors: string[] }> {
    const validFacilities = facilities.filter(f => f.isValid)
    const errors: string[] = []
    let success = 0
    let failed = 0

    for (const facility of validFacilities) {
        const insertData = facility.data as FacilityInsert

        const { error } = await supabase
            .from('facilities')
            .insert(insertData as never)

        if (error) {
            failed++
            errors.push(`Dòng ${facility.rowIndex}: ${error.message}`)
        } else {
            success++
        }
    }

    return { success, failed, errors }
}
