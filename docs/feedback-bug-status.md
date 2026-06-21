# Báo cáo tổng hợp feedback

Ngày cập nhật: 2026-06-21

| Nhóm | Feedback | Mức độ | Owner | Trạng thái | Kết quả |
|---|---|---:|---|---|---|
| Data | Rating/review giữa landing, card và detail không khớp | High | Backend + Frontend | FIXED | Chỉ review `published` được tổng hợp; bỏ rating/count mặc định |
| Data | Thông tin chuyên gia giữa card và detail không khớp | Critical | Backend + Frontend | FIXED | Hai màn dùng cùng API và formatter; bỏ số liệu/profile giả |
| Data | Landing dùng dịch vụ và ID mock | High | Frontend | FIXED | Landing chỉ hiển thị dữ liệu `/services`, có empty/error state |
| Listing | Search/filter/sort sai khi kết hợp pagination | Critical | Backend + Frontend | FIXED | Backend xử lý trước pagination; frontend không lọc lại response |
| Listing | Filter khu vực dịch vụ không hoạt động | High | Backend + Frontend | FIXED | `/services` hỗ trợ `area` và `carerId` |
| UX | Link menu/footer chết | Medium | Frontend | FIXED | Chỉ render route/CTA có hành vi; báo lỗi website dẫn tới Contact |
| UX | Hotline/email placeholder | High | Frontend | FIXED | Contact lấy từ environment và bị ẩn khi chưa cấu hình |
| Content | About cam kết vượt quá dịch vụ thực tế | Medium | Product + Frontend | FIXED | Nội dung giới hạn theo marketplace và dữ liệu vận hành hiện có |
| Brand | Ảnh đội ngũ/ảnh generated gây hiểu nhầm | Medium | Brand + Frontend | FIXED | Dùng initials, icon và visual trung tính |
| Performance | Logo mờ và nặng | High | Frontend | FIXED | Logo giảm từ khoảng 2.17 MB xuống khoảng 5 KB |
| Copy | Hero/storytelling chưa đúng nỗi đau | Medium | Product + Frontend | FIXED | Copy tập trung vào khó khăn xác minh và tìm hỗ trợ sau sinh |
| Profile | Hồ sơ chăm sóc hiển thị dữ liệu y tế hard-code và CTA dùng prompt | Critical | Backend + Frontend | FIXED | CRUD mẹ/bé dùng API thật, có validation, chọn/sửa/xóa và empty state |
| Operations | 21 chuyên gia phân tán ở ba thành phố | Strategic | Operations | N/A | Chưa thể xác minh bằng code; sản phẩm mặc định ưu tiên Đà Nẵng |

## Quy ước nghiệm thu

- Runtime production/development không được dùng ID giả, rating giả hoặc dữ liệu ngẫu nhiên.
- Card và detail phải hiển thị cùng dữ liệu khi dùng cùng một ID.
- Tổng kết quả và số trang phải phản ánh toàn bộ filter đang áp dụng.
- Contact và social URL chưa cấu hình không được hiển thị.
- Demo seed chỉ được chạy ngoài production.
# Production authentication follow-up — 2026-06-21

| Bug | Status | Evidence / resolution |
| --- | --- | --- |
| Email/admin login returned HTTP 500 on production | `FIXED` | Production backend was missing JWT session secrets. Required Vercel variables were configured; login and refresh now return HTTP 200 with an admin session. |
| Admin login from the public app could not reach the admin dashboard | `FIXED` | Public login now persists the session before redirecting, and the public build also contains a protected same-domain admin fallback. Cross-app production smoke test reaches `/admin/dashboard`. |
| Google login backend returned HTTP 500 | `FIXED` | Firebase token verification now supports project-ID-only verification and reports configuration failures as HTTP 503. Invalid tokens return HTTP 401; the production Google popup opens without an unauthorized-domain error. |
| Full Google account consent completion | `N/A` | Requires an interactive Google account. Popup, authorized domain, frontend Firebase configuration, and backend token rejection path were verified in production. |
