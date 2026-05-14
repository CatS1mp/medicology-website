# Website API Guideline — Medicology (Next.js)

## 1. Mục đích tài liệu
Hướng dẫn Website (Next.js) gọi API qua API Gateway một cách thống nhất, an toàn, không rò rỉ PHI.

## 2. Base URL và tài liệu kỹ thuật
- Dùng biến môi trường: `NEXT_PUBLIC_API_BASE_URL`
- Local gợi ý: `http://localhost:8080`

## 3. Authentication và quy ước chung
### 3.1 Authentication
- Sử dụng Bearer JWT (ưu tiên tồn tại trong cookie HttpOnly do backend thiết lập).
- Với SSR/Route Handler: đọc token từ cookie an toàn; với CSR: hạn chế chèn Bearer trong JS khi không cần thiết.

Header chuẩn:
```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
X-Correlation-Id: <uuid>
```

### 3.2 Kiểu lỗi
Ví dụ format lỗi thống nhất hiển thị ở FE (không lộ chi tiết nội bộ):
```json
{
  "status": 401,
  "message": "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại"
}
```
- Không hiển thị stack trace/chi tiết nội bộ.

### 3.3 Quy ước response
- FE hiển thị dữ liệu theo DTO được service trả về; tôn trọng phân trang/sort theo quy ước.
- Không lưu PHI vào `localStorage/sessionStorage`.

## 4. Mapping theo màn hình (ví dụ)
| Màn hình/Flow | Endpoint |
| --- | --- |
| Đăng nhập | `POST /auth/login`
| Tra cứu từ điển | `GET /dictionary/...`
| Học/Quiz/tiến độ | `GET /learning/...`
| Đánh giá lâm sàng | `POST /assessments` / `GET /assessments/{id}`

## 5. Ghi chú triển khai
- Sử dụng fetch wrapper chung (thêm Correlation-Id, xử lý lỗi 401/403 toàn cục, retry có kiểm soát).
- Làm sạch HTML đầu vào với DOMPurify trước khi render.

## 6. Webhook / callback
- Không áp dụng.

## 7. Hợp đồng với service khác
- Mọi gọi API đi qua `API Gateway`; tuân thủ rate-limit/quota nếu có.

---

*Cập nhật lần cuối: 2026-05-14 — Web team*
