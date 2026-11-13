# Prompt: Xây dựng DriverOS — webapp mobile cho lái xe bồn chở xăng dầu

## 1. Vai trò và mục tiêu

Bạn là kỹ sư frontend kiêm product designer. Hãy xây dựng **DriverOS**: một webapp chạy chủ yếu trên điện thoại, dành cho **nhân viên lái xe bồn chở xăng dầu**. Dùng **dữ liệu mock**, không có backend. Menu điều hướng nằm **phía dưới màn hình** (tab bar).

Người dùng là lái xe: thao tác một tay, ngoài trời, mạng yếu, mỗi lần mở app chỉ vài chục giây. Vì chở **hàng nguy hiểm**, các yêu cầu an toàn (giấy tờ, checklist xe, niêm phong) là **điều kiện chặn** chứ không chỉ để xem.

## 2. Yêu cầu kỹ thuật

- Vite + React + TypeScript (strict). React Router dùng `HashRouter`. Icon dùng `lucide-react`.
- Không dùng UI framework nặng; tự viết CSS với biến màu (CSS custom properties).
- Toàn bộ dữ liệu mock nằm trong một file riêng, có kiểu TypeScript rõ ràng.
- State toàn cục (Context hoặc store nhỏ), lưu vào `localStorage`, có nút "Đặt lại dữ liệu demo".
- Giao diện **tiếng Việt**. Tiền định dạng `vi-VN`, ví dụ `1.384.500 ₫`. Ngày dạng `dd/mm/yyyy`.
- Trên điện thoại: full màn hình, tôn trọng safe-area (tai thỏ, thanh home). Trên máy tính: hiển thị app trong khung iPhone khoảng 393×852 có status bar giả, đặt giữa màn hình.
- Dùng **đồng hồ giả lập**: hôm nay là Thứ Năm 12/11/2026, giờ bắt đầu 09:12 và chạy theo thời gian thực, để dữ liệu mock (đã vào ca, đang chở hàng, hẹn giao 10:30) luôn khớp nhau.
- `npm run build` phải chạy được, không có lỗi TypeScript hay lỗi console.

## 3. Phong cách giao diện: giống ứng dụng iOS

Bám theo Apple Human Interface Guidelines (không cần UIKit thật, chỉ cần giống về cảm giác):

- Màu hệ thống iOS (systemBlue `#007AFF`, green, red, orange…), nền nhóm `#F2F2F7`. Có **chế độ tối** đầy đủ theo màu dark của iOS; người dùng chọn Tự động / Sáng / Tối.
- Font hệ thống Apple (`-apple-system`, SF Pro), dự phòng Inter.
- Thanh điều hướng với **tiêu đề lớn (Large Title)** thu nhỏ thành tiêu đề giữa khi cuộn, nền mờ (blur) khi nội dung trượt bên dưới. Màn chi tiết có nút quay lại dạng chevron kèm tên màn trước.
- **Tab bar** phía dưới nền mờ, icon + nhãn nhỏ, tab đang chọn màu xanh, có badge đỏ số chuyến chờ nhận.
- Danh sách kiểu **Inset Grouped** (như app Cài đặt): ô bo góc, đường kẻ mảnh thụt lề, icon vuông bo góc có màu, chevron bên phải, tiêu đề nhóm chữ in hoa nhỏ màu xám, chú thích dưới nhóm.
- Segmented control, công tắc (switch) xanh lá, vòng tròn đánh dấu kiểu ứng dụng Lời nhắc.
- Form mở dạng **sheet trượt từ dưới lên**: có thanh kéo, nút "Hủy" bên trái và nút hành động (Gửi / Lưu / Xong) bên phải, nút hành động mờ khi chưa hợp lệ.
- Xác nhận dùng **hộp thoại kiểu iOS alert** (nút hủy chữ đậm, nút nguy hiểm chữ đỏ). Thông báo nhanh dạng banner nhỏ hiện ở trên cùng.
- Thẻ tóm tắt trên trang chủ theo kiểu ứng dụng **Sức khỏe (Health)**: dòng tiêu đề có icon màu, số lớn đậm, đơn vị nhỏ xám.

## 4. Điều hướng

Tab bar có 5 tab: **Hôm nay · Công việc · Chấm công · Tài chính · Học tập**. Trang **Cá nhân** (hồ sơ + công việc khác) mở bằng avatar tròn ở góc phải thanh điều hướng của mọi tab (iOS khuyến nghị tối đa 5 tab). Nút **SOS** màu đỏ luôn có ở trang Hôm nay.

