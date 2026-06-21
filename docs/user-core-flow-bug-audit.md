# Audit bug core flow Parent/User

Ngày audit: 2026-06-21  
Phạm vi: Parent/User, production read-only và API thật trên database `mommate_core_audit_20260621`  
Trạng thái tài liệu: Audit only — chưa sửa source code

## 1. Kết luận

- `BLOCKER`: 1
- `CRITICAL`: 13
- `HIGH`: 21
- `MEDIUM`: 8
- `LOW`: 3
- `CANNOT_REPRODUCE`: 3
- `N/A`: 2

Core flow chưa đủ an toàn để mở cho người dùng thật. Lỗi nghiêm trọng nhất là API đăng ký cho phép client tự gán role `admin`. Luồng booking có thể báo giá ngoài lịch công bố, không giữ slot, không gắn hồ sơ chăm sóc và booking tại nhà không có tọa độ đích để xác thực GPS. Sau dịch vụ, parent không thể mở lại booking completed từ danh sách, không xem care journal và trang review không đọc response phân trang.

## 2. Phương pháp và bằng chứng

- Quét production read-only trên desktop `1280x900` và mobile `390x844` cho 21 route.
- Không tạo booking, payment, review hoặc incident trên production.
- Seed và chạy integration bằng API thật trên database audit riêng:
  - Login đủ parent, carer, admin.
  - Care-profile CRUD.
  - Marketplace service/carer.
  - Quote, tạo booking, carer accept.
  - Conversation, gửi message.
  - Reschedule request, incident.
  - Care journal và duplicate review sau dịch vụ.
- Kết quả integration nền: `Role integration OK`, care-profile CRUD pass, admin authorization pass, PDF export admin pass.
- Flow audit thực tế:
  - Guest `/bookings/my` và POST `/reviews`: `401`.
  - Tự đăng ký role admin: `201`, response role `admin`.
  - Quote lúc `02:00`, ngoài lịch công bố: `200`, `available: true`.
  - Booking tại nhà được tạo: `201`, `location.coordinates: null`.
  - Carer accept: `200`, `accepted_pending_payment`.
  - Conversation/message: `200/201`.
  - Reschedule: `201`, `auto_approved`.
  - Incident: `201`.
  - Parent GET care journal completed booking: `200`, body `null`.

Lưu ý môi trường: lần seed đầu đọc nhầm đường dẫn `.env`, nên script idempotent đã chạy trên database mặc định của URI local trước khi audit database riêng được xác nhận. Script chỉ upsert bộ demo cố định, không xóa dữ liệu. Không thực hiện cleanup tự động để tránh xóa nhầm demo data có sẵn.

## 3. Inventory route Parent/User

| Route | Vai trò | API chính | Kết quả audit |
|---|---|---|---|
| `/`, `/about` | Public | services, reviews | Load được |
| `/services`, `/services/:id` | Public | `GET /services` | Load được; còn lỗi error state/taxonomy |
| `/carers`, `/carers/:id` | Public | `GET /carers` | Load được; lọc trạng thái carer chưa đúng |
| `/signup`, `/login` | Guest | auth | Login pass; register có privilege escalation |
| `/booking` | Parent | quote, create booking | Thiếu route guard, hồ sơ chăm sóc, availability và slot hold |
| `/account/request` | Parent | bookings, conversation | Guest không redirect; pagination/status sai |
| `/account/request/:id` | Parent/Carer | booking, journal, refund | Dữ liệu hard-code; parent không xem journal |
| `/bookings/:id/change` | Parent/Carer | change request | Không giới hạn terminal state/availability |
| `/payment`, `/payment/success` | Parent | PayOS, payment status | UI QR/thẻ giả; timer và receipt sai nguồn |
| `/messages/:id` | Parent/Carer | messages, Socket.IO | REST chạy; realtime production 404 |
| `/account/profile` | Parent | user, care profiles | CRUD pass |
| `/review` | Parent | bookings, reviews | Hỏng với response phân trang |
| `/incidents/new` | Parent/Carer | incidents | Submit pass; thiếu upload/tracking |
| `/help`, `/contact`, `/faq`, `/guide` | Public | — | Load được; contact không có kênh liên hệ |
| `/privacy`, `/terms`, `/careers` | Public | — | Load được |
| Route không tồn tại | Public | — | NotFound hoạt động |

## 4. Danh sách bug

### AUTH-001 — Client tự đăng ký tài khoản admin

