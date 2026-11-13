# DriverOS · Điều hành (app quản trị)

Web back-office cho điều phối, kế toán, nhân sự quản lý đội xe bồn. Vite + React + TypeScript, dữ liệu trên cùng project Supabase với app lái xe (`../driveos`). Giao diện desktop theo phong cách macOS, có chế độ tối, thu gọn được trên màn hình nhỏ.

## Chạy

```bash
npm install
npm run dev      # http://localhost:5174
npm run build
```

`.env.local` dùng chung URL và publishable key với app lái xe (xem `.env.example`).

## Cài đặt lần đầu

Không có tự đăng ký: quản trị viên tạo tài khoản, hệ thống sinh mật khẩu.

1. **Database** — Supabase → SQL Editor → chạy `../driveos/supabase/reset.sql` (cài sạch, có dữ liệu mẫu 7 lái xe) hoặc `setup.sql` (nâng cấp, giữ dữ liệu). Cảnh báo RLS là báo nhầm → chọn *Run without RLS*.
2. **Edge Function `admin-users`** (tạo tài khoản, sinh/đặt lại mật khẩu, khóa tài khoản — giữ khóa service role ở phía server):
   - Dashboard → **Edge Functions → Deploy a new function → Via Editor**, đặt tên đúng `admin-users`, dán toàn bộ `../driveos/supabase/functions/admin-users/index.ts` → **Deploy**.
   - Hoặc dùng CLI: `npx supabase login` rồi `npx supabase functions deploy admin-users --project-ref ctlssnsgxqkddziwtcee` (chạy trong thư mục `driveos`).
   - Nếu app báo lỗi 401 khi gọi function: vào trang function → *Details* → tắt **Verify JWT with legacy secret** (function tự kiểm tra phiên đăng nhập).
3. **Tắt tự đăng ký** — Authentication → **Sign In / Providers** → tắt *Allow new users to sign up*. Không ảnh hưởng việc quản trị viên tạo tài khoản.
4. **Quản trị viên đầu tiên** — Authentication → **Users → Add user → Create new user**: nhập email + mật khẩu, bật *Auto Confirm User*. Rồi chạy trong SQL Editor:

```sql
insert into public.staff (user_id, full_name, email, role)
select id, coalesce(raw_user_meta_data->>'full_name', email), email, 'admin'
from auth.users where email = 'ban@congty.vn'
on conflict (user_id) do update set role = 'admin';
```

Từ đó mọi tài khoản khác tạo trong app:
- **Nhân viên & phân quyền → Thêm nhân viên**: nhập tên, email, vai trò → hiện mật khẩu sinh tự động (chỉ hiện một lần).
- **Lái xe → Thêm lái xe** (bật “Tạo tài khoản đăng nhập app”) hoặc trang chi tiết lái xe → **Cấp tài khoản**. Lái xe không có email đăng nhập bằng **mã nhân viên** (vd `TX-0131`).
- Đặt lại mật khẩu, khóa/mở khóa ở cùng các trang đó. Người dùng tự đổi mật khẩu trong app (biểu tượng chìa khóa ở góc dưới sidebar; app lái xe: Cá nhân → Đổi mật khẩu).

## Vai trò

| Vai trò | Được làm |
|---|---|
| Quản trị | Toàn quyền, phân quyền nhân viên |
| Điều phối | Tạo lệnh chuyến, phân công lại, hủy lệnh |
| Kế toán | Duyệt/từ chối chi phí, duyệt chi tạm ứng |
| Nhân sự | Hồ sơ lái xe & xe, giấy tờ, duyệt giải trình chấm công, soạn khóa học |

Mọi nhân viên đều xem được toàn bộ dữ liệu và xử lý được yêu cầu. Quyền được thực thi bằng RLS + trigger trong Postgres, không chỉ ẩn nút trên giao diện.

## Màn hình

| Màn | Nội dung |
|---|---|
| Tổng quan | Chuyến hôm nay, lái xe vào ca/đi muộn, tiền chờ duyệt, SOS, hao hụt vượt ngưỡng, giấy tờ sắp hết hạn, danh sách việc cần xử lý, hiệu suất tháng theo lái xe. Cập nhật realtime. |
| Chuyến & phân công | Lọc theo ngày/trạng thái, tạo lệnh (hàng theo từng khoang của xe hoặc thùng/phuy, phụ cấp tự tính theo km), xem nạp–xả–hao hụt, checklist, phân công lại chuyến bị từ chối, hủy lệnh. Server chặn giao chuyến cho lái xe có giấy tờ hết hạn. |
| Lái xe | Danh sách + hiệu suất tháng, tạo hồ sơ kèm tài khoản app; chi tiết: cấp/đặt lại/khóa tài khoản, sửa hồ sơ & xe, giấy tờ, lịch sử chuyến, chấm công, chi phí. |
| Chấm công | Bảng tháng cả đội (sớm / đúng giờ / muộn / về sớm / vắng), duyệt hoặc từ chối giải trình. |
| Chi phí & tạm ứng | Hàng chờ duyệt có cảnh báo (không hóa đơn, vượt định mức ăn uống), duyệt hàng loạt, từ chối kèm lý do, duyệt chi tạm ứng. |
| Đào tạo | Soạn khóa học, bài học, câu hỏi kiểm tra; ma trận tiến độ lái xe × khóa học. |
| Yêu cầu & sự cố | SOS, sự cố, nghỉ phép, khiếu nại KPI, gia hạn giấy tờ: tiếp nhận → hoàn tất/từ chối kèm phản hồi (lái xe thấy trong app). |
| Nhân viên & phân quyền | Tạo tài khoản nhân viên (sinh mật khẩu), đổi vai trò, đặt lại mật khẩu, khóa/mở khóa, gỡ quyền. |

“Hôm nay” cố định là 12/11/2026 cho khớp dữ liệu mẫu (`src/lib/format.ts`).
