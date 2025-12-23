# ShareCare - Exchange Workflow

## Tổng quan

ShareCare là nền tảng **chia sẻ miễn phí** vật phẩm, kiến thức và hỗ trợ tinh thần trong cộng đồng.

**Không phải marketplace** → Không cần:

- ❌ Payment system
- ❌ Dispute handling phức tạp
- ❌ Rating system
- ❌ Verification codes
- ❌ Multiple confirmation steps

## Workflow đơn giản

```
┌─────────────────────────────────────────────────────────────┐
│                    SHARECARE WORKFLOW                       │
└─────────────────────────────────────────────────────────────┘

   NGƯỜI NHẬN                              NGƯỜI CHO
  (Receiver)                               (Giver)
      │                                       │
      │         "Gửi yêu cầu xin"            │
      │ ─────────────────────────────────►   │
      │                                       │
      │                              [REQUESTED]
      │                                       │
      │                              Chấp nhận?
      │                               /      \
      │                             YES      NO
      │                              │        │
      │         "Đã chấp nhận"      │        │
      │ ◄─────────────────────────── │        │
      │                              │        │
 [ACCEPTED]                          │   [DECLINED]
      │                              │
      │      💬 Chat hẹn gặp 💬      │
      │ ◄───────────────────────────►│
      │                              │
      │      "Xác nhận hoàn thành"   │
      │ ─────── hoặc ────────────────│
      │                              │
 [COMPLETED] ◄──────────────────► [COMPLETED]
```

## Status (Trạng thái)

| Status      | Tên tiếng Việt    | Mô tả                                       |
| ----------- | ----------------- | ------------------------------------------- |
| `requested` | Đang chờ xác nhận | Receiver đã gửi yêu cầu, chờ Giver phản hồi |
| `accepted`  | Đã chấp nhận      | Giver đồng ý, 2 bên chat để hẹn gặp         |
| `completed` | Hoàn thành        | Đã giao nhận vật phẩm thành công            |
| `cancelled` | Đã hủy            | Một trong 2 bên hủy giao dịch               |
| `declined`  | Đã từ chối        | Giver từ chối yêu cầu                       |

## Vai trò

### GIVER (Người cho)

- **Là ai?** Tác giả của bài đăng (Post author)
- **Có thể làm gì?**
  - ✅ Chấp nhận yêu cầu (`accept`)
  - ✅ Từ chối yêu cầu (`decline`)
  - ✅ Xác nhận hoàn thành (`complete`)
  - ✅ Hủy giao dịch (`cancel`)

### RECEIVER (Người nhận)

- **Là ai?** Người gửi yêu cầu xin vật phẩm (không phải tác giả)
- **Có thể làm gì?**
  - ✅ Gửi yêu cầu nhận (`request`)
  - ✅ Xác nhận hoàn thành (`complete`)
  - ✅ Hủy giao dịch (`cancel`)

## API Endpoints

### Query

```
GET /api/exchanges/chat/:chatId     - Lấy exchange theo chat
GET /api/exchanges/my-exchanges     - Lấy danh sách exchanges của user
```

### Actions

```
POST   /api/exchanges                    - Tạo yêu cầu (Receiver)
PATCH  /api/exchanges/:id/accept         - Chấp nhận (Giver)
PATCH  /api/exchanges/:id/decline        - Từ chối (Giver)
PATCH  /api/exchanges/:id/complete       - Hoàn thành (Both)
PATCH  /api/exchanges/:id/cancel         - Hủy (Both)
```

## User Flow

### Receiver Flow (Người muốn nhận)

1. **Tìm vật phẩm** → Browse posts hoặc search
2. **Mở chat** → Click vào bài đăng để chat với người cho
3. **Gửi yêu cầu** → Click "Gửi yêu cầu" trong widget
4. **Chờ đợi** → Chờ người cho phản hồi
5. **Chat hẹn gặp** → Sau khi được chấp nhận, thống nhất thời gian/địa điểm
6. **Gặp mặt** → Đến nhận vật phẩm
7. **Xác nhận** → Click "Xác nhận đã nhận"

### Giver Flow (Người muốn cho)

1. **Đăng bài** → Tạo bài đăng với vật phẩm muốn cho
2. **Nhận thông báo** → Khi có người gửi yêu cầu
3. **Xem xét** → Đọc tin nhắn, xem profile người xin
4. **Quyết định** → Chấp nhận hoặc từ chối
5. **Chat hẹn gặp** → Thống nhất thời gian/địa điểm
6. **Giao vật phẩm** → Gặp và giao
7. **Xác nhận** → Click "Xác nhận đã giao"

## Post Status

Exchange workflow tự động cập nhật Post status:

| Khi            | Post Status             |
| -------------- | ----------------------- |
| Có yêu cầu mới | `available` → `pending` |
| Bị từ chối/hủy | `pending` → `available` |
| Hoàn thành     | `pending` → `donated`   |

## Cancel Reasons (Lý do hủy)

| Code            | Vietnamese         |
| --------------- | ------------------ |
| `changed_mind`  | Đổi ý              |
| `not_available` | Vật phẩm không còn |
| `no_response`   | Không phản hồi     |
| `cannot_meet`   | Không thể hẹn gặp  |
| `other`         | Lý do khác         |

## Frontend Components

### ExchangeWidget

Widget chính hiển thị trong chat để quản lý quy trình

```jsx
<ExchangeWidget
  post={post}
  exchange={exchange}
  onExchangeUpdate={handleUpdate}
  onRequestExchange={handleRequest}
/>
```

### MeetingScheduler (Optional)

Modal để hẹn lịch gặp - có thể dùng hoặc chat trực tiếp

## File Structure

```
backend/
  src/
    models/Exchange.js          # Schema đơn giản với 5 status
    services/ExchangeService.js # Logic xác định role, transitions
    controllers/ExchangeController.js
    routes/exchangeRoutes.js

frontend/
  src/
    services/exchangeService.js        # API client
    components/chat/
      ExchangeWidget.jsx               # Main widget
      MeetingScheduler.jsx             # Optional scheduler
```

## Best Practices

1. **Chat trước khi gặp** - Trao đổi kỹ qua chat
2. **Gặp nơi công cộng** - Chọn địa điểm an toàn
3. **Thông báo người thân** - Cho biết địa điểm gặp
4. **Kiểm tra vật phẩm** - Xem kỹ trước khi nhận
5. **Xác nhận nhanh chóng** - Click xác nhận ngay sau khi giao/nhận
