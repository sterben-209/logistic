# Bàn Giao Kỹ Thuật Chi Tiết: Nexus Terminal Map Digitizer (Phiên 2)

## 1. Giới thiệu Dự Án & Kiến Trúc
- **Mục tiêu**: Xây dựng ứng dụng Web SPA (Single Page Application) tên là "Hybrid Scale Calibration & Zoning". Ứng dụng này cho phép người dùng (nhân viên điều hành cảng) upload một bức ảnh chụp từ trên cao của bãi container (Yard Map), sau đó số hóa nó thành hệ tọa độ Grid (Mảng 2D) dùng cho hệ thống tìm đường (Pathfinding).
- **Công nghệ**: HTML5 Canvas (UI rendering), JavaScript thuần, TailwindCSS, và **OpenCV.js** (để xử lý ảnh Computer Vision).
- **File chính**: 
  - `nexus_terminal_map_digitizer/code.html`: Chứa toàn bộ logic UI và App.
  - `build_spa.py`: Script Python để biên dịch các file thành 1 file `index.html` độc lập (SPA).

## 2. Chi Tiết Kiến Trúc Dữ Liệu (State Management)
Ứng dụng hoạt động dựa trên các biến State (Global Variables) chính sau:
- `scale`, `offsetX`, `offsetY`: Quản lý việc phóng to, thu nhỏ và di chuyển (Pan/Zoom) trên Canvas.
- `measurements` (Array): Lưu trữ các lần đo lường từ Phase 2.
- `pixelToMeterRatio` (Float): Tỉ lệ quy đổi (Ví dụ: 1 pixel = 0.05 mét). Được tính bằng trung bình cộng các lần đo.
- `mapZones` (Array): Chứa các bãi (vùng) mà người dùng vẽ hoặc AI detect ra. Mỗi object chứa tọa độ `startX, startY, width, height, type, isRotated`.
- `yardGrid` (Array): Lưu trữ lưới chi tiết tới từng ô slot container. Được tự động sinh ra dựa trên `mapZones` và `pixelToMeterRatio`.

## 3. Các Tính Năng Đã Viết Cụ Thể Trong Phiên 2

### 3.1. Cơ chế Ép lưới thủ công (Grid Override)
- **Tệp sửa đổi**: `code.html` (Phần Event Listeners & `generateGrid`).
- **Chi tiết**: Bổ sung sự kiện `dblclick` (nhấp đúp) vào Canvas. Khi tọa độ nhấp đúp rơi vào bên trong ranh giới (Bounding Box) của một `mapZone` (thuộc loại `Storage`), hệ thống bật `prompt()` yêu cầu nhập chuỗi `Số hàng, Số cột` (VD: `5,10`).
- Dữ liệu này được lưu trực tiếp vào thuộc tính `z.overrideRows` và `z.overrideCols`. Sau đó gọi lại hàm `generateGrid(z)` để ép viền.

### 3.2. Căn giữa lưới thẩm mỹ (Grid Centering / Padding)
- **Hàm sửa đổi**: `generateGrid(zone)` trong `code.html`.
- **Logic**: Theo mặc định, container chuẩn là `12.2m x 2.44m`. Khi quy đổi sang pixel, kích thước bãi không phải lúc nào cũng chia hết cho kích thước một ô, tạo ra phần dư (leftover space).
- Tôi đã thêm phép tính `padX = (Math.abs(zone.width) - (cols * slotPxW)) / 2` và `padY` tương tự. Các biến đệm này được cộng trực tiếp vào `startX` và `startY`, giúp toàn bộ khối lưới tự động trôi vào trung tâm của Bounding Box thay vì bám dính vào góc Top-Left như trước đây.

### 3.3. Xoay hướng lưới 90 độ (Vertical/Horizontal Slots)
- **Thêm UI**: Thêm checkbox `<input type="checkbox" id="chk-rotate-grid">` vào dưới nút Draw Zone (Phase 3).
- **Hàm sửa đổi**: `saveZone()` và `generateGrid()`.
- **Logic**: Bổ sung trường `isRotated` vào cấu trúc dữ liệu Zone. Nếu `isRotated == true`, hoán đổi (swap) `SLOT_WIDTH_M` và `SLOT_HEIGHT_M` trong quá trình tính toán ô lưới. 
- **Sửa lỗi đính kèm**: Đảm bảo `cols = 1` và `rows = 1` (fallback) thay vì `= 0` nếu người dùng vẽ bãi quá hẹp, ngăn chặn tình trạng lưới "tàng hình".

### 3.4. Auto-Zoning bằng Computer Vision (OpenCV.js)
- **Lý do thay đổi**: API HuggingFace (`detr-resnet-50`) là Free Endpoint, tốc độ chậm, bị giới hạn truy vấn (Rate limit) và dễ trả về CORS Error.
- **Thực thi**:
  1. Gỡ bỏ `fetch` HuggingFace API trong nút `btn-ai-detect`.
  2. Bổ sung message type `AUTO_ZONE` vào trong **Web Worker** `cvWorker`.
  3. **Thuật toán Cổ Điển**:
     - `cvtColor`: Sang ảnh xám.
     - `Canny`: Tìm viền cạnh.
     - `dilate` / `erode`: Dùng Structuring Element dạng RECT (kích thước tính theo bề rộng container thực tế dựa vào `pixelToMeterRatio`). Mục đích để nối các đường rãnh kẽ hở giữa nhiều container đứng sát nhau tạo thành một khối liền khối (Blob).
     - `findContours` + `boundingRect`: Lấy viền khối liền khối và bao quanh thành Bounding Box chữ nhật. Lọc bỏ các box quá nhỏ (diện tích < 2 container).
- **Sửa lỗi khởi tạo Worker**: Ghi đè logic khởi tạo `importScripts`. Phiên bản OpenCV.js mới 4.8.0 trả về một Promise. Sửa logic thành `cv(self.Module).then(function(c) { self.cv = c; postMessage({type: 'READY'}); })`. Chặn đứng lỗi "OpenCV is still loading".

### 3.5. UX: Chế độ Pan Map (Di chuyển bản đồ bằng chuột trái)
- **Thêm UI**: Bổ sung nút `btn-pan` (🤚 Pan Map) vào giao diện Phase 3.
- **Logic**: Nút này set biến `mode = 'idle'`.
- Sự kiện `mousedown` trên Canvas mặc định đã hỗ trợ `isPanning = true` nếu `mode === 'idle'`. Việc thêm nút này giúp user dễ dàng click chuột trái để kéo (drag) bản đồ mà không bị vướng nét vẽ.
- Sửa icon chuột thành `cursor = 'grab'` khi thả tay (tại sự kiện `mouseup`) nếu đang ở mode `idle`, mang lại trải nghiệm mượt mà giống Figma/Photoshop.

## 4. Bàn Giao & Hướng Phát Triển Tiếp
- **State Serialization**: Đã có nút *Export to Database* (Phase 5). Phiên tới cần kiểm tra lại khối JSON xuất ra xem đã gom đủ các key mới thêm như `overrideRows`, `overrideCols`, `isRotated` chưa.
- **Tối ưu OpenCV Tuning**: Nếu mô hình Auto-Zoning bằng thuật toán Canny/Dilate quét ra quá nhiều Rác (Noise), cân nhắc thêm thanh kéo điều chỉnh cấu hình Threshold vào giao diện.
- **Lệnh để biên dịch dự án**: Nhớ luôn chạy lệnh `python build_spa.py` mỗi khi thay đổi `code.html` để nạp mã mới vào file `index.html`.