- Severity/Status: `BLOCKER / OPEN`
- Route: `POST /api/auth/register`
- Tái hiện: gửi payload đăng ký kèm `"role": "admin"`.
- Expected: public registration luôn tạo `parent`; role đặc quyền chỉ do admin cấp.
- Actual: API trả `201` và token của user role `admin`.
- Bằng chứng: `authController.ts:59,75`; API audit trả `{ status: 201, role: "admin" }`.
- Tác động: chiếm toàn quyền dashboard, user, booking, payout và audit.
- Phạm vi sửa: bỏ role khỏi public payload, whitelist parent, thêm validation và regression authorization.

### AUTH-002 — Phần lớn route private không có frontend guard

- Severity/Status: `HIGH / OPEN`
- Route: `/account/request`, booking detail/change, payment, review, incident, messages.
- Tái hiện: mở trực tiếp các route khi chưa đăng nhập.
- Expected: redirect `/login?returnUrl=...`.
- Actual: trang vẫn render, phát request `401`; riêng `/account/profile` mới redirect login.
- Bằng chứng: `App.tsx:117-123,135-136`; production smoke ghi nhận `/account/request`, `/review`, `/messages/invalid` giữ nguyên URL và nhận `401`.
- Tác động: UX lỗi, trang trống/giả, mất URL quay lại sau login.
- Phạm vi sửa: ProtectedRoute theo role và return URL.

### AUTH-003 — Access token lưu trong localStorage

- Severity/Status: `MEDIUM / OPEN`
- Route: toàn bộ authenticated app.
- Tái hiện: đăng nhập và kiểm tra `localStorage.userInfo`.
- Expected: access token được giới hạn rủi ro hoặc session strategy được harden.
- Actual: token bearer nằm trong localStorage và được đọc trên mọi request/socket.
- Bằng chứng: `AuthContext.tsx`, `api.ts`, `socket.ts`.
- Tác động: XSS có thể lấy token và chiếm session.
- Phạm vi sửa: đánh giá chuyển access token sang memory/BFF-cookie, CSP và token rotation.

### MARKET-001 — Marketplace hiển thị carer đã ngừng nhận booking

- Severity/Status: `HIGH / OPEN`
- Route: `GET /api/carers`, `/carers`.
- Tái hiện: carer verified nhưng `acceptingBookings=false`.
- Expected: không xuất hiện trong marketplace.
- Actual: public filter chỉ kiểm tra verified/isDeleted; `acceptingBookings` chỉ được dùng khi tính facets/service stats.
- Bằng chứng: `carerController.ts:122-127,217`.
- Tác động: user chọn hồ sơ nhưng quote trả “not found/unavailable”.
- Phạm vi sửa: thống nhất publicCarerMatch cho list, detail và service stats.

### MARKET-002 — Có thể mở hồ sơ carer chưa verified bằng URL

- Severity/Status: `HIGH / OPEN`
- Route: `/carers/:id`, `GET /api/carers/:id`.
- Tái hiện: truy cập ObjectId carer draft/pending.
- Expected: public API chỉ trả carer verified và đang công khai.
- Actual: detail chỉ lọc `_id` và `isDeleted=false`.
- Bằng chứng: `carerController.ts:236-242`.
- Tác động: lộ hồ sơ/chứng chỉ draft; user có thể đi tiếp vào booking.
- Phạm vi sửa: public detail match cùng rule listing; route admin/me dùng endpoint riêng.

### MARKET-003 — Filter category không có taxonomy thống nhất

- Severity/Status: `HIGH / OPEN`
- Route: `/services`.
- Tái hiện: frontend gửi category tiếng Việt trong khi seed/API đang dùng giá trị như `postpartum`, `consultation`.
- Expected: category dùng enum/key ổn định, label chỉ để hiển thị.
- Actual: backend so khớp chuỗi tuyệt đối.
- Bằng chứng: `FindService.tsx` category chips; `seedDynamicApp.ts` category seed.
- Tác động: bấm category có thể trả danh sách rỗng dù có dịch vụ.
- Phạm vi sửa: category key enum và mapping label dùng chung.

### MARKET-004 — API lỗi bị hiển thị như “không có kết quả”

- Severity/Status: `MEDIUM / OPEN`
- Route: `/services`, `/carers`.
- Tái hiện: làm `GET /services` hoặc `/carers` lỗi.
- Expected: error state có retry và thông báo khác empty state.
- Actual: catch chỉ log; state list rỗng.
- Bằng chứng: `FindService.tsx`, `FindCarer.tsx`.
- Tác động: người dùng hiểu sai rằng marketplace không có dịch vụ/carer.
- Phạm vi sửa: `error`, retry, last successful data và empty state riêng.