## 5. Màn hình và chức năng

### 5.1 Hôm nay
- Thẻ chấm công: giờ vào ca, nhãn "Sớm X phút / Đúng giờ / Muộn X phút", thời gian đã làm cập nhật trực tiếp, vị trí "trong vùng cho phép", nút chấm công vào/ra ca (ra ca trước giờ kết thúc ca phải hỏi xác nhận vì sẽ tính về sớm).
- Thẻ chuyến hiện tại: điểm giao, thanh tiến độ 5 bước, giờ hẹn giao và "còn bao lâu / trễ bao lâu".
- 4 thẻ nhỏ: lít đã giao hôm nay, điểm KPI, thu nhập dự kiến tháng, giờ học tháng.
- Mục "Cần chú ý": chứng chỉ sắp hết hạn, khóa học bắt buộc sắp tới hạn, chưa kiểm tra xe, nhiệm vụ sắp đến hạn, sắp tới kỳ bảo dưỡng.
- Danh sách lịch chạy hôm nay và lối tắt (thêm chi phí, kiểm tra xe, báo sự cố, gọi điều độ).

### 5.2 Công việc
- Segmented: Hôm nay / Sắp tới / Lịch sử; dòng tổng: số chuyến · tổng lít · tổng km.
- Thẻ chuyến: mã chuyến, trạng thái, điểm lấy hàng → điểm giao, hàng hóa (vd "18.000 L · 5 khoang" hoặc "180 thùng/phuy"), giờ giao, km.
- **Chi tiết chuyến**: lộ trình (kho, điểm giao, người nhận có nút gọi, nút chỉ đường mở Google Maps), hàng hóa **theo từng khoang** (loại dầu, lượng theo lệnh, lượng thực nạp, lượng thực xả), checklist tại kho và tại điểm giao, thông tin xe / số chì niêm phong / phụ cấp chuyến / ghi chú. Nút hành động cố định phía dưới.
- Luồng trạng thái: **Chờ nhận → Đã nhận → Đang lấy hàng → Đang chạy → Đang xả hàng → Hoàn tất.**
  - Chờ nhận: nút "Nhận chuyến" và "Từ chối" (bắt buộc chọn lý do).
  - "Bắt đầu lấy hàng" bị **chặn** nếu checklist xe trước chuyến còn hạng mục bắt buộc chưa đạt; alert có nút "Kiểm tra ngay".
  - "Ghi nhận nạp & xuất bến" bị chặn nếu checklist tại kho chưa xong. Sheet nạp hàng: nhập lượng thực nạp từng khoang, số chì, nhiệt độ, chụp phiếu xuất (mock). Lệch so với lệnh **quá 0,5%** thì bắt buộc giải trình.
  - "Xả hàng & xác nhận": nhập lượng thực xả từng khoang, app tự tính **hao hụt** (lít và %), vượt **0,3%** thì bắt buộc giải trình. Người nhận xác nhận bằng một trong ba cách: mã OTP, **ký tay trên màn hình** (canvas), hoặc chụp phiếu giao.

### 5.3 Chấm công & KPI
- Segmented: Bảng công / KPI.
- Bảng công: thẻ chấm công; 4 số liệu (ngày công, đến sớm, đi muộn, về sớm); **lịch tháng kiểu ứng dụng Lịch iOS** với chấm màu dưới ngày (xanh lá: đến sớm, xanh dương: đúng giờ, đỏ: đi muộn, cam: về sớm), ngày hôm nay số đỏ; chạm một ngày xem giờ vào/ra, thời gian làm, ghi chú và nút "Gửi giải trình" cho ngày đi muộn / về sớm.
- KPI: vòng tròn điểm tổng, xếp loại, thưởng dự kiến, tiến độ tới mức thưởng tiếp theo; danh sách chỉ tiêu có trọng số, thanh tiến độ, **chạm vào để xem cách tính điểm**; biểu đồ cột 4 tháng; nút "Khiếu nại KPI".

