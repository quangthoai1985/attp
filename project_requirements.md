# PROJECT CONTEXT: Hệ thống Quản lý ATTP

## 1. Tech Stack
- Frontend: React (Vite) + TypeScript + TailwindCSS.
- UI: ShadCN UI + Lucide React.
- State: TanStack Query (React Query).
- Backend: Supabase (PostgreSQL).

## 2. DATABASE SCHEMA (Đã khởi tạo trên Supabase)
Dưới đây là cấu trúc hiện tại, AI cần tuân thủ tuyệt đối tên bảng và tên cột này:

### A. Table `profiles` (Thông tin cán bộ)
- id (uuid, PK): Link với auth.users
- full_name (text)
- role (enum: 'admin', 'staff')
- managed_area (text): Mã xã/phường quản lý (Dùng cho RLS)

### B. Table `facilities` (Cơ sở)
- id (uuid, PK)
- name, address, phone, owner_name (text)
- type (text): Loại hình
- management_level (enum: 'tinh', 'xa')
- province_code (text): Mã định danh xã
- is_certified (bool): Đã cấp GCN chưa
- certificate_number (text), certificate_date (date), certificate_expiry (date)
- status (enum: 'active', 'inactive', 'closed')

### C. Table `inspections` (Lịch sử kiểm tra)
- id (uuid, PK)
- facility_id (uuid, FK): Link tới facilities
- inspection_date (date)
- year (int): Cột tự động sinh từ ngày kiểm tra
- team_type (enum: 'chuyen_nganh', 'lien_nganh')
- result (enum: 'dat', 'khong_dat', 'xu_phat')
- notes (text)

## 3. Quy tắc Code
- Luôn sử dụng file `src/lib/database.types.ts` để type-safe.
- Sử dụng ShadCN Table cho các danh sách.
- Sử dụng React Hook Form + Zod để validate form nhập liệu.