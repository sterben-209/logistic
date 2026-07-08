  # Kiến trúc Hệ thống (System Architecture)

  Tài liệu này trình bày chi tiết về kiến trúc hệ thống **Port Zoning Map**, bao gồm luồng dữ liệu, logic cốt lõi của mô phỏng, các thuật toán, dịch
  vụ hỗ trợ, và giao diện người dùng. Nó được viết nhằm giúp các nhà phát triển (Developers) nhanh chóng nắm bắt cách hệ thống hoạt động và được
  thiết kế để có thể chạy offline.

  ## 1. Tổng quan Kiến trúc & Stack Công nghệ

  Hệ thống được xây dựng trên nền tảng **React** và sử dụng **Zustand** làm giải pháp quản lý trạng thái tập trung. Kiến trúc này cho phép xử lý
  hiệu quả hàng ngàn cập nhật trạng thái mỗi giây mà không gây giật lag giao diện người dùng (UI), nhờ các cơ chế như React Batched Updates và
  `requestAnimationFrame`. Các thư viện và công nghệ chính bao gồm:

  *   **Frontend Framework:** React
  *   **State Management:** Zustand
  *   **Bản đồ & GIS:**
      *   React-Leaflet: Thư viện để render bản đồ.
      *   Turf.js: Thư viện mạnh mẽ cho các tính toán địa lý và hình học (tạo lưới, tính khoảng cách, diện tích, buffer, giao cắt).
      *   OpenStreetMap (qua Overpass API): Nguồn dữ liệu bản đồ thực tế, được Fetch và xử lý để lấy thông tin về đường xá, tòa nhà, bồn chứa, cổng,
  v.v.
  *   **Hoạt hình (Animation):** `requestAnimationFrame` kết hợp với hook tùy chỉnh `useVehicleAnimation.js` để tạo hiệu ứng di chuyển xe mượt mà.
  *   **Lưu trữ Offline:**
      *   IndexedDB: Sử dụng để lưu trữ lịch sử giao dịch (audit logs) và có thể là dữ liệu bản đồ/trạng thái tạm thời.
      - LocalStorage: Lưu trữ các cài đặt người dùng hoặc trạng thái nhỏ.
  *   **Hashing & Bảo mật:** CryptoJS (SHA-256) cho `auditService.js` để tạo chuỗi băm đảm bảo tính toàn vẹn dữ liệu.
  *   **Công cụ Build:** Vite.
  *   **Linting:** ESLint (`.oxlintrc.json`) để đảm bảo chất lượng code.

  ## 2. Cấu trúc Project (Directory Structure)

  ```plaintext
  port_zoning_map/
  ├─ src/
  │  ├─ assets/                     # Tài nguyên tĩnh (hình ảnh, SVG, phông chữ)
  │  │  ├─ hero.png
  │  │  ├─ react.svg
  │  │  ├─ vite.svg
  │  │  └─ icons.svg
  │  ├─ components/                 # Components React tái sử dụng (dumb components)
  │  │  ├─ CanvasSlotLayer.jsx      # Lớp tùy chỉnh vẽ slot container hiệu quả trên canvas
  │  │  ├─ Layout.jsx               # Khung layout chính của ứng dụng
  │  │  └─ Navigation.jsx           # (Nếu có) Thành phần menu điều hướng
  │  ├─ hooks/                      # Custom React hooks
  │  │  └─ useVehicleAnimation.js   # Hook điều khiển hoạt hình xe mô phỏng
  │  ├─ pages/                      # Trang ứng dụng (page-level components)
  │  │  ├─ AuditTrail.jsx           # Trang xem lịch sử giao dịch
  │  │  ├─ Inventory.jsx            # Trang quản lý hàng tồn kho
  │  │  ├─ MapPage.jsx              # Trang chính hiển thị bản đồ tương tác
  │  │  └─ Operations.jsx           # Panel điều khiển vận hành và danh sách task
  │  ├─ services/                   # Dịch vụ business logic và thuật toán
  │  │  ├─ auditService.js          # Hệ thống ghi nhật ký an toàn bằng hash-chain
  │  │  ├─ mapService.js            # Dịch vụ tạo và quản lý dữ liệu bản đồ
  │  │  ├─ osmService.js            # Tương tác OpenStreetMap qua Overpass API
  │  │  ├─ routingService.js        # Dịch vụ tìm đường A* với SSSP precomputation & caching
  │  │  ├─ slotService.js           # Thuật toán phân bổ slot thông minh
  │  │  ├─ turfService.js           # Tiện ích tính toán hình học (Turf.js)
  │  │  └─ zoneTagging.js           # Phân loại zones tự động bằng quan hệ không gian
  │  ├─ store/                      # Quản lý trạng thái ứng dụng (Zustand)
  │  │  └─ useTaskStore.js          # Store trung tâm: tasks, fleetRegistry, inventory, trạng thái UI
  │  ├─ App.jsx                     # Component gốc của ứng dụng React
  │  ├─ main.jsx                    # Entry point ứng dụng
  │  ├─ index.css                   # CSS toàn cục
  │  └─ App.css                     # CSS cụ thể cho App
  ├─ public/                        # Các file tĩnh serve trực tiếp
  │  ├─ favicon.ico
  │  ├─ manifest.json
  │  └─ robots.txt
  ├─ .gitignore
  ├─ .oxlintrc.json                 # Cấu hình ESLint
  ├─ package.json                   # Dependencies & Scripts
  ├─ README.md
  └─ vite.config.js                 # Cấu hình Vite

  3. Quản lý Trạng thái (State Management - Zustand)

  Toàn bộ dữ liệu và trạng thái của ứng dụng được quản lý tập trung tại src/store/useTaskStore.js sử dụng Zustand. Store này bao gồm các phần chính:

  - tasks: Mảng chứa tất cả các tác vụ đang hoạt động. Mỗi Task đại diện cho một "chiếc xe đang di chuyển" hoặc "hoạt động xếp dỡ", bao gồm:
    - id: Mã định danh duy nhất.
    - containerInfo: Thông tin container (ID, kích thước, loại hàng).
    - source, destination: Thông tin vị trí nguồn và đích (zone, bay, row, tier).
    - vehicleType: Loại xe thực hiện task (AGV, Tractor).
    - status: Trạng thái (PENDING, IN_PROGRESS, COMPLETED, FAILED).
    - path: Tuyến đường được tính toán bởi routingService.js.
    - currentPosition: Vị trí hiện tại trên path trong quá trình hoạt hình.
  - fleetRegistry: Lưu trữ danh sách các phương tiện nội bộ (AGV, RTG, RS), bao gồm:
    - id: Mã định danh xe.
    - type: Loại xe.
    - currentZoneId, currentSlotId: Vị trí hiện tại của xe trên bản đồ.
    - status: Trạng thái (IDLE, BUSY, MAINTENANCE).
  - inventory: Danh sách các container (hàng hóa) hiện có trong bãi, bao gồm:
    - id, containerNo: Mã định danh container.
    - size, type, cargoType, weight: Thuộc tính hàng hóa.
    - zoneId, bay, row, tier: Vị trí chi tiết trong kho.
    - status: Trạng thái (LOADED, EMPTY, MAINTENANCE).
  - Trạng thái UI: Các biến như selectedZoneId, sidebarOpen, filters, sortField, sortOrder cũng được quản lý tại đây để đảm bảo tính nhất quán trên
  toàn ứng dụng.

  4. Các Dịch vụ Cốt lõi & Thuật toán (Core Services & Algorithms)

  routingService.js - Thuật toán A* Pathfinding

  - Mục đích: Tìm đường đi ngắn nhất và tối ưu nhất cho xe từ điểm xuất phát đến vị trí đích.
  - Cấu trúc & Thuật toán:
    - Biểu diễn Đồ thị: Bản đồ bãi được mô hình hóa thành đồ thị gồm các nút (zones, slots, gates, intersections, road snapping points) và cạnh
  (đường đi giữa các nút). Sử dụng thư viện @turf/turf để xử lý hình học và tính toán tọa độ.
    - Thuật toán A*: Tìm kiếm đường đi hiệu quả bằng cách sử dụng MinHeap làm cấu trúc dữ liệu ưu tiên và hàm heuristic (khoảng cách Euclid) để ước
  lượng chi phí đến đích.
    - Tinh chỉnh:
        - Biểu diễn Đồ thị Động: Tự động xây dựng đồ thị từ dữ liệu Zones, Slots, Gates và các đoạn đường (Road Lines) lấy từ OSM hoặc dữ liệu đầu
  vào.
      - Snap to Road: Các điểm (Gates, Slots) được "snap" vào các đường đi gần nhất để đảm bảo xe luôn di chuyển trên đường.
      - Xử lý Giao lộ & Lỗi hình học: Sử dụng turf.lineIntersect để tìm giao lộ và turf.buffer / turf.polygonize để xử lý các trường hợp phức tạp,
  tạo các nút và cạnh hợp lý.
      - Turn Penalty: Áp dụng phạt chi phí (20m) cho các lần rẽ góc đáng kể để ưu tiên đường thẳng.
    - Tối ưu hóa Hiệu năng:
        - SSSP Precomputation: Tính toán trước tất cả đường đi ngắn nhất từ các cổng (gates) bằng thuật toán Dijkstra (Single-Source Shortest Path)
  và lưu vào cache (ssspCameFromCache). Điều này giúp truy vấn đường đi từ cổng đến slot diễn ra gần như tức thời.
      - Path Caching: Lưu trữ kết quả các đường đi đã tính toán (pathCache) để tái sử dụng, tránh tính toán lại cho các cặp điểm giống nhau.
  - Lý do Tinh chỉnh: Đảm bảo xe luôn tìm được lộ trình tối ưu, hiệu quả, tránh vật cản và tuân thủ quy tắc giao thông (ít rẽ) trong môi trường cảng
  phức tạp. Việc cache và precomputation tăng tốc độ phản hồi đáng kể cho các tác vụ định tuyến.

  slotService.js - Thuật toán Phân bổ Slot Thông minh (Smart Slot Allocation)

  - Mục đích: Xác định vị trí (slot) container tối ưu cho cả quá trình nhập (inbound) và xuất (outbound).
  - Cơ chế: Kết hợp quy tắc nghiệp vụ và logic chấm điểm (scoring) thay vì một thuật toán tìm kiếm duy nhất.
  - Tinh chỉnh & Logic:
    - Inbound (findBestSlot):
        - Ưu tiên Khu vực: Tìm slot trong các khu vực được chỉ định theo loại hàng (allowedCargo) hoặc theo zoneType mặc định (DANGEROUS, REEFER,
  YARD).
      - Tối ưu hóa Slot: Lọc các slot hợp lệ dựa trên:
            - Dung lượng còn trống (số tier).
        - Quy tắc xếp chồng (container mới không được nặng hơn container trên cùng và cùng kích thước).
        - Xử lý đặc biệt cho container 40ft (chiếm 2 slot liền kề).
      - Chấm điểm Slot: Tính điểm cho các slot hợp lệ dựa trên:
            - Ưu tiên container nặng ở slot trống (+100 điểm).
        - Ưu tiên nhóm cùng loại/kích thước (+50 điểm).
        - Phạt việc xếp nhẹ lên nặng.
        - Sử dụng tie-breaker dựa trên ID slot để đảm bảo tính nhất quán.
      - Tối ưu hiệu năng: Sử dụng slotInventoryMap để index container theo slot, giảm độ phức tạp tính toán.
    - Outbound (findContainerToExport):
        - Tìm container khớp với yêu cầu (size, cargoType).
      - Ưu tiên container nằm ở tier cao nhất (top-most) trong một chồng để tránh phải di dời container khác.
      - Sử dụng pendingExportsSet để tránh chọn container đang được xử lý.
    - Tính toán Tier mới (calculateNewTier): Xác định tier tiếp theo dựa trên container hiện có, xem xét cả logic overlap của container 40ft.
  - Lý do Tinh chỉnh: Tối đa hóa dung lượng kho, giảm thời gian di chuyển xe, ngăn ngừa lỗi xếp chồng và đảm bảo quy trình xuất nhập container diễn
  ra hiệu quả, an toàn.

  auditService.js - Thuật toán Hash-chain Auditing

  - Mục đích: Đảm bảo tính toàn vẹn và không thể thay đổi của dữ liệu lịch sử giao dịch (nhập/xuất container).
  - Thuật toán & Cấu trúc:
    - Hash Chain: Mỗi bản ghi giao dịch được liên kết với bản ghi trước đó bằng cách chứa hash của bản ghi trước.
    - Thuật toán Hash: Sử dụng SHA-256 (CryptoJS.SHA256) để tạo hash cho mỗi bản ghi.
    - Cấu trúc Bản ghi: Bao gồm: id, containerId, action, details (có chữ ký người thực hiện), timestamp, previousHash, currentHash.
    - Lưu trữ: Dữ liệu được lưu trữ phía client bằng IndexedDB (idb-keyval) để đảm bảo khả năng truy cập offline và tốc độ.
    - generateHash: Hàm tạo hash từ dữ liệu và previous hash.
    - logAuditEvent: Hàm chính ghi log, lấy các bản ghi trước đó từ IndexedDB, tính toán hash mới, và lưu lại toàn bộ chuỗi đã cập nhật.
  - Lý do Tinh chỉnh: Bảo vệ dữ liệu lịch sử khỏi sửa đổi trái phép. Nếu bất kỳ dữ liệu nào bị thay đổi, chuỗi hash sẽ bị phá vỡ, cho phép phát hiện
  ngay lập tức.

  5. Dịch vụ Bản đồ & Xử lý GIS (GIS & Map Services)

  mapService.js

  - Vai trò: Cung cấp các dịch vụ liên quan đến bản đồ, bao gồm mô phỏng quét AI để tạo khu vực, tạo lưới container, tìm kiếm cảng qua API bên
  ngoài, và giả lập việc lấy dữ liệu bản đồ.
  - Các hàm chính:
    - mockAiScanPort(bounds): Mô phỏng quét AI để tự động tạo các khu vực (zones) dựa trên ranh giới bounds. Trả về các polygon ngẫu nhiên mô phỏng
  các khu vực chức năng (kho, yard, dangerous).
    - generateGridForPolygon(...): Tạo lưới container (slots) bên trong một polygon, tránh các chướng ngại vật. Sử dụng @turf/turf để tính toán hình
  học, góc quay, và vị trí slot theo chuẩn ISO (bay-row).
    - searchPortsWithSerpApi(query): Tìm kiếm cảng qua SerpApi (cần API key) để lấy tọa độ và thông tin. Có fallback qua CORS proxy và xử lý lỗi
  mạng.
    - fetchMapData(portId): Giả gọi API backend để kiểm tra dữ liệu bản đồ có sẵn hay chưa.
  - Chi tiết hoạt động generateGridForPolygon: Sử dụng Turf.js để tính toán bounding box, tâm, góc quay (từ cạnh dài nhất hoặc custom), bán kính
  quét, và tạo lưới điểm. Mỗi điểm lưới được kiểm tra có nằm trong polygon và không giao với chướng ngại vật hay không, sau đó chuyển thành slot
  container với ID ISO.

  zoneTagging.js

  - Vai trò: Tự động phân loại các khu vực (zones) dựa trên mối quan hệ không gian với các đối tượng địa lý khác (nhà, bồn chứa, cổng) lấy từ OSM
  hoặc dữ liệu đầu vào.
  - Các quy tắc phân loại (áp dụng tuần tự):
    a. KHO MÁI CHE (COVERED): Zone giao cắt với tòa nhà là WAREHOUSE (diện tích giao cắt > 50% diện tích zone) → zoneType: 'YARD', subType:
  'COVERED', allowedCargo: ['METAL', 'EQUIPMENT'].
    b. CÁCH LY HÓA CHẤT (DANGEROUS):
        - Zone liền kề bồn chứa (TANK trong vòng 10m) → zoneType: 'DANGEROUS', subType: 'TANK_ADJACENT', allowedCargo: ['FLAMMABLE', 'TOXIC'].
      - Nếu không có zone nào gần TANK, chọn zone cách xa TANK nhất (≥100m) → subType: 'ISOLATED'.
    c. BÃI GỖ (OPEN_AIR for WOOD): Zone cách xa khu vực hóa chất ≥ 20m, tối đa 2 zone → zoneType: 'YARD', subType: 'OPEN_AIR', allowedCargo:
  ['WOOD'].
    d. HÀNG KHÔ TỔNG HỢP (MẶC ĐỊNH): Các zone còn lại → zoneType: 'YARD', subType: 'OPEN_AIR', allowedCargo: ['DRY'].
  - Công nghệ: Sử dụng @turf/turf cho các phép toán hình học (intersect, area, buffer, distance, pointInPolygon).

  turfService.js

  - Vai trò: Cung cấp các hàm tiện ích tính toán hình học bằng Turf.js, chủ yếu để hỗ trợ tạo lưới container và xử lý va chạm.
  - Các hàm chính:
    - getLongestEdgeAngle(coords): Tính góc của cạnh dài nhất.
    - generateGridWithTurf(...): Hàm chính tạo lưới container trong một polygon, xử lý chướng ngại vật, tính toán slot theo chuẩn ISO. Đảm bảo các
  slot không bị chồng lấn với chướng ngại vật và có ID định danh duy nhất.
    - createFlatBufferPolygon(lineString, width): Tạo vùng đệm hai bên xung quanh một đường thẳng.

  osmService.js

  - Vai trò: Tương tác với OpenStreetMap (OSM) qua Overpass API để lấy dữ liệu địa lý thực tế và chuyển đổi thành định dạng nội bộ.
  - Quy trình:
    a. Xây dựng Query: Tạo truy vấn Overpass để lấy các đối tượng OSM (building, tank, gate, highway, landuse, man_made, parking) trong bounding
  box.
    b. Kết nối API: Thử kết nối đến nhiều endpoint Overpass để tăng độ tin cậy. Có xử lý lỗi mạng và fallback graceful.
    c. Xử lý Phản hồi:
        - Chuyển đổi OSM nodes/ways thành định dạng GeoJSON nội bộ.
      - Phân tích Hình dạng (AI Shape Detection): Sử dụng circularity để tự động phân biệt TANK và WAREHOUSE khi OSM thiếu thẻ.
      - Xử lý các loại đối tượng: Building, Tank, Gate, Highway (phân loại theo highway tag), Landuse/Industrial (tạo YARD/GENERAL zone).
      - Polygonize: Sử dụng turf.polygonize để tìm các khoảng trống giữa các đường OSM, tạo thành các bãi tự động (osm-autoyard).
      - Lọc theo Ranh giới Cảng: Nếu có portBoundaryGeoJSON, chỉ giữ lại các đối tượng nằm trong ranh giới đó.
      - Phát hiện Cổng chính: Tìm các điểm giao cắt giữa đường OSM và ranh giới cảng, sau đó cluster chúng để xác định các cổng chính.
    d. Trả về: Mảng các features (GATE, BUILDING, YARD, ROAD, ROAD_LINE, GENERAL) với định dạng chuẩn {id, type, name, path, ...properties}.
  - Lưu ý: Có sử dụng CORS proxy cho SerpApi khi chạy local; tự động xử lý lỗi mạng cho Overpass API.

  6. Các thành phần Giao diện Người dùng (UI Components)

  Khung giao diện: Layout.jsx

  - Vai trò: Cung cấp khung layout chung cho toàn ứng dụng (Header, Sidebar Navigation, Content Area).
  - Tương tác Zustand: Quản lý trạng thái UI của layout (ví dụ: sidebarOpen).

  Nhóm Bản đồ & Tương tác:

  - MapPage.jsx: Trang chính hiển thị bản đồ.
    - Tương tác Zustand: Đọc zones, slots, mapStatus, selectedZoneId; dispatch setZones, setSlots, setMapStatus, selectZone.
    - Kết nối dịch vụ: Gọi mapService (mockAiScanPort), zoneTagging, turfService để xử lý và render dữ liệu bản đồ bằng react-leaflet và
  CanvasSlotLayer.
  - FreePortDigitizer.jsx: Container bản đồ chính, tích hợp react-leaflet.
    - Tương tác Zustand: Đọc tasks, fleetRegistry; dispatch addTask, updateTaskPosition, removeTask.
    - Smart Dispatcher: Xử lý taskQueue tuần tự - chỉ lấy và xử lý một task tại một thời điểm.
    - Render: Sử dụng các lớp TileLayer, GeoJson (cho zones), Marker (cho gates/buildings), và CanvasSlotLayer (cho slots). Xử lý sự kiện người dùng
  trên bản đồ (click, vẽ polygon, drag-drop container).

  Nhóm Vận hành & Animation:

  - Operations.jsx: Panel điều khiển vận hành.
    - Tương tác Zustand: Đọc tasks, fleetRegistry, inventory; dispatch addTask, updateTask, removeTask, setFleetStatus. Cho phép người dùng xem,
  tạo, và quản lý task/xe.
  - TaskTab.jsx: Hiển thị chi tiết một task cụ thể.
    - Tương tác Zustand: Đọc selectedTaskId và dữ liệu task tương ứng để hiển thị thông tin chi tiết (container, vị trí, trạng thái, lịch sử).
  - useVehicleAnimation.js (Hook): Điều khiển hoạt hình xe trên bản đồ.
    - Cách hoạt động: Sử dụng requestAnimationFrame để cập nhật vị trí xe dựa trên tasks và fleetRegistry. Xử lý tránh va chạm (Anti-Collision) và
  đồng bộ hóa (Handshake Sync).
    - Tối ưu: Cập nhật trạng thái khi cần thiết, đồng bộ với tần số màn hình.

  Nhóm Quản lý & Audit:

  - Inventory.jsx: Trang quản lý hàng tồn kho (container).
    - Tương tác Zustand: Đọc inventory, filters, sortField/sortOrder; dispatch addContainer, updateContainer, removeContainer, setFilters, setSort.
  Cho phép xem, lọc, sắp xếp, thêm, sửa, xóa container.
  - AuditTrail.jsx: Trang hiển thị lịch sử giao dịch.
    - Nguồn dữ liệu: Đọc trực tiếp từ IndexedDB (qua auditService) hoặc một phần trong Zustand store.
    - Thao tác: loadLogs, filterLogs, exportLogs, clearLogs. Hiển thị log với timestamp, người thực hiện, hành động, đối tượng, chi tiết, và mã màu.

  7. Hướng dẫn Chạy & Setup Demo (Deployment & Demo Guide)

  Chạy Project Local:

  1. Cài đặt Dependencies:
  npm install
  2. Khởi chạy Dev Server:
  npm run dev
  2. Truy cập ứng dụng tại http://localhost:5173 (hoặc cổng được chỉ định).

  Hướng dẫn Demo Offline & Reset Dữ liệu:

  Ứng dụng sử dụng IndexedDB và LocalStorage để lưu trữ trạng thái và lịch sử giao dịch, cho phép hoạt động offline.

  Quan trọng: Để đảm bảo demo sạch và nhất quán giữa các lần, bạn phải xóa dữ liệu trình duyệt (Local Storage & IndexedDB) cho domain localhost
  trước mỗi lần demo.

  - Cách xóa dữ liệu (Chrome):
    a. Mở DevTools (F12).
    b. Chuyển đến tab Application.
    c. Trong mục Storage, chọn Local storage và IndexedDB.
    d. Nhấp Clear site data.
  - Lưu ý: Thao tác này cũng xóa các cài đặt tùy chỉnh của trình duyệt, bạn có thể cần cấu hình lại.

  Hoạt động khi Offline:

  - osmService.js: Chịu lỗi mạng tốt, trả về mảng rỗng nếu Overpass API không phản hồi, không làm crash ứng dụng. Tuy nhiên, các lớp dữ liệu OSM
  (nhà, đường) sẽ không hiển thị.
  - mapService.js: searchPortsWithSerpApi sẽ trả về mảng rỗng. mockAiScanPort và generateGridForPolygon vẫn hoạt động bình thường.
  - auditService.js: Hoạt động hoàn toàn offline nhờ sử dụng IndexedDB.

  Các bước Demo cơ bản (khi đã reset):

  1. MapPage: Vẽ một polygon tùy chỉnh trên bản đồ, sau đó bấm nút Create Grid để tạo slots container.
  2. Operations: Tạo một task mới bằng cách chọn container nguồn và đích từ danh sách slots trên bản đồ.
  3. Quan sát: Theo dõi task chuyển trạng thái (PENDING → IN_PROGRESS → COMPLETED) trên panel Operations.
  4. Kiểm tra: Xem container đã được di chuyển đúng vị trí trên Inventory và lịch sử giao dịch đã được ghi lại trên AuditTrail.

  Lưu ý Hiệu năng:

  - CanvasSlotLayer: Render hiệu quả 10,000+ slots nhờ vẽ trực tiếp lên Canvas.
  - Zustand Interactions: Hạn chế dispatch actions liên tục trong các vòng lặp hiệu năng cao (như animation loop).
  - Large Assets: Tối ưu hóa kích thước file ảnh (hero.png); sử dụng ảnh lớn hơn có thể ảnh hưởng thời gian tải ban đầu.