### MARKET-005 — Không có date/time availability thực khi chọn carer

- Severity/Status: `CRITICAL / OPEN`
- Route: quote/booking.
- Tái hiện: quote `02:00` trong ngày carer chỉ công bố `08:00-12:00`, `13:00-17:00`.
- Expected: `available=false` hoặc `400`.
- Actual: `200`, `available=true`.
- Bằng chứng: API audit; `bookingController.ts:120` chỉ kiểm tra booking conflict, không kiểm tra `carer.availability`.
- Tác động: user đặt lịch ngoài giờ làm việc công bố.
- Phạm vi sửa: timezone-aware availability validator dùng chung cho quote/create/reschedule.

### BOOK-001 — Không giữ slot và không có idempotency/transaction

- Severity/Status: `CRITICAL / OPEN`
- Route: `POST /bookings/quote`, `POST /bookings`.
- Tái hiện: nhiều client quote/create cùng slot gần đồng thời.
- Expected: slot hold có hạn, idempotency key và atomic conflict protection.
- Actual: quote chỉ trả `expiresAt`; create không nhận quote ID, không lưu hold và dùng find-then-create.
- Bằng chứng: `bookingController.ts:120,135,209,213`.
- Tác động: double booking/race condition; expiry 5 phút không có hiệu lực.
- Phạm vi sửa: BookingHold/index/transaction hoặc atomic reservation.

### BOOK-002 — Booking nhiều buổi chỉ tạo một lịch duy nhất

- Severity/Status: `CRITICAL / OPEN`
- Route: `/booking`, booking model.
- Tái hiện: chọn 5/10 sessions.
- Expected: mỗi session có ngày/giờ hoặc recurrence rõ ràng và được conflict-check.
- Actual: chỉ có một `scheduledAt/scheduledEndAt`; tổng tiền nhân sessions nhưng lịch chỉ giữ buổi đầu.
- Bằng chứng: `Booking.tsx:40-41`; `bookingController.ts:207-240`; model chỉ có một khoảng thời gian.
- Tác động: thanh toán nhiều buổi nhưng hệ thống không quản lý lịch còn lại.
- Phạm vi sửa: booking sessions/recurrence model và quote từng occurrence.

### BOOK-003 — Booking tại nhà không có tọa độ đích, GPS check-in bị vô hiệu hóa

- Severity/Status: `CRITICAL / OPEN`
- Route: create booking, check-in.
- Tái hiện: tạo booking từ UI; inspect booking location.
- Expected: địa chỉ tại nhà phải geocode/lưu tọa độ trước khi xác nhận.
- Actual: frontend không gửi latitude/longitude; API audit tạo booking với `location=null`. Check-in chỉ tính radius nếu coordinates tồn tại.
- Bằng chứng: `bookingController.ts:221`; API audit `targetCoordinates:null`.
- Tác động: carer có thể gửi GPS ở bất kỳ đâu và vẫn check-in.
- Phạm vi sửa: address picker/geocoding, bắt buộc coordinates cho at-home, từ chối check-in khi thiếu target.

### BOOK-004 — Booking không gắn hồ sơ chăm sóc đã lưu

- Severity/Status: `HIGH / OPEN`
- Route: `/booking`, Booking model.
- Tái hiện: parent có care profile rồi đặt lịch.
- Expected: chọn một/nhiều care profile; booking lưu snapshot và reference.
- Actual: form nhập lại dữ liệu rời; không có careProfileId/snapshot.
- Bằng chứng: `Booking.tsx`; Booking model không có care-profile relation.
- Tác động: dữ liệu mẹ/bé không nhất quán, carer không nhận đúng hồ sơ.
- Phạm vi sửa: selector, snapshot bất biến tại booking và quyền truy cập cho assigned carer.

### BOOK-005 — Default thị trường và gói đặt lịch sai

- Severity/Status: `HIGH / OPEN`
- Route: `/booking`.
- Tái hiện: mở form lần đầu.
- Expected: Đà Nẵng và option theo service.
- Actual: mặc định Hồ Chí Minh, 10 buổi, 4 giờ.
- Bằng chứng: `Booking.tsx:25,40-41`.
- Tác động: tăng khả năng submit sai khu vực và chi phí rất lớn.
- Phạm vi sửa: default Đà Nẵng/profile address; options lấy từ service/session policy.

### BOOK-006 — Không thể chọn dịch vụ online

