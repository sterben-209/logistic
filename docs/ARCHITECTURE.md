# Kiến trúc Hệ thống (System Architecture)

Tài liệu này trình bày cách hệ thống **Port Zoning Map** được thiết kế, giúp lập trình viên (Developer) nắm bắt luồng dữ liệu (Data Flow) và logic mô phỏng cốt lõi (Simulation Logic).

## 1. Thành phần Cốt lõi (Core Components)
Dự án được xây dựng dựa trên kiến trúc **React + Zustand** để xử lý hàng ngàn cập nhật trạng thái mỗi giây mà không làm giật lag giao diện (nhờ cơ chế React Batched Updates và RequestAnimationFrame).

### `FreePortDigitizer.jsx`
- Đóng vai trò là "Bản đồ Mẹ" (Map Container).
- Sử dụng **React-Leaflet** để render nền tảng bản đồ.
- **CanvasSlotLayer:** Đây là vũ khí bí mật giúp render 10.000+ slot container cùng lúc. Thay vì dùng DOM Elements thông thường, nó vẽ trực tiếp lên HTML Canvas.
- **Dispatcher Loop:** Mỗi khi có tác vụ (Task) được ném vào `taskQueue`, hệ thống sẽ chạy thuật toán A* (trong `routingService.js`) để vẽ đường đi (path) cho xe.

### `useVehicleAnimation.js`
Đây là bộ não (Engine) của luồng mô phỏng giao thông (Simulation Loop):
- Chạy bằng `requestAnimationFrame` kết hợp với logic đếm nhịp (tick).
- Cứ mỗi tick (ví dụ: 100ms), nó sẽ dịch chuyển `currentIndex` của các xe (Tasks) lên 1 hoặc 4 điểm dọc theo tuyến đường (path).
- **Anti-Collision (Tránh va chạm):** Kiểm tra khoảng cách Euclid giữa tọa độ hiện tại của các xe. Nếu hai xe gần nhau, xe có `task.id` lớn hơn sẽ chủ động phanh lại (yield) để nhường đường cho xe kia đi trước, khắc phục hoàn toàn tình trạng Deadlock.
- **Handshake Sync:** Khi Xe đầu kéo (Tractor) và Xe cẩu (AGV) cùng đến 1 điểm Slot, chúng sẽ đồng bộ hóa bằng các trạng thái `WAITING_FOR_SUPPORT`, `WAITING_FOR_TRACTOR`, sau đó cùng chuyển sang `HANDLING` trước khi tách ra.

## 2. Quản lý Trạng thái (Zustand Store)
Mọi dữ liệu tĩnh và động đều nằm trong `src/store/useTaskStore.js`.
- `tasks`: Mảng chứa toàn bộ các tác vụ đang chạy. Mỗi tác vụ (Task) đóng vai trò như một "Chiếc xe đang di chuyển trên đường" hoặc "Đang xếp dỡ".
- `fleetRegistry`: Chứa danh sách các xe cẩu nội bộ (AGV, RTG, RS). Các xe này khi IDLE sẽ đậu cố định trên bãi, khi có lệnh sẽ được điều động gán vào một `task`.
- `inventory`: Danh sách các container (thùng hàng) hiện có trong bãi. Mỗi container lưu tọa độ (zoneId, bay, row, tier) để định vị 3D.

## 3. Hệ thống Thuật toán (Services)
- **`routingService.js` (A-Star Pathfinding):**
  - Chuyển đổi bản đồ bãi thành một đồ thị (Graph). Tính toán quãng đường ngắn nhất từ cổng (Gate) đến các ô (Slot) dựa vào thuật toán A*. Đảm bảo xe chạy theo mạng lưới đường nội khu (Grid), không đâm xuyên tường.
- **`slotService.js` (Smart Slot Allocation):**
  - Đối với Inbound: Dùng hàm `findBestSlot` để chấm điểm (scoring). Ưu tiên xếp các container có cùng Loại (CargoType) ở chung khu vực. Xếp hàng nặng xuống dưới, hàng nhẹ lên trên. Tính toán Tier (số tầng xếp chồng) tự động.
  - Đối với Outbound: Hàm `findContainerToExport` chỉ tìm và chọn các container nằm trên cùng (đỉnh tháp) để xuất, tránh việc "rút ruột" container gây lỗi logic (Hàng kẹt ở dưới - Stuck underneath).
- **`auditService.js` (Hash-chain Auditing):**
  - Lưu log các giao dịch nhập/xuất vào **IndexedDB**. Từng bản ghi đều băm (hash) SHA-256 kèm theo hash của bản ghi trước đó để tạo thành một chuỗi (Chain). Tính năng này chống sửa đổi lịch sử.
