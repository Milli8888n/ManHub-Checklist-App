# ManHub Checklist - Comprehensive Test Plan

Tài liệu thiết kế các kịch bản kiểm thử (Test Cases) nhằm bao phủ 100% chức năng dự án.

## 🛡️ Suite 1: Authentication & Security (Đã có: auth.spec.ts)
*Mục tiêu: Đảm bảo bảo mật truy cập.*
- **TC01 - Login Success**: Đăng nhập đúng user/pass -> Vào Dashboard.
- **TC02 - Login Fail**: Sai user/pass -> Báo lỗi.
- **TC03 - Route Protection**: Truy cập trực tiếp URL `/` khi chưa login -> Redirect về `/login`.
- **TC04 - Role UI Security (NEW)**:
  - Login Staff -> Kiểm tra **KHÔNG** thấy nút "Duyệt" (Approve) và "Từ chối" (Reject).
  - Login Admin -> Kiểm tra **THẤY** đầy đủ các nút quyền lực.

## ⚙️ Suite 2: Core Workflow (Đã có: workflow_happy_path.spec.ts, workflow_rejection.spec.ts)
*Mục tiêu: Đảm bảo luồng nghiệp vụ chính.*
- **TC05 - Happy Path**: Staff Upload -> Status `submitted` -> Admin Approve -> Status `completed`.
- **TC06 - Rejection Loop**: Staff Upload -> Admin Reject -> Status `pending` -> Helper text "Bị từ chối" -> Staff Upload Lại.
- **TC07 - Input Validation (NEW)**:
  - Bấm nút "Nộp" khi chưa chọn ảnh -> Hiện Alert yêu cầu chọn ảnh.

## 🚧 Suite 3: Data Isolation & Logic (Cần bổ sung: workflow_isolation.spec.ts)
*Mục tiêu: Đảm bảo tính đúng đắn của dữ liệu hiển thị.*
- **TC08 - Department Filter (Quan trọng)**:
  - Login Staff `Barber` -> Chỉ thấy task có tag `Barber`. Verify KHÔNG thấy task `Barista`.
  - Login Staff `Lễ tân` -> Chỉ thấy task `Lễ tân`.
- **TC09 - Daily Task Generation**:
  - Giả lập ngày mới (hoặc xóa log hôm nay) -> Reload Dashboard -> Verify hệ thống tự động sinh 1 loạt task mới.

## 🤖 Suite 4: Automation & Systems (Cần bổ sung: api_health.spec.ts)
*Mục tiêu: Đảm bảo Backend không bị crash.*
- **TC10 - API Cron Generation**: Gửi request tới `/api/cron/generate-daily-tasks` -> Expect 200 OK.
- **TC11 - API Cron Notification**: Gửi request tới `/api/cron/send-notifications` -> Expect 200 OK (hoặc JSON success).
- **TC12 - Push Flow (Đã có: verify_push.spec.ts)**: End-to-end subscription test.

## 📝 Kế hoạch thực hiện tiếp theo
1. Viết script `tests/workflow_isolation.spec.ts` để kiểm tra TC04 và TC08.
2. Viết script `tests/api_health.spec.ts` để kiểm tra TC10 và TC11.