- Severity/Status: `HIGH / OPEN`
- Route: `/booking`.
- Tái hiện: đặt dịch vụ tư vấn online.
- Expected: chọn `at_home/online`; online không yêu cầu địa chỉ/GPS.
- Actual: frontend không gửi `serviceMode`; backend mặc định `at_home`.
- Bằng chứng: `Booking.tsx`; `bookingController.ts:220`.
- Tác động: booking online bị xử lý như tại nhà.
- Phạm vi sửa: service mode theo capability của service và validation riêng.

### BOOK-007 — Tuyên bố giá/VAT/an toàn không có dữ liệu nghiệp vụ hỗ trợ

- Severity/Status: `MEDIUM / OPEN`
- Route: `/booking`.
- Tái hiện: xem summary/trust card.
- Expected: chỉ hiển thị cam kết có nguồn dữ liệu/chính sách thật.
- Actual: hard-code “đã gồm VAT”, “100%”, kiểm tra sức khỏe định kỳ và hotline 24/7.
- Bằng chứng: `Booking.tsx:370,384-386`.
- Tác động: misleading claim và rủi ro compliance.
- Phạm vi sửa: lấy policy/config thật hoặc bỏ nội dung.

### BOOK-008 — Bất kỳ role authenticated nào cũng có thể tạo booking như parent

- Severity/Status: `HIGH / OPEN`
- Route: `POST /api/bookings`.
- Tái hiện: gọi create booking bằng token carer/admin.
- Expected: authorize `parent`.
- Actual: route chỉ `protect`; controller dùng `req.user._id` làm parent.
- Bằng chứng: `bookingRoutes.ts`; `bookingController.ts:213`.
- Tác động: dữ liệu booking sai role và phá thống kê/nghiệp vụ.
- Phạm vi sửa: `authorize('parent')` cho quote/create/payment/review phù hợp.

### REQUEST-001 — Tab “Chờ xác nhận” bỏ sót `pending_carer`

- Severity/Status: `HIGH / OPEN`
- Route: `/account/request`.
- Tái hiện: booking status `pending_carer`, chọn tab Chờ xác nhận.
- Expected: booking xuất hiện.
- Actual: tab value là `pending`; filter dùng equality, dù labels có `pending_carer`.
- Bằng chứng: `AccountRequests.tsx:20,45`.
- Tác động: user tưởng booking mới biến mất.
- Phạm vi sửa: tab map nhiều status hoặc filter phía backend.

### REQUEST-002 — Tải tối đa 100 booking rồi filter phía frontend

- Severity/Status: `HIGH / OPEN`
- Route: `/account/request`.
- Tái hiện: tài khoản có hơn 100 booking hoặc cần filter toàn bộ lịch sử.
- Expected: backend filter/status/pagination.
- Actual: request cố định `page=1&limit=100`, tab filter local.
- Bằng chứng: `AccountRequests.tsx:34,45`.
- Tác động: thiếu dữ liệu, count sai và không có pagination.
- Phạm vi sửa: query theo tab, pagination chuẩn và URL state.

### REQUEST-003 — Booking completed không có nút Chi tiết

- Severity/Status: `CRITICAL / OPEN`
- Route: `/account/request`.
- Tái hiện: xem row completed.
- Expected: mở detail để xem journal, hóa đơn, incident và review.
- Actual: nút Chi tiết chỉ render khi `!isCompleted`; completed chỉ có Đánh giá.
- Bằng chứng: `AccountRequests.tsx:89,92`.
- Tác động: chặn toàn bộ hậu dịch vụ và care journal.
- Phạm vi sửa: detail luôn khả dụng; CTA phụ thuộc state.

### REQUEST-004 — Thiếu cancelled/rejected/paid-confirmed trong tabs và labels

- Severity/Status: `MEDIUM / OPEN`
- Route: `/account/request`.
- Tái hiện: booking cancelled, rejected, paid_confirmed hoặc confirmed.
- Expected: trạng thái có nhãn/tab hợp lệ.
- Actual: tabs không bao phủ; labels fallback chuỗi enum.
- Bằng chứng: `AccountRequests.tsx` tabs/labels.
- Tác động: khó tìm lịch, UI lộ technical status.
- Phạm vi sửa: state presentation map đầy đủ.

### REQUEST-005 — Không có error/empty state và lỗi chat không được bắt

- Severity/Status: `HIGH / OPEN`
- Route: `/account/request`.
- Tái hiện: bookings hoặc create conversation trả lỗi.
- Expected: lỗi có retry; button phục hồi.
- Actual: bookings chỉ console.error; conversation click có unhandled rejection.
- Bằng chứng: `AccountRequests.tsx:34-42`.
- Tác động: trang trắng hoặc CTA im lặng.
- Phạm vi sửa: loading/error/empty, disable/retry và toast.

