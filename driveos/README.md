# DriverOS – UI (Vite + React + TypeScript)

Webapp mobile cho lái xe bồn chở xăng dầu, giao diện theo phong cách iOS (Apple HIG). Dữ liệu lưu trên **Supabase** (Postgres + Auth + RLS).

## Cài đặt Supabase (một lần)

1. Mở Supabase Dashboard → **SQL Editor** → dán toàn bộ nội dung một trong hai file rồi **Run**:
   - `supabase/setup.sql`: cài mới hoặc nâng cấp, **giữ** dữ liệu đang có. Chạy lại nhiều lần được.
   - `supabase/reset.sql`: **xóa sạch** bảng/hàm DriverOS rồi cài lại kèm dữ liệu mẫu — dùng khi lỡ chạy SQL sai thứ tự hoặc thiếu bước. Tài khoản đăng nhập được giữ.
2. Tạo file `.env.local` từ `.env.example` với URL và publishable key của project.
3. Triển khai Edge Function `supabase/functions/admin-users` và tắt tự đăng ký — xem `../admin/README.md`. Tài khoản lái xe do nhân sự cấp trong app quản trị; lái xe đăng nhập bằng email hoặc mã nhân viên.

Khi lái xe đăng nhập lần đầu, hàm `seed_demo_data()` liên kết với hồ sơ nhân sự đã tạo cùng email; nếu không có thì tạo một bộ dữ liệu mẫu riêng. File SQL cũng tạo sẵn 7 lái xe mẫu cho app quản trị (`../admin`).

Phân quyền (RLS + trigger): lái xe chỉ thấy dữ liệu của mình, chỉ sửa được phần việc của mình (trạng thái chuyến, lượng nạp/xả, checklist…), không tự duyệt chi phí hay giải trình. Nhân viên back-office có vai trò trong bảng `staff` (quản trị, điều phối, kế toán, nhân sự).

Sửa dữ liệu mẫu: chỉnh `src/data/demo.ts` → `npm run db:seed` để sinh lại `supabase/seed.sql` và `supabase/setup.sql` → chạy lại `setup.sql`.

## Chạy

```bash
npm install
npm run dev      # http://localhost:5175
npm run build    # kiểm tra kiểu + build ra dist/
```

Trên máy tính, app hiển thị trong khung iPhone; trên điện thoại hiển thị toàn màn hình (hỗ trợ safe-area, thêm vào màn hình chính).

## Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `src/styles/ios.css` | Design system iOS: màu hệ thống sáng/tối, navigation bar tiêu đề lớn, tab bar, grouped list, segmented control, switch, sheet, alert, banner |
| `src/ui/` | Component dùng chung (`Screen`, `Group`, `Cell`, `Segmented`, `Switch`, `Pill`, `Ring`…), overlay (toast, alert, sheet), khung thiết bị + tab bar |
| `src/pages/` | Hôm nay, Công việc (+ chi tiết chuyến), Chấm công & KPI, Tài chính, Học tập (+ khóa học), Cá nhân |
| `src/sheets/` | Form dạng sheet: chi phí, tạm ứng, nghỉ phép, giải trình, khiếu nại KPI, từ chối chuyến, nạp/xả hàng (OTP / chữ ký / ảnh phiếu), kiểm tra xe, báo sự cố, SOS, bài học, bài kiểm tra |
| `src/data/config.ts` | Ngưỡng và định mức nghiệp vụ, checklist xe, danh mục chi phí |
| `src/data/demo.ts` | Bộ dữ liệu mẫu — chỉ dùng để sinh SQL seed |
| `src/lib/api.ts` | Đọc toàn bộ dữ liệu từ Supabase và đồng bộ phần thay đổi (so sánh trạng thái trước/sau mỗi thao tác) |
| `supabase/` | `schema.sql` (bảng, RLS, trigger), `seed.sql` (sinh tự động), `setup.sql` (= hai file trên, để dán vào SQL Editor) |
| `src/lib/domain.ts` | Logic: phân loại đi sớm/muộn, KPI, hao hụt, lương dự kiến |

Đồng hồ trong app là giả lập (12/11/2026, bắt đầu 09:12) — xem `src/lib/clock.ts`.