### 5.4 Tài chính
- Segmented: Chi phí / Lương & tạm ứng. Nút "+" trên thanh điều hướng để thêm khoản chi.
- Chi phí: tổng tháng, thanh tỷ lệ theo loại + chú thích %, tổng chờ duyệt / đã duyệt, bộ lọc dạng viên thuốc theo loại, danh sách nhóm theo ngày (icon loại, nội dung, nơi chi, giờ, số tiền, trạng thái Chờ duyệt / Đã duyệt / Từ chối kèm lý do). Chạm khoản chờ duyệt có thể thu hồi.
- Loại chi phí: Nhiên liệu, Ăn uống, Cầu đường, Bến bãi, Sửa chữa, Khác.
- Sheet thêm chi phí: chọn loại dạng lưới ô; với **nhiên liệu** nhập số lít, đơn giá, số km đồng hồ và tự tính thành tiền; gắn với chuyến; chụp hóa đơn (mock); công tắc hóa đơn VAT.
- Lương: thẻ kiểu Wallet "Thực nhận dự kiến"; thu nhập (lương cơ bản, phụ cấp chuyến theo số chuyến hoàn tất, phụ cấp độc hại, thưởng KPI, hoàn chi phí đã duyệt); khấu trừ (bảo hiểm 10,5%, tạm ứng); danh sách tạm ứng và sheet "Xin tạm ứng".

### 5.5 Học tập
- Segmented: Khóa học / Chứng chỉ.
- Khóa học: vòng giờ học tháng (mục tiêu 8 giờ), nhóm Bắt buộc và Tự chọn, mỗi khóa có tiến độ và hạn.
- Chi tiết khóa: danh sách bài (video / bài đọc / kiểm tra, số phút, đã học). Bài video/đọc mở sheet có trình phát giả và nút "Đánh dấu đã học xong". **Bài kiểm tra** là quiz trắc nghiệm, đúng tối thiểu 2/3 câu mới đạt, hiển thị kết quả và đáp án đúng, cho làm lại.
- Chứng chỉ: tên, số, ngày hết hạn, nhãn "Còn X ngày" (đỏ khi ≤ 30 ngày, cam khi ≤ 60 ngày); nút đăng ký gia hạn.

### 5.6 Cá nhân & công việc khác
- Hồ sơ (avatar, tên, mã NV, đội, đánh giá sao, hạng GPLX), số liệu (chuyến năm nay, km an toàn, sự cố, ngày phép còn), thông tin cá nhân.
- Xe được giao: biển số, cấu hình bồn (số khoang, dung tích từng khoang), hạn đăng kiểm, kiểm định bồn, km tới kỳ bảo dưỡng.
- Nhiệm vụ ngoài chuyến (tick hoàn thành, hạn).
- Công việc khác: kiểm tra xe trước chuyến, báo sự cố / hỏng xe, xin nghỉ phép, giấy tờ, gọi điều độ, SOS. Danh sách "Yêu cầu đã gửi".
- Cài đặt: giao diện (Tự động/Sáng/Tối), thông báo đẩy, **Chế độ đang lái** (khi bật, mọi form nhập liệu bị chặn bằng alert "dừng xe trước khi nhập liệu").

### 5.7 Sheet dùng chung
- **Kiểm tra xe trước chuyến**: 9 hạng mục (lốp, phanh & đèn, rò rỉ gầm, van đáy & nắp khoang, dây tiếp địa, bình chữa cháy, biển báo hàng nguy hiểm, bảo hộ lao động, sức khỏe), đánh dấu mục nào bắt buộc; nút "Đánh dấu tất cả đạt".
- **SOS**: nút tròn đỏ lớn, bấm thì đếm ngược 10 giây có nút "Hủy, tôi bấm nhầm", hết giờ thì báo đã gửi vị trí và thông tin chuyến; danh sách gọi nhanh 114 / 115 / 113 / điều độ / HSE; thẻ hướng dẫn xử lý rò rỉ, cháy xe bồn, tai nạn.
- **Báo sự cố**: chọn loại (hỏng xe, rò rỉ, hao hụt, sai số chì, tai nạn, khác), mô tả, ảnh hiện trường.
- **Xin nghỉ phép**: từ ngày, đến ngày, loại nghỉ, số ngày tự tính, lý do.

## 6. Quy tắc nghiệp vụ