### DETAIL-001 — Booking detail hiển thị dữ liệu hard-code thay dữ liệu booking

- Severity/Status: `CRITICAL / OPEN`
- Route: `/account/request/:id`, `/carer/bookings/:id`.
- Tái hiện: mở bất kỳ booking thật.
- Expected: carer, mẹ/bé, địa chỉ, lịch, nội dung và giá từ API.
- Actual: có `Baby Avocado`, `123 Bạch Đằng`, `24/06/2026`, “10 năm kinh nghiệm”, fallback giá 10 triệu và avatar cố định.
- Bằng chứng: `BookingDetail.tsx:88,96,99,123,131,142,158`.
- Tác động: hiển thị sai dữ liệu y tế/lịch/địa chỉ cho người dùng và carer.
- Phạm vi sửa: booking DTO + care profile snapshot + shared formatter; không dùng fallback giả.

### DETAIL-002 — Timeline booking luôn cố định ở bước thanh toán

- Severity/Status: `HIGH / OPEN`
- Route: booking detail.
- Tái hiện: mở pending, in_progress, completed hoặc cancelled.
- Expected: timeline từ status/statusHistory.
- Actual: hai bước đầu luôn done, bước ba luôn current.
- Bằng chứng: `BookingDetail.tsx:114`.
- Tác động: user hiểu sai trạng thái dịch vụ.
- Phạm vi sửa: state-machine-to-timeline mapper, cancelled/rejected branch.

### DETAIL-003 — Parent không xem được care journal

- Severity/Status: `CRITICAL / OPEN`
- Route: booking detail completed.
- Tái hiện: parent mở booking completed.
- Expected: GET và render journal sau checkout.
- Actual: frontend chỉ GET journal khi role carer; parent branch không render journal.
- Bằng chứng: `BookingDetail.tsx:32,44`; backend cho phép parent GET.
- Tác động: mất deliverable chính sau ca chăm sóc.
- Phạm vi sửa: tải journal cho parent completed và render read-only.

### DETAIL-004 — CTA đổi/hủy và incident không phụ thuộc trạng thái

- Severity/Status: `HIGH / OPEN`
- Route: booking detail.
- Tái hiện: mở completed/cancelled/rejected.
- Expected: chỉ action hợp lệ theo state machine.
- Actual: nút Đổi/Hủy và Hỗ trợ luôn hiển thị.
- Bằng chứng: `BookingDetail.tsx:110`.
- Tác động: dẫn user vào flow backend không hợp lệ.
- Phạm vi sửa: action policy dùng chung frontend/backend.

### CHANGE-001 — Backend nhận yêu cầu đổi/hủy cho terminal booking

- Severity/Status: `CRITICAL / OPEN`
- Route: `POST /bookings/:id/change-requests`.
- Tái hiện: gửi request cho completed/cancelled/rejected booking.
- Expected: `409` theo state machine.
- Actual: controller chỉ kiểm tra booking tồn tại và ownership, không validate status.
- Bằng chứng: `bookingController.ts:934-978`.
- Tác động: tạo request vô nghĩa, có thể thay đổi/cancel lịch đã hoàn tất.
- Phạm vi sửa: whitelist status và test terminal states.

### CHANGE-002 — Auto-reschedule không kiểm tra lịch khả dụng công bố

- Severity/Status: `CRITICAL / OPEN`
- Route: change request trước 24 giờ.
- Tái hiện: reschedule sang giờ ngoài availability nhưng không conflict booking.
- Expected: reject hoặc pending admin.
- Actual: chỉ kiểm tra conflict; request có thể `auto_approved`.
- Bằng chứng: API audit trả `auto_approved`; `bookingController.ts:963`.
- Tác động: tự đổi sang giờ carer không làm việc.
- Phạm vi sửa: dùng validator availability giống quote/create.

### PAYMENT-001 — UI hiển thị QR và form thẻ giả

- Severity/Status: `CRITICAL / OPEN`
- Route: `/payment`.
- Tái hiện: mở booking chờ thanh toán.
- Expected: chỉ redirect PayOS hoặc render QR thật do backend trả.
- Actual: QR giả và input tên/số thẻ/expiry/CVV không được dùng; nút chỉ tạo PayOS link.
- Bằng chứng: `Payment.tsx:178,183-185`.
- Tác động: làm người dùng tưởng website thu thập dữ liệu thẻ; rủi ro tin cậy/compliance.
- Phạm vi sửa: bỏ toàn bộ fake card form; render provider checkout/QR thật.

