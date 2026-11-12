# DriverOS – UI (Vite + React + TypeScript)

Webapp mobile cho lái xe bồn chở xăng dầu, giao diện theo phong cách iOS (Apple HIG). Dữ liệu mock, lưu trong `localStorage`.

## Chạy

```bash
npm install
npm run dev      # http://localhost:5173
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
| `src/data/mock.ts` | Toàn bộ dữ liệu mock và các ngưỡng nghiệp vụ |
| `src/lib/domain.ts` | Logic: phân loại đi sớm/muộn, KPI, hao hụt, lương dự kiến |

Đồng hồ trong app là giả lập (12/11/2026, bắt đầu 09:12) — xem `src/lib/clock.ts`.
