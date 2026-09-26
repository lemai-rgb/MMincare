# Notification Phase 1 ERD delta

```mermaid
erDiagram
  USERS ||--o{ NOTIFICATION_EVENTS : owns
  REMINDERS ||--o{ NOTIFICATION_EVENTS : schedules
  NOTIFICATION_EVENTS {
    uuid notification_event_id PK
    uuid user_id FK
    uuid reminder_id FK
    text event_type
    date due_date_snapshot
    timestamptz scheduled_for
    timestamptz read_at
    timestamptz cancelled_at
    timestamptz created_at
    timestamptz updated_at
  }
```