### PAYMENT-002 — Countdown giữ lịch là số tĩnh

- Severity/Status: `HIGH / OPEN`
- Route: `/payment`.
- Tái hiện: chờ trên trang hoặc reload.
- Expected: thời hạn thật từ slot hold/payment link.
- Actual: luôn hiển thị `9:47`; backend không có booking hold expiry được enforce.
- Bằng chứng: `Payment.tsx:158`; quote `expiresAt` không được lưu.
- Tác động: user bị thông báo sai về thời gian giữ lịch.
- Phạm vi sửa: payment/hold expiry từ backend hoặc bỏ timer.

### PAYMENT-003 — Poll webhook không xử lý lỗi

- Severity/Status: `MEDIUM / OPEN`
- Route: `/payment?payment=success`.
- Tái hiện: payment-status lỗi mạng/401/500 trong interval.
- Expected: bắt lỗi, retry có backoff và CTA kiểm tra lại.
- Actual: callback interval await API không có try/catch; dừng cứng sau 15 lần.
- Bằng chứng: `Payment.tsx:65-78`.
- Tác động: unhandled rejection, user mắc ở trạng thái chờ.
- Phạm vi sửa: polling state machine, backoff và manual retry.

### PAYMENT-004 — Receipt dùng booking ID và carer placeholder thay giao dịch thật

- Severity/Status: `HIGH / OPEN`
- Route: `/payment/success`.
- Tái hiện: mở payment success đã paid.
- Expected: transaction/order code và carer từ backend.
- Actual: Transaction ID là 8 ký tự cuối booking ID; carer luôn “Chuyên gia MomMate”.
- Bằng chứng: `PaymentSuccess.tsx:65,71`.
- Tác động: biên nhận sai và khó đối soát.
- Phạm vi sửa: payment status DTO trả transaction; render populated carer.

### PAYMENT-005 — Trạng thái card luôn ghi “Đang chờ thanh toán”

- Severity/Status: `MEDIUM / OPEN`
- Route: `/payment`.
- Tái hiện: mở booking đã paid.
- Expected: trạng thái theo booking/payment.
- Actual: summary status hard-code chờ thanh toán.
- Bằng chứng: `Payment.tsx:158`.
- Tác động: mâu thuẫn với nút “Đã thanh toán”.
- Phạm vi sửa: status component theo payment state.

### PAYMENT-006 — “Hóa đơn điện tử” thực tế là file HTML

- Severity/Status: `MEDIUM / OPEN`
- Route: invoice download.
- Tái hiện: tải hóa đơn.
- Expected: định dạng hóa đơn được mô tả rõ; ưu tiên PDF nếu gọi là hóa đơn điện tử tải xuống.
- Actual: backend trả `text/html`, filename `.html`.
- Bằng chứng: `bookingController.ts:532-560`; `invoice.ts:6`.
- Tác động: trải nghiệm tải/in/chia sẻ không đúng kỳ vọng.
- Phạm vi sửa: PDF chuẩn hoặc đổi nhãn và metadata.

### REVIEW-001 — Trang review không đọc response `{ items, pagination }`

- Severity/Status: `CRITICAL / OPEN`
- Route: `/review`.
- Tái hiện: mở `/review?bookingId=<completed>` với API thật.
- Expected: tìm booking completed trong `data.items` hoặc GET detail.
- Actual: nếu response không phải array, code dùng `[]` và báo chỉ booking completed mới review.
- Bằng chứng: `Review.tsx:22-23`.
- Tác động: parent không thể review sau dịch vụ.
- Phạm vi sửa: GET booking detail trực tiếp hoặc parse list response chuẩn.

### REVIEW-002 — Trang review còn hard-code carer và ngày hoàn tất

- Severity/Status: `HIGH / OPEN`
- Route: `/review`.
- Tái hiện: mở review cho carer/booking bất kỳ.
- Expected: avatar, chức danh, verified state và completedAt thật.
- Actual: avatar asset cố định, fallback tên, chức danh và `20/8/2026`.
- Bằng chứng: `Review.tsx:7,53-54`.
- Tác động: người dùng có thể review nhầm người/dịch vụ.
- Phạm vi sửa: review eligibility DTO từ booking.

### REVIEW-003 — Các tiêu chí phụ và lựa chọn ẩn danh không được submit

