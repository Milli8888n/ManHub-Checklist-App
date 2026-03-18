# ManHub Checklist - Comprehensive Test Plan

## 1. Introduction
This document outlines the testing strategy and scenarios for the ManHub Checklist Operations App. The goal is to achieve 100% feature coverage through a mix of Automated E2E Testing (Playwright) and Manual Verification procedures.

## 2. Test Scope
- **Frontend**: Next.js UI, PWA features, Responsive Design.
- **Backend**: Next.js API Routes, Supabase Database, Cron Jobs.
- **Integration**: Push Notifications (Web Push), Supabase Storage.

## 3. Test Scenarios (Test Cases)

### Module 1: Authentication & Security 🔐
| ID | Test Case | Type | Priority | Automation Status |
|----|-----------|------|----------|-------------------|
| AUTH-001 | User login with valid credentials (Admin) | Positive | P0 | ✅ Automated |
| AUTH-002 | User login with valid credentials (Staff/Barber) | Positive | P0 | ✅ Automated |
| AUTH-003 | User login with invalid password | Negative | P1 | ⏳ To Do |
| AUTH-004 | User login with non-existent username | Negative | P1 | ⏳ To Do |
| AUTH-005 | Redirect to Login when accessing protected routes unauthenticated | Security | P0 | ⏳ To Do |
| AUTH-006 | Staff cannot access Admin-only features (e.g., Task Creation) | Security | P1 | ⏳ To Do |

### Module 2: Task Workflow (The Core Loop) 🔄
| ID | Test Case | Type | Priority | Automation Status |
|----|-----------|------|----------|-------------------|
| TASK-001 | Staff views correct tasks for their Department/Role | Functional | P0 | ✅ Automated |
| TASK-002 | Staff upload photo evidence (Submission) | Functional | P0 | ✅ Automated |
| TASK-003 | Admin accepts valid submission (Approve) | Functional | P0 | ✅ Automated |
| TASK-004 | Admin rejects invalid submission (Reject) | Functional | P1 | ⏳ To Do |
| TASK-005 | Staff re-submits rejected task | Functional | P1 | ⏳ To Do |
| TASK-006 | Upload validation (File type, Size limit) | Edge Case | P2 | ⏳ To Do |

### Module 3: Admin Management 🛠️
| ID | Test Case | Type | Priority | Automation Status |
|----|-----------|------|----------|-------------------|
| ADM-001 | Create a new Task Definition | Functional | P1 | ⏳ To Do |
| ADM-002 | Edit existsing Task Definition | Functional | P2 | ⏳ To Do |
| ADM-003 | Delete/Archive Task Definition | Functional | P2 | ⏳ To Do |
| ADM-004 | View Admin Statistics | Visual | P2 | Manual Check |

### Module 4: Notifications & System 🔔
| ID | Test Case | Type | Priority | Automation Status |
|----|-----------|------|----------|-------------------|
| NOTI-001 | Permission Request for Push Notifications | UX | P1 | Manual Check |
| NOTI-002 | Cron Job triggers "Shift Reminder" | Backend | P1 | Verified via Logs |
| NOTI-003 | Cron Job triggers "Red Alert" (Overdue) | Backend | P1 | Verified via DB Logic |

## 4. Automation Suite Structure
The automated tests are located in `/tests` directory using **Playwright**.

- `auth.spec.ts`: Covers AUTH module.
- `workflow_happy_path.spec.ts`: Covers TASK-001, 002, 003.
- `workflow_rejection.spec.ts`: Covers TASK-004, 005.
- `admin_crud.spec.ts`: Covers ADM module.
