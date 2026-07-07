# Tính năng Hệ thống (Features Guide)

Tài liệu này đóng vai trò như một **Hướng dẫn sử dụng (User Manual)** kết hợp giải thích luồng nghiệp vụ thực tế cho từng tính năng trong hệ thống quản lý cảng biển.

---

## 1. Bản đồ số hóa (Map Digitizer)

Giao diện chính của hệ thống cung cấp góc nhìn toàn cảnh (Bird-eye view) theo thời gian thực về toàn bộ Cảng.

### Công cụ Tương tác:
- **Kéo/Thả & Phóng to/Thu nhỏ:** Sử dụng chuột hoặc cảm ứng để di chuyển (Pan) và phóng to (Zoom) vào bất kì ngóc ngách nào của bãi.
- **Canvas Slot Grid:** Hiển thị hàng ngàn slot (ô xếp container) mờ mờ trên nền bãi cảng.
- **Lớp hiển thị (Layers Control):** Bạn có thể dễ dàng bật/tắt các lớp vệ tinh (Satellite), lớp đường phố (Street Map) hoặc lưới quy hoạch.

---

## 2. Điều phối Nhập Bãi (Inbound Operations)

Chức năng mô phỏng luồng phương tiện bên ngoài (Xe đầu kéo) chở hàng từ đất liền vào trong bãi cảng.

### Luồng nghiệp vụ:
1. Bạn chọn tab **Lệnh Điều Phối (Operations)**.
2. Chọn nghiệp vụ **NHẬP BÃI**.
3. Điền kích thước thùng (20ft/40ft), loại hàng (DRY, REEFER, FLAMMABLE) và số lượng xe. Bấm Gửi.
4. Hệ thống sẽ:
   - Tự động sinh ra các xe Đầu Kéo (Tractor) ở ngoài cổng.
   - Các xe này xuất phát liên tiếp (staggering) cách nhau khoảng 2 giây để chống chồng chéo.
   - Đồng thời, hệ thống đánh thức một chiếc xe cẩu (AGV/RS) gần nhất trong cảng.
   - Cả hai xe cùng tự động tìm đường chạy song song về ô bãi (Slot) tốt nhất.
   - Khi cả hai xe cùng đến nơi, trạng thái giao tiếp (Handshake) bắt đầu. Mất vài giây để xe cẩu hạ container xuống bãi.
   - Cuối cùng, container xuất hiện trên bãi. Xe đầu kéo quay ra cổng và biến mất, xe cẩu quay lại trạng thái IDLE.

---

## 3. Điều phối Xuất Bãi (Outbound Operations)

Mô phỏng quá trình điều xe đầu kéo trống vào cảng để bốc hàng và chở ra ngoài.

### Luồng nghiệp vụ:
1. Bạn chọn nghiệp vụ **XUẤT BÃI**. Điền loại hàng cần xuất. Bấm Gửi.
2. Hệ thống dò quét toàn bộ bãi cảng để tìm những container **nằm trên cùng (đỉnh tháp)** khớp với thông số của bạn.
   - *Tính năng an toàn (Anti-digging):* Nếu container khớp loại hàng nhưng nằm dưới 1 container khác, hệ thống sẽ bỏ qua và báo lỗi để chống tình trạng đào bới vô lý trong thực tế.
3. Khi tìm được, xe Đầu Kéo sẽ chạy từ cổng vào, và xe Cẩu nội bộ chạy tới slot.
4. Sau quá trình bốc (Handling), container biến mất khỏi bãi. Hai xe chia tay nhau. Xe Đầu Kéo chở hàng ra cổng và hoàn tất.

---

## 4. Nhật ký Audit (Blockchain Audit Trail)

Chức năng chống chối cãi để lưu vết toàn bộ hoạt động trong cảng. Rất hữu ích cho các đợt Thanh tra, Kiểm toán.

### Luồng nghiệp vụ:
- Khi một xe hoàn thành việc Nhập hoặc Xuất qua cổng, chữ ký số điện tử của nhân viên trực cổng (Mock Worker Wallet) sẽ được băm (hash) cùng thông tin lô hàng bằng thuật toán `SHA-256`.
- Hệ thống lấy mã Hash của giao dịch trước đó, nối vào giao dịch hiện tại để tạo mã Hash mới (cơ chế Hash-Chain giống Blockchain).
- Vào tab **Audit Trail**, bạn có thể bấm **Kiểm tra toàn vẹn chuỗi**. Hệ thống sẽ chạy lại toàn bộ thuật toán hash trên hàng nghìn bản ghi. Nếu có bất kỳ sự thay đổi (giả mạo) dù chỉ 1 ký tự nào trong Database, hệ thống sẽ đánh dấu đỏ (Cảnh báo can thiệp).
- *Lưu ý:* Do log lưu trên IndexedDB của trình duyệt, nó tồn tại mãi mãi ngay cả khi tắt máy. Khi data quá lớn, hãy dùng nút **Xóa lịch sử**.