| Quy tắc | Giá trị |
|---|---|
| Ca làm | 06:00 – 15:00, dung sai ±5 phút |
| Đến sớm / đúng giờ / đi muộn | vào trước 05:55 / 05:55–06:05 / sau 06:05 |
| Về sớm | ra ca trước 14:55 |
| Hao hụt cho phép (nạp – xả) / lượng nạp | 0,3% |
| Lệch lượng nạp so với lệnh | 0,5% |
| Định mức ăn uống | 150.000 ₫/ngày; vượt thì bắt buộc giải trình |
| Không có hóa đơn | chỉ chấp nhận khoản dưới 200.000 ₫ |
| Phụ cấp chuyến | 150.000 ₫ + 5.000 ₫/km, làm tròn chục nghìn |
| KPI (trọng số) | Chuyên cần 20%, Giao đúng hẹn 20%, Hao hụt 20%, An toàn 15%, Tiêu hao nhiên liệu 15%, Tuân thủ quy trình 10% |
| Mức thưởng KPI | ≥ 90 Xuất sắc 2.000.000 ₫ · ≥ 80 Tốt 1.200.000 ₫ · ≥ 70 Khá 600.000 ₫ |
| Lương | cơ bản 8.500.000 ₫, độc hại 500.000 ₫, bảo hiểm 10,5% lương cơ bản |

Các chỉ tiêu Chuyên cần, Giao đúng hẹn, Hao hụt, Tuân thủ quy trình phải **tính từ dữ liệu thật trong app** (cập nhật khi hoàn tất chuyến). An toàn và Tiêu hao nhiên liệu có thể dùng số mock.

## 7. Dữ liệu mock cần có

- Lái xe: Nguyễn Văn Hùng, mã TX-0127, Đội 3 – Kho Nhà Bè, GPLX hạng FC, vào làm 03/2019; điều độ Lê Thu Hà.
- Xe: 51D-345.67, bồn 18.000 L chia 5 khoang (4.000 / 4.000 / 4.000 / 3.000 / 3.000 L).
- Chuyến: hôm nay 3 chuyến (1 đã hoàn tất, 1 đang chạy giao lúc 10:30, 1 chờ nhận); 2 chuyến sắp tới, trong đó 1 chuyến **dầu nhớt đóng phuy/thùng** dùng xe tải thùng; khoảng 11 chuyến lịch sử trong tháng có lượng nạp/xả thực tế, 1 chuyến giao trễ và 1 chuyến hao hụt vượt ngưỡng. Kho: Kho xăng dầu Nhà Bè, Kho Hiệp Phước. Điểm giao: các cửa hàng xăng dầu ở TP.HCM, Biên Hòa, KCN Long Thành, Long An. Sản phẩm: Dầu DO 0,05S-II, Xăng RON95-III, Xăng E5 RON92, dầu nhớt.
- Chấm công tháng 11: các ngày 2–12 (nghỉ Chủ Nhật), có ngày đến sớm, đúng giờ, 2 ngày đi muộn, 1 ngày về sớm; hôm nay đã vào ca lúc 05:54.
- Khoảng 11 khoản chi trong tháng đủ các loại và trạng thái; 1 khoản tạm ứng 2.000.000 ₫.
- 5 khóa học (2 bắt buộc: Vận chuyển hàng nguy hiểm ADR hạn 30/11/2026 và PCCC & xử lý tràn dầu), mỗi khóa có quiz 3 câu đúng chuyên môn.
- 5 chứng chỉ: GPLX FC, chứng chỉ hàng nguy hiểm (**hết hạn 30/11/2026**, để thấy cảnh báo), PCCC, khám sức khỏe, thẻ an toàn kho.

## 8. Tiêu chí hoàn thành

- [ ] Đủ 6 khu vực (5 tab + trang Cá nhân), tab bar ở dưới, điều hướng quay lại hoạt động.
- [ ] Chạy trọn một chuyến từ "Chờ nhận" đến "Hoàn tất", các bước chặn hoạt động đúng như mục 5.2.
- [ ] Hao hụt, KPI, lương dự kiến thay đổi theo dữ liệu khi hoàn tất chuyến hoặc thêm chi phí.
- [ ] Mọi form đều kiểm tra dữ liệu hợp lệ trước khi cho gửi.
- [ ] Chế độ sáng và tối đều đẹp; hiển thị đúng ở chiều rộng 375 px và trong khung iPhone trên máy tính.
- [ ] Dữ liệu giữ nguyên sau khi tải lại trang; nút đặt lại dữ liệu hoạt động.
- [ ] `npm run build` không lỗi; console trình duyệt không có lỗi.

## 9. Cách bàn giao

- Liệt kê cấu trúc thư mục và lệnh chạy (`npm install`, `npm run dev`).
- Ghi rõ những giả định bạn đã đặt ra và những phần còn là mock.
- Không bịa API hay dịch vụ thật; gọi điện dùng link `tel:`, chỉ đường dùng link Google Maps.
- Tự chạy build và kiểm tra trước khi báo hoàn thành; nếu có phần chưa làm được, nói rõ thay vì bỏ qua.
