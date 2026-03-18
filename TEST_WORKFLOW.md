---
description: Test Workflow for ManHub Operations App (Push Notification & Admin Approval)
---

# Test Workflow Update

## Objective
Verify the end-to-end flow of the Push Notification and Task Approval system, ensuring ensuring seamless interaction between Staff (submission) and Admin (approval/rejection) with real-time feedback.

## Credentials (Confirmed)
- **Admin Account**: `admin` / `admin123` (Role: Admin)
- **Staff Account**: `bbr001` / `ManHub@2026` (Role: Staff)
- **Playwright Test**: `npx playwright test` (Runs full E2E workflow: Staff Submit -> Admin Approve)

## Test Scenarios

### 1. Staff Submission Flow
- **Goal**: Verify staff can view assigned tasks and submit a report with a photo.
- **Steps**:
  1. Login as Staff (`bbr001`).
  2. Verify Dashboard shows "Checklist công việc hôm nay".
  3. Verify tasks relate to "Barber" area.
  4. Select a 'pending' task.
  5. Click 'Upload Photo' (Mock/Simulate).
  6. **Expectation**: Status changes to 'submitted'. Push notification sent to Admin (simulated log check).

### 2. Admin Approval Flow
- **Goal**: Verify admin sees the submitted task and can approve it.
- **Steps**:
  1. Login as Admin (`admin`).
  2. Locate the task submitted by `bbr001`.
  3. Click 'Duyệt' (Approve).
  4. **Expectation**: Task status changes to 'completed'. Push notification sent to Staff (simulated log check).

### 3. Notification System Check (Technical)
- **Goal**: Verify Push Notification API triggers correctly.
- **Steps**:
  1. Check browser console logs for `Sending "..." to ... devices`.
  2. Verify API calls to `/api/notifications/send` return `success: true`.

### 4. Red Alert Check
- **Goal**: Verify cron job logic for overdue tasks.
- **Steps**:
  1. Manually trigger the Red Alert logic (via modified cron URL or mock).
  2. **Expectation**: Admin receives "CẢNH BÁO" notification.
