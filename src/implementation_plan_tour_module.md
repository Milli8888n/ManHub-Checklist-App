# IMPLEMENATION PLAN - MANHUB TOUR MANAGEMENT SYSTEM

## 1. Database Schema Design (Supabase/Postgres)

We will leverage the existing `users` table and add new tables to manage the specific "Tour" logic.

### New Tables
1.  **`services`**
    *   `id` (uuid, pk)
    *   `name` (text)
    *   `duration_minutes` (int)
    *   `price` (decimal)
    *   `is_active` (boolean)

2.  **`barber_status`** (Real-time enabled)
    *   `user_id` (uuid, fk -> users.id, pk)
    *   `state` (enum: 'offline', 'available', 'consulting', 'busy', 'cooldown')
    *   `last_completed_at` (timestamptz) - For Priority Score
    *   `check_in_time` (timestamptz)
    *   `current_session_id` (uuid, nullable)

3.  **`service_sessions`** (Real-time enabled)
    *   `id` (uuid, pk)
    *   `barber_id` (uuid, fk -> users.id)
    *   `customer_type` (enum: 'walk_in', 'booking')
    *   `guest_name` (text, optional)
    *   `status` (enum: 'waiting', 'consulting', 'in_progress', 'completed', 'cancelled')
    *   `start_time` (timestamptz)
    *   `end_time` (timestamptz, nullable)
    *   `total_amount` (decimal)

4.  **`session_items`**
    *   `id` (uuid, pk)
    *   `session_id` (uuid, fk -> service_sessions.id)
    *   `service_id` (uuid, fk -> services.id)
    *   `price_at_session` (decimal) - Snapshot of price

### Enums
*   `barber_state_enum`: 'offline', 'available', 'consulting', 'busy', 'cooldown'
*   `session_status_enum`: 'waiting', 'consulting', 'in_progress', 'completed', 'cancelled'
*   `customer_type_enum`: 'walk_in', 'booking'

## 2. Real-time Logic (Supabase Realtime)

*   **Reception View**: Subscribes to `barber_status` changes to update the queue instantly.
*   **Barber View**: Subscribes to `service_sessions` where `barber_id` equals their ID.

## 3. Algorithm Implementation (The Queue)

The sorting logic for the "Available" queue:
*   **Priority Score** = `last_completed_at` (Unix Timestamp)
*   **Modifiers**:
    *   If `customer_type` is 'booking', effectively "insert" at a specific index or reserve.
    *   New shift entry rule: Interleave logic (assign fake timestamp = timestamp of 2nd person in queue).

This logic will be handled in a helper function `getSortedQueue()` used by the Reception UI.

## 4. Frontend Modules

### A. Receptionist Dashboard (`/reception`)
*   **Waiting Room**: List of available barbers sorted by priority.
*   **Action Panel**: Check-in mechanism, Assign Barber button.
*   **Active Sessions**: List of currently running sessions.

### B. Barber Interface (`/barber`)
*   **Status Toggle**: Only if manual oversight is needed (mostly automated).
*   **Current Session**: View assigned customer.
*   **Service Selector**: Add/Remove services (Searchable dropdown).
*   **Action Buttons**: "Start Service", "Finish Service".

## 5. Development Phases

1.  **Phase 1: Database & Backend**: Create tables, RLS policies, and seed basic services.
2.  **Phase 2: Core Components**: Build `BarberCard`, `QueueList`, `ServiceSelector`.
3.  **Phase 3: Reception Logic**: Implement the queue algorithm and assignment flow.
4.  **Phase 4: Barber Logic**: Implement service additions and state transitions.
5.  **Phase 5: Real-time & Polish**: Connect WebSockets, sound alerts (optional), and UI polish.

## 6. Execution Steps (Immediate)

1.  Create Supabase Migration file (SQL).
2.  Apply Migration.
3.  Generate TypeScript types.
4.  Scaffold `/reception` and `/barber` pages.
