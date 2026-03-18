# Phân tích & Đánh giá Workflow Hệ thống ManHub

Tài liệu này tổng hợp phân tích chi tiết các luồng nghiệp vụ (Workflow) hiện tại của hệ thống, dựa trên mã nguồn và kết quả kiểm thử ngày 15/01/2026.

## 1. Quy trình Sinh việc & Phân công (Daily Task Generation)
- **Cơ chế**: **Lazy Generation (Client-side Trigger)**.
- **Hoạt động**:
  - Hệ thống KHÔNG dùng Cronjob để tạo sẵn công việc vào 00:00.
  - Thay vào đó, khi người dùng đầu tiên (bất kỳ ai, Admin hoặc Staff) truy cập Dashboard vào ngày mới -> Hệ thống tự động kiểm tra và sao chép danh mục `task_definitions` thành `daily_task_logs` cho ngày hôm nay.
- **Đánh giá**:
  - ✅ **Ưu điểm**: Tiết kiệm tài nguyên Database, trành tạo dữ liệu rác vào những ngày nghỉ (không ai login).
  - ⚠️ **Lưu ý**: Phụ thuộc vào lần đăng nhập đầu tiên trong ngày. Nếu mạng lỗi lúc đó, danh sách việc có thể chưa hiện ra ngay (cần reload).

## 2. Quy trình Thực hiện & Báo cáo (Staff Workflow)
- **Đối tượng**: Nhân viên (Barber, Spa, Barista, Lễ tân).
- **Phân quyền**: Hệ thống tự động lọc hiển thị công việc theo `Department` được gán cho tài khoản.
- **Luồng xử lý**:
  1. **Nhận việc**: Nhân viên xem danh sách Checklist trạng thái `Pending` (Chưa làm).
  2. **Thực hiện**: Làm việc thực tế tại cửa hàng.
  3. **Báo cáo**:
     - Chọn task -> Bấm Upload ảnh bằng chứng (Hệ thống tự động nén ảnh để tối ưu tốc độ).
     - Trạng thái task chuyển sang `Submitted` (Chờ duyệt).
     - 🔔 **Trigger**: Hệ thống tự động gửi Push Notification đến máy của Admin ("Nhân viên A vừa nộp báo cáo").
- **Trạng thái kiểm thử**: ✅ **PASSED (E2E Automated Test)**.

## 3. Quy trình Kiểm duyệt (Admin Workflow)
- **Đối tượng**: Quản lý / Admin.
- **Quyền hạn**: Xem toàn bộ task của mọi bộ phận (Barber, Spa, Lễ tân...).
- **Luồng xử lý**:
  1. **Nhận thông báo**: Nhận tin nhắn Push từ Staff hoặc chủ động vào Dashboard kiểm tra.
  2. **Review**: Xem ảnh bằng chứng staff vừa nộp.
  3. **Quyết định**:
     - ✅ **Duyệt (Approve)**: Task chuyển sang `Completed`. Staff nhận thông báo "Đã được duyệt".
     - ❌ **Từ chối (Reject)**: Task quay về `Pending`. Staff nhận thông báo "Báo cáo bị từ chối, làm lại!".
- **Trạng thái kiểm thử**: ✅ **PASSED (E2E Automated Test)**.

## 4. Hệ thống Nhắc nhở & Cảnh báo (Automation Cron)
- **Cơ chế**: API Route `/api/cron/send-notifications` được gọi định kỳ (qua Vercel Cron).
- **Chức năng 1: Nhắc ca làm việc (Shift Reminder)**:
  - Gửi thông báo nhắc Checklist đầu ca/cuối ca cho từng bộ phận theo khung giờ cài đặt (ví dụ: 07:35 nhắc Barista/Lễ tân).
- **Chức năng 2: Báo động đỏ (Red Alert)**:
  - Tại các mốc Deadline (ví dụ 09:00, 14:30), hệ thống quét toàn bộ DB.
  - Nếu phát hiện task nào còn `Pending` thuộc ca làm việc đó -> **Hú còi (Push Notification) cảnh báo trễ tiến độ gửi thẳng cho ADMIN**.
- **Trạng thái kiểm thử**: 
  - Logic Backend: ✅ Verified.
  - Push Delivery: ✅ Verified (Gửi thành công tới cả Admin & Staff).

## 5. Kết luận chung
Hệ thống ManHub Checklist hiện tại đã hoàn thiện về mặt chức năng (Functional) và trải nghiệm người dùng (UX/Notification).
- **Tính năng**: Đầy đủ quy trình khép kín (Giao việc -> Làm việc -> Báo cáo -> Duyệt -> Thông báo).
- **Độ ổn định**: Cao, đã qua các bài test tự động (Playwright) và test thủ công (Manual Script).
- **Bảo mật**: Dữ liệu được bảo vệ bằng RLS Policy, Upload ảnh có xác thực.

**Sẵn sàng cho triển khai thực tế.**