- Severity/Status: `HIGH / OPEN`
- Route: `/review`.
- Tái hiện: tương tác tiêu chí phục vụ/chuyên môn/đúng giờ hoặc bỏ checkbox tên công khai.
- Expected: control thật và payload được lưu.
- Actual: tiêu chí chỉ là label tĩnh; checkbox không có state và payload chỉ gồm rating/comment.
- Bằng chứng: `Review.tsx:63,71`, `handlePost`.
- Tác động: UI hứa thu thập dữ liệu nhưng backend không nhận; lựa chọn riêng tư bị bỏ qua.
- Phạm vi sửa: bỏ control giả hoặc mở rộng schema/payload/anonymity.

### CHAT-001 — Realtime chat/notification không chạy trên Vercel serverless

- Severity/Status: `CRITICAL / OPEN`
- Route: `/messages/:id`, NotificationBell.
- Tái hiện: mở app production authenticated; client kết nối backend Socket.IO.
- Expected: socket server persistent, authenticated room hoạt động.
- Actual: Vercel logs ghi lặp `GET /socket.io/ 404`; REST message vẫn hoạt động nhưng không realtime.
- Bằng chứng: log production đã cung cấp; `socket.ts:5-9`; serverless entry chỉ export Express app.
- Tác động: không nhận tin nhắn/thông báo realtime, reconnect liên tục.
- Phạm vi sửa: deploy Socket.IO trên service persistent hoặc thay bằng managed realtime/SSE.

### CHAT-002 — Messages không có loading/error/retry và không rời room

- Severity/Status: `HIGH / OPEN`
- Route: `/messages/:id`.
- Tái hiện: GET messages/read/send lỗi hoặc chuyển conversation.
- Expected: error state, retry, send disabled; leave/disconnect room.
- Actual: promise rejection không được bắt; cleanup chỉ `off` listener.
- Bằng chứng: `Messages.tsx:17-35`.
- Tác động: trang trắng/im lặng, socket tiếp tục giữ room cũ.
- Phạm vi sửa: UI state đầy đủ và socket lifecycle.

### CHAT-003 — Không có inbox/danh sách conversation cho parent

- Severity/Status: `HIGH / OPEN`
- Route: API `GET /messages/conversations`.
- Tái hiện: user muốn quay lại cuộc trò chuyện nếu không đi từ booking row.
- Expected: route inbox và entry trong navigation.
- Actual: backend có API list nhưng frontend chỉ có route detail theo ID.
- Bằng chứng: `messagingRoutes.ts`; `App.tsx`.
- Tác động: conversation khó truy cập lại.
- Phạm vi sửa: `/messages` list với unread count và booking context.

### INCIDENT-001 — Evidence chỉ nhận URL thủ công, không có upload

- Severity/Status: `HIGH / OPEN`
- Route: `/incidents/new`.
- Tái hiện: muốn đính kèm ảnh/video/chứng từ từ thiết bị.
- Expected: upload file, progress, validation và URL do server quản lý.
- Actual: textarea “mỗi dòng một link”.
- Bằng chứng: `IncidentReport.tsx:20-22,39`.
- Tác động: user phổ thông khó cung cấp bằng chứng; URL ngoài có thể hết hạn.
- Phạm vi sửa: upload endpoint và attachment metadata.

### INCIDENT-002 — Parent không xem được trạng thái incident đã gửi

- Severity/Status: `CRITICAL / OPEN`
- Route: incidents.
- Tái hiện: parent submit incident rồi muốn xem tiến độ.
- Expected: `GET /incidents/my` hoặc booking incident timeline.
- Actual: GET incidents chỉ dành cho admin; frontend không có list/detail parent.
- Bằng chứng: `incidentRoutes.ts:7`.
- Tác động: support flow một chiều, user không biết kết quả xử lý.
- Phạm vi sửa: owner-scoped incident list/detail và notification deep link.

### INCIDENT-003 — Form không chặn thiếu bookingId trước khi submit

- Severity/Status: `MEDIUM / OPEN`
- Route: `/incidents/new`.
- Tái hiện: mở route không query `bookingId`.
- Expected: redirect chọn booking hoặc empty state.
- Actual: form vẫn render và gửi `bookingId:null`, chỉ lỗi sau submit.
- Bằng chứng: `IncidentReport.tsx:20`.
- Tác động: form mất công nhập rồi mới thất bại.
- Phạm vi sửa: route guard và booking summary.

### PROFILE-001 — Care profile CRUD

- Severity/Status: `CANNOT_REPRODUCE`
- Route: `/account/profile`, `/api/care-profiles`.
- Kết quả: create/update/list/delete pass trên database audit; future birth date trả `400`; primary profile được xử lý theo type.
- Ghi chú: booking vẫn chưa sử dụng care profile, được ghi ở `BOOK-004`.

