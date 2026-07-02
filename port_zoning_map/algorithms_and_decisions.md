# Tài liệu Phân tích Thuật toán & Kiến trúc Hệ thống Bản đồ Cảng

Tài liệu này giải thích chi tiết các thuật toán cốt lõi đã được áp dụng trong dự án, bao gồm cách hệ thống tự động sinh lưới, xoay bãi, tìm đường và tối ưu hóa hiệu suất để không bị treo trình duyệt (Not Responding).

---

## 1. Thuật toán Sinh Lưới Container (Grid Generation)

### 1.1. Xác định góc xoay của Bãi (Bearing / Orientation Calculation)
Khi người dùng khoanh vùng một bãi YARD (đa giác bất kỳ), các container bên trong phải được xếp song song với cạnh dài nhất của bãi đó. 
- **Thuật toán:** Hàm `generateGridWithTurf` sẽ duyệt qua tất cả các đoạn thẳng tạo nên đường bao quanh bãi.
- **Tính toán cạnh dài nhất:** Dùng công thức Haversine (tính khoảng cách đường chim bay giữa tọa độ lat/lng trên bề mặt khối cầu) để tìm ra cạnh dài nhất của bãi.
- **Tính góc xoay (Bearing):** Khi đã có cạnh dài nhất, dùng `turf.bearing(point1, point2)` để lấy góc xoay tuyệt đối (theo độ) so với phương Bắc.

### 1.2. Tạo Bounding Box và Sinh Lưới thô (Raw Grid)
Vì không thể trực tiếp sinh lưới nghiêng, thuật toán phải đi đường vòng:
- Dùng `turf.transformRotate` xoay **ngược** toàn bộ bãi YARD về góc 0 độ (vuông góc với phương Bắc).
- Dùng `turf.bbox` để lấy ra khung chữ nhật giới hạn (Bounding Box) bao trọn toàn bộ bãi YARD lúc này.
- Tính toán kích thước lưới:
  - Bề rộng: Dùng 2.44m + 0.5m (khoảng cách khe hở an toàn).
  - Bề dài: 12.2m (cho cont 40ft) + 1.0m (khe hở).
- Chạy 2 vòng lặp (hàng ngang và hàng dọc) bên trong Bounding Box để lấp đầy toàn bộ khu vực bằng các ô container (Slots). Các ô sinh ra lúc này đều là các `turf.polygon` (hình chữ nhật).

### 1.3. Cắt tỉa (Cropping) và Xoay về vị trí cũ
- Sau khi có một tấm lưới khổng lồ hình chữ nhật bọc ngoài, hệ thống dùng thuật toán **Point-in-Polygon** (`turf.booleanPointInPolygon`) để kiểm tra xem tâm của từng ô lưới có nằm trong khu vực bãi YARD ban đầu hay không. Ô nào rơi ra ngoài (hoặc bị cắt xén) sẽ bị vứt bỏ.
- Xoay toàn bộ các ô lưới còn sót lại về góc ban đầu (cùng góc với bãi YARD) bằng `turf.transformRotate`.

---

## 2. Thuật toán Lọc Chướng Ngại Vật (Collision Detection)

### 2.1. Kiểm tra đè lấn (Intersection)
Trong quá trình sinh lưới, nếu bãi YARD bị một con đường (ROAD) hoặc tòa nhà (BUILDING) cắt ngang qua, các container không được phép sinh ra đè lên chúng.
- **Thuật toán:** Dùng `turf.booleanIntersects(slotPolygon, obstaclePolygon)`.
- **Nguyên nhân gây lỗi "Lưới đè đường xương cá (ROAD_LINE)":**
  - Hệ thống hiện tại chỉ đưa các vật cản dạng Polygon (`BUILDING`, `ROAD`) vào mảng `polygonObstacles`. 
  - Đường xương cá `ROAD_LINE` được biểu diễn dưới dạng LineString (Chỉ là 1 sợi dây 1D).
  - Lưới đã không phát hiện ra `ROAD_LINE` nên vẽ đè lên. 
  - **Cách khắc phục:** Cần dùng `turf.buffer` để biến sợi dây 1D đó thành một ống Polygon 2D (có độ rộng tầm 4-5m) rồi nhét vào mảng `polygonObstacles`.

---

## 3. Tối ưu hóa: Thuật toán Bounding Box (Fast Rejection)

