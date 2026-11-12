# GK_ReactNative — Ứng dụng Quản lý Giảng viên (`QLHocPhan`)

Đề thi giữa kỳ **Lập trình đa nền tảng**: Xây dựng ứng dụng quản lý giảng viên ở phân hệ Admin (nhập, hiển thị, sửa, xóa, đăng nhập, upload hình ảnh và các chức năng nâng cao) sử dụng **React Native (Expo Go + Expo Web)**, **NestJS**, và **MongoDB (Mongoose)**.

---

## 1. Cấu trúc thư mục

```text
GK_ReactNative/
├── backend/        # API NestJS + Mongoose (kết nối MongoDB Atlas)
├── app/            # Ứng dụng React Native (Expo Web & Expo Go Mobile)
└── README.md
```

---

## 2. Cấu trúc Cơ sở dữ liệu MongoDB

- **Database**: `QLHocPhan`
- **Collection**: `GiangVien`
- **Các trường dữ liệu** (tuân thủ chặt chẽ đề bài, tắt `versionKey` và `timestamps` trong Mongoose nên không tự sinh thêm `__v`, `createdAt`, `updatedAt`):

| Tên trường | Kiểu dữ liệu | Mô tả |
| --- | --- | --- |
| `IDGV` | `String` (unique, required) | Mã giảng viên |
| `Fullname` | `String` (required) | Họ và tên giảng viên |
| `Image` | `String` (required) | Đường dẫn ảnh hoặc ảnh đã upload (`/uploads/...`) |
| `SumClass` | `Number` (int >= 0, required) | Tổng số lớp giảng dạy |

---

## 3. Thư viện sử dụng & Lệnh cài đặt

### Backend (`backend/`)
- `@nestjs/mongoose`, `mongoose` — Kết nối MongoDB Atlas và định nghĩa Schema
- `@nestjs/config` — Đọc biến môi trường từ `.env`
- `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt` — Xác thực đăng nhập Admin bằng JWT
- `@nestjs/serve-static`, `multer` — Upload và phục vụ ảnh tĩnh `/uploads/*`
- `class-validator`, `class-transformer` — Kiểm tra dữ liệu đầu vào (DTO)

Lệnh cài đặt:
```bash
cd backend
npm install
```

### Frontend (`app/`)
- `expo`, `react-native` — Nền tảng React Native Expo
- `react-native-web`, `react-dom`, `@expo/metro-runtime` — Chạy trên nền tảng Web
- `expo-image-picker` — Chọn ảnh từ thư viện thiết bị (Web & Mobile) hoặc chụp ảnh bằng Camera (Mobile)
- `@react-native-async-storage/async-storage` — Lưu JWT token và cấu hình Server URL
- `axios`, `expo-constants`, `@expo/vector-icons`, `react-native-safe-area-context`

Lệnh cài đặt:
```bash
cd app
npm install
```

---

## 4. Cấu hình & Khởi chạy

### Bước 1: Cấu hình MongoDB Atlas cho Backend
Sao chép `backend/.env.example` thành `backend/.env` (hoặc chỉnh sửa trực tiếp `backend/.env`):
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/QLHocPhan?retryWrites=true&w=majority
PORT=3000
JWT_SECRET=qlhocphan-super-secret-jwt-key-2026
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### Bước 2: Chạy Backend (NestJS)
```bash
cd backend
npm run start:dev
```
- API chạy tại `http://localhost:3000` (lắng nghe trên `0.0.0.0:3000` để thiết bị di động dùng Expo Go qua cùng mạng LAN kết nối được).
- Tài khoản đăng nhập mặc định: `admin` / `admin123`.

### Bước 3: Chạy Frontend trên Web
```bash
cd app
npm run web
```
Mở trình duyệt tại địa chỉ Expo hiển thị (mặc định `http://localhost:8081`).

### Bước 4: Chạy Frontend trên Điện thoại (Expo Go)
1. Đảm bảo điện thoại và máy tính **cùng mạng Wi-Fi LAN**.
2. Mở ứng dụng **Expo Go** trên Android / iOS.
3. Chạy lệnh:
   ```bash
   cd app
   npm start
   ```
4. Quét mã QR trên terminal bằng Expo Go.
5. App tự động nhận LAN IP của máy dev (`http://<LAN_IP>:3000`). Nếu cần chỉnh lại thủ công, nhấn **"Cấu hình địa chỉ API Server"** ngay tại màn hình Đăng nhập.

---

## 5. Các API Endpoints chính

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `POST` | `/auth/login` | Đăng nhập Admin, trả về JWT `access_token` |
| `GET` | `/auth/me` | Lấy thông tin Admin đang đăng nhập |
| `GET` | `/giang-vien` | Lấy danh sách giảng viên (hỗ trợ `search`, `sortBy`, `order`, `minSumClass`, `maxSumClass`) |
| `GET` | `/giang-vien/stats` | Thống kê tổng giảng viên, tổng số lớp, trung bình lớp/GV, GV nhiều lớp nhất |
| `GET` | `/giang-vien/export` | Xuất JSON sạch chỉ gồm 4 trường `IDGV`, `Fullname`, `Image`, `SumClass` |
| `POST` | `/giang-vien/upload` | Upload file ảnh (`JPG/PNG/WEBP/GIF`, tối đa 5MB) |
| `GET` | `/giang-vien/:id` | Xem chi tiết một giảng viên |
| `POST` | `/giang-vien` | Thêm giảng viên mới (chống trùng `IDGV`) |
| `PATCH` | `/giang-vien/:id` | Cập nhật thông tin giảng viên |
| `DELETE` | `/giang-vien/:id` | Xóa giảng viên |

---

## 6. Các chức năng đã hoàn thành

- **Đăng nhập Admin (JWT)** + lưu phiên đăng nhập, tự động đăng xuất khi token hết hạn.
- **Thêm / Xem / Sửa / Xóa** giảng viên trong `QLHocPhan.GiangVien`.
- **Nhập & hiển thị hình ảnh trên Web và Mobile**: Chọn ảnh từ máy/thư viện, chụp ảnh bằng Camera trên Expo Go, hoặc dán URL ảnh; xem trước ảnh và xem chi tiết giảng viên.
- **Thống kê Dashboard**: Tổng giảng viên, tổng số lớp (`SumClass`), trung bình lớp/GV, giảng viên dạy nhiều lớp nhất.
- **Tìm kiếm, Lọc & Sắp xếp**: Tìm theo `IDGV` hoặc `Fullname`, lọc theo số lớp (`Tất cả`, `≥ 5 lớp`, `< 5 lớp`), sắp xếp tăng/giảm theo `IDGV`, `Fullname`, `SumClass`.
- **Xuất file CSDL JSON (`QLHocPhan.GiangVien.json`)**: Nút **Xuất JSON** ngay trên giao diện giúp tải trực tiếp file dữ liệu sạch đúng 4 trường để nộp bài.
- **Giao diện Responsive**: Hiển thị dạng bảng trên trình duyệt Web và dạng thẻ (Card) tối ưu cảm ứng trên di động.

---

## 7. Kiểm thử

```bash
# Kiểm tra build & unit tests Backend
cd backend
npm run build
npm test

# Kiểm tra TypeScript & bundle Web Frontend
cd app
npx tsc --noEmit
npx expo export --platform web
```