### CONTACT-001 — Production không có kênh liên hệ trực tiếp

- Severity/Status: `HIGH / OPEN`
- Route: `/contact`, Footer.
- Tái hiện: mở production contact/footer.
- Expected: ít nhất email, hotline hoặc support form.
- Actual: không có `mailto:` hoặc `tel:`; trang chỉ còn link kiểm tra booking.
- Bằng chứng: production smoke `hasMailto=0`, `hasTel=0`.
- Tác động: user gặp lỗi tài khoản/website không thể liên hệ.
- Phạm vi sửa: cấu hình contact production hoặc support ticket form.

### UX-001 — Mọi guest page phát refresh 401 và console error

- Severity/Status: `LOW / OPEN`
- Route: toàn bộ public pages.
- Tái hiện: mở bất kỳ page khi chưa có session.
- Expected: session probe 401 được xử lý yên lặng.
- Actual: browser console ghi failed resource 401 trên mỗi page load.
- Bằng chứng: production smoke cả desktop/mobile.
- Tác động: nhiễu monitoring và che lỗi thật.
- Phạm vi sửa: session endpoint/probe strategy hoặc suppress expected diagnostic.

### UX-002 — Document title thiếu cho nhiều route

- Severity/Status: `LOW / OPEN`
- Route: messages, incidents, info pages, not-found.
- Tái hiện: mở các route.
- Expected: title mô tả đúng trang.
- Actual: title fallback `Mommate | Mommate`.
- Bằng chứng: production smoke.
- Tác động: accessibility, browser history và SEO kém.
- Phạm vi sửa: route title map đầy đủ.

### DEV-001 — API resolver không coi `127.0.0.1` là local

- Severity/Status: `LOW / OPEN`
- Route: local dev/test.
- Tái hiện: chạy frontend tại `http://127.0.0.1:*` không mock API.
- Expected: gọi backend `http://localhost:5000/api`.
- Actual: resolver chỉ nhận hostname `localhost`, nên dùng same-origin `/api`.
- Bằng chứng: `api.ts:13-17`; audit UI thật tại 127.0.0.1 thất bại fetch.
- Tác động: test hiện tại dùng mock che lỗi integration local.
- Phạm vi sửa: nhận localhost, 127.0.0.1 và IPv6 loopback hoặc luôn dùng env.

## 5. Các mục chưa xác minh hoặc không tái hiện

| Hạng mục | Trạng thái | Lý do |
|---|---|---|
| Login email/admin production | `CANNOT_REPRODUCE` | Login và refresh production đã trả `200` ở lượt kiểm tra trước |
| Google popup unauthorized-domain | `CANNOT_REPRODUCE` | Popup mở đúng Firebase domain, không thấy unauthorized-domain |
| Care-profile CRUD | `CANNOT_REPRODUCE` | API thật pass create/update/list/delete |
| Thanh toán PayOS thành công end-to-end | `N/A` | Audit production bị giới hạn read-only; không tạo giao dịch thật |
| Google consent hoàn chỉnh | `N/A` | Cần thao tác tài khoản Google tương tác |

## 6. Thứ tự sửa đề xuất

1. `AUTH-001`.
2. `MARKET-005`, `BOOK-001`, `BOOK-002`, `BOOK-003`.
3. `DETAIL-001`, `DETAIL-003`, `REQUEST-003`, `REVIEW-001`.
4. `CHANGE-001`, `CHANGE-002`.
5. `PAYMENT-001`, `CHAT-001`, `INCIDENT-002`.
6. Các lỗi HIGH còn lại theo chuỗi booking.
7. MEDIUM/LOW và polish.

## 7. Tiêu chí để core flow được coi là dùng được

- Public registration không thể tạo role đặc quyền.
- User chỉ chọn được carer verified, accepting và slot nằm trong availability.
- Quote tạo hold/idempotency; create booking atomic.
- Booking nhiều buổi có lịch cho từng buổi.
- Booking tại nhà luôn có target coordinates; check-in bắt buộc radius.
- Booking lưu care profile snapshot.
- Danh sách booking phân trang đúng và completed luôn mở được detail.
- Detail không còn dữ liệu hard-code; parent xem được care journal.
- Review completed booking hoạt động với list response chuẩn.
- Payment không hiển thị UI thẻ/QR giả và receipt lấy transaction thật.
- Chat/notification realtime chạy trên hạ tầng hỗ trợ connection persistent.
- Parent theo dõi được incident và tải evidence trực tiếp.