**Vấn đề cũ (Gây Crash/Lag):** 
Mỗi khi vẽ xong 1 con đường xương cá mới, hệ thống tự động lọc lại **20,000 slots** trên bản đồ để xóa các slot bị đè. Chạy 20,000 phép tính `turf.booleanIntersects` cực nặng (dựng hình 3D đa giác, tính toán điểm chéo) trên luồng chính (Main Thread) khiến trình duyệt treo cứng (Not Responding).

**Giải pháp (Đã áp dụng): Thuật toán AABB (Axis-Aligned Bounding Box)**
- Tạo một Hộp bao quanh chữ nhật bao lấy con đường vừa vẽ.
- Trước khi dùng đến `turf`, hệ thống dùng số học siêu nhẹ (lớn hơn, nhỏ hơn `minLat, minLng, maxLat, maxLng`) để kiểm tra xem Slot có nằm trong hộp này hay không (O(1)).
- Hàng ngàn slots cách xa con đường sẽ bị loại bỏ ngay lập tức trong vòng 1 milisecond (Fast Rejection). Chỉ còn vài slot nằm ngấp nghé mép đường bị đưa vào lò `turf.booleanIntersects` để tính toán chính xác. 

---

## 4. Thuật toán Xây dựng Đồ thị Tìm đường (Dynamic Graph) & Spatial Hashing

**Vấn đề cũ (O(N²) Complexity):** 
Để A-Star tìm được đường đi, các con đường xương cá phải nối lại với nhau. Nếu dùng cách lấy từng điểm của đường A so sánh với từng điểm của đường B (có 10,000 điểm), số vòng lặp là $10,000 \times 10,000 = 100,000,000$ phép tính -> Cháy máy.

**Quyết định thiết kế (Đã áp dụng): Thuật toán Spatial Hashing (Chia lưới không gian 2D)**
- Thay vì đi so sánh mọi điểm, hệ thống băm bản đồ thành các ô lưới ảo có kích thước cực nhỏ (~11 mét = 0.0001 độ vĩ tuyến).
- Cứ mỗi tọa độ đường, hệ thống ném thẳng tọa độ đó vào ô lưới tương ứng (Dùng `Map` với Key là String dạng `"gx,gy"` - độ phức tạp là O(1)).
- Khi cần tìm điểm giao nhau, mỗi điểm chỉ thò đầu sang **9 ô lưới sát vách mình** để xem có thằng nào đứng đó không. Độ phức tạp vòng lặp rớt thê thảm từ 100,000,000 xuống chỉ còn vài ngàn. Máy tính xử lý cực nhẹ, hết lag!

---

## 5. Thuật toán nối Container vào Đường (Point-to-Line Projection)

**Vấn đề cũ (Turf.js tạo Object rác):** 
Hệ thống cũ dùng `turf.nearestPointOnLine` để nối container ra đường. Hàm này liên tục đẻ ra các Object Geometry trong bộ nhớ mỗi lần chạy. Trình dọn rác (Garbage Collector) của Chrome dọn không kịp, gây giật lag cục bộ.

**Giải pháp (Đã áp dụng): Đại số Vector (Toán học thuần)**
- Tự viết hàm chiếu vuông góc (Projection) một điểm lên một đoạn thẳng bằng Dot Product (Tích vô hướng).
  - Tìm ra độ xa tương đối `t` dọc theo cạnh con đường.
  - Chặn `t` trong khoảng `[0, 1]` để đảm bảo điểm vuông góc nằm bên trong đoạn đường, không bị văng ra ngoài.
- Tốc độ tăng gấp 100 lần so với Turf, không sinh Object rác.

---

## 6. Thuật toán Tìm đường (A-Star / A*)

**Kiến trúc:**
- Khởi tạo Đồ thị (Graph) thông qua kiểu dữ liệu `Map<string, Node>`. Mỗi Node có ID, tọa độ và mảng các `edges` chứa ID điểm đến và khoảng cách.
- **Hàm Heuristic:** Định hướng đường chim bay bằng khoảng cách Euclid.
- Khi người dùng click một slot, hệ thống sẽ:
  1. Kiểm tra quanh đó có `GATE` (Cổng) nào không.
  2. Nếu không có `GATE`, nó tự động tìm `ROAD_CELL` (Điểm đường xương cá) gần slot đó nhất làm điểm khởi đầu dự phòng (Fallback).
  3. Quét đường từ điểm xuất phát men theo mạng lưới `ROAD_LINE` để bẻ lái đâm thẳng vào `SLOT`.
