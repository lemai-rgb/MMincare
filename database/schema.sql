-- MMinCare MVP — PostgreSQL / Supabase schema
-- Nguồn: Data Dictionary, ERD, API Documentation, Business Rules

-- ---------------------------------------------------------------------------
-- Extensions & ENUM types
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE pet_species AS ENUM ('Dog', 'Cat');
CREATE TYPE pet_gender AS ENUM ('Male', 'Female', 'Unknown');

CREATE TYPE reminder_type AS ENUM ('Vaccine', 'Recheck', 'Medication', 'Other');
CREATE TYPE reminder_status AS ENUM ('Upcoming', 'Due Soon', 'Overdue', 'Completed');

CREATE TYPE pet_access_status AS ENUM ('Active', 'PendingInvitation', 'Revoked');

-- ---------------------------------------------------------------------------
-- users (ERD: trung tâm xác thực; FK từ pets.owner_id, created_by, v.v.)
-- ---------------------------------------------------------------------------

CREATE TABLE users (
    user_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    password_hash VARCHAR(255) NOT NULL,
    phone_number  VARCHAR(20) UNIQUE,
    email         VARCHAR(100) NOT NULL UNIQUE,
    name          VARCHAR(100) NOT NULL
);

COMMENT ON TABLE users IS 'Tài khoản Owner/Caretaker — BR-AUTH-01 (email unique), BR-AUTH-03 (chuẩn hóa email ở tầng ứng dụng)';

-- ---------------------------------------------------------------------------
-- pets (ERD: Pet N..1 User qua owner_id; 1..N với vaccine/medical/health/reminder/access)
-- ---------------------------------------------------------------------------

CREATE TABLE pets (
    pet_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id      UUID NOT NULL REFERENCES users (user_id) ON DELETE RESTRICT,
    picture_url   VARCHAR(500),
    species       pet_species NOT NULL,
    date_of_birth DATE,
    name          VARCHAR(100) NOT NULL,
    breed         VARCHAR(100),
    gender        pet_gender NOT NULL
);

COMMENT ON TABLE pets IS 'Hồ sơ thú cưng — BR-PET-01 (name/species/gender bắt buộc), BR-PET-04 (avatar mặc định xử lý ở app nếu picture_url NULL)';

CREATE INDEX idx_pets_owner_id ON pets (owner_id);

-- ---------------------------------------------------------------------------
-- vaccine_records (ERD: Pet 1..N Vaccine Record; Vaccine Record N..1 User qua created_by)
-- BR-VAC-05: không lưu next_due_date tại bảng này
-- ---------------------------------------------------------------------------

CREATE TABLE vaccine_records (
    vaccine_record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by        UUID NOT NULL REFERENCES users (user_id) ON DELETE RESTRICT,
    pet_id            UUID NOT NULL REFERENCES pets (pet_id) ON DELETE RESTRICT,
    vaccine_date      DATE NOT NULL,
    dose_number       INTEGER, -- nullable (BR-VAC-02)
    vaccine_name      VARCHAR(50) NOT NULL,
    clinic_name       VARCHAR(200),
    note              VARCHAR(500)
);

COMMENT ON TABLE vaccine_records IS 'Lịch sử tiêm phòng — BR-VAC-01, BR-MEDHIST-02 (audit created_by)';

CREATE INDEX idx_vaccine_records_pet_id ON vaccine_records (pet_id);
CREATE INDEX idx_vaccine_records_created_by ON vaccine_records (created_by);

-- ---------------------------------------------------------------------------
-- medical_records (ERD: Pet 1..N Medical Record; Medical Record N..1 User qua created_by)
-- ---------------------------------------------------------------------------

CREATE TABLE medical_records (
    record_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by  UUID NOT NULL REFERENCES users (user_id) ON DELETE RESTRICT,
    pet_id      UUID NOT NULL REFERENCES pets (pet_id) ON DELETE RESTRICT,
    visit_date  DATE NOT NULL,
    diagnosis   TEXT,
    symptoms    TEXT,
    medication  TEXT,
    clinic_name VARCHAR(200),
    note        VARCHAR(500)
);

COMMENT ON TABLE medical_records IS 'Lịch sử khám bệnh — BR-MED-01, BR-MEDHIST-02';

CREATE INDEX idx_medical_records_pet_id ON medical_records (pet_id);
CREATE INDEX idx_medical_records_created_by ON medical_records (created_by);

-- ---------------------------------------------------------------------------
-- medical_attachments (ERD: Medical Record 1..N Medical Attachment)
-- ---------------------------------------------------------------------------

CREATE TABLE medical_attachments (
    attachment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id     UUID NOT NULL REFERENCES medical_records (record_id) ON DELETE RESTRICT,
    file_url      VARCHAR(500) NOT NULL,
    file_type     VARCHAR(20) NOT NULL,
    file_size     INTEGER NOT NULL,
    uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_medical_attachments_file_type
        CHECK (file_type IN ('jpg', 'png', 'pdf')),
    CONSTRAINT chk_medical_attachments_file_size
        CHECK (file_size > 0 AND file_size <= 5242880) -- BR-MED-03: tối đa 5MB
);

COMMENT ON TABLE medical_attachments IS 'File đính kèm phiếu khám/toa thuốc — BR-MED-03';

CREATE INDEX idx_medical_attachments_record_id ON medical_attachments (record_id);

-- ---------------------------------------------------------------------------
-- reminders (ERD: User 1..N Reminder; Pet 1..N Reminder)
-- Trạng thái Upcoming/Due Soon/Overdue: tính ở backend theo due_date (API §13, BR-REM)
-- ---------------------------------------------------------------------------

CREATE TABLE reminders (
    reminder_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID NOT NULL REFERENCES users (user_id) ON DELETE RESTRICT,
    pet_id                   UUID NOT NULL REFERENCES pets (pet_id) ON DELETE RESTRICT,
    source_vaccine_record_id UUID REFERENCES vaccine_records (vaccine_record_id) ON DELETE RESTRICT,
    due_date                 DATE NOT NULL,
    type                     reminder_type NOT NULL,
    status                   reminder_status NOT NULL DEFAULT 'Upcoming',
    note                     VARCHAR(500)
);

COMMENT ON TABLE reminders IS 'Nhắc hẹn tiêm/tái khám — BR-REM-01, BR-REM-03/CC-01 (source_vaccine_record_id); chỉ Owner tạo/sửa (BR-REM-06, enforced ở app)';

CREATE INDEX idx_reminders_user_id ON reminders (user_id);
CREATE INDEX idx_reminders_pet_id ON reminders (pet_id);
CREATE INDEX idx_reminders_due_date ON reminders (due_date);

-- ---------------------------------------------------------------------------
-- health_logs (ERD: Pet 1..N Health Log; Health Log N..1 User qua created_by)
-- ---------------------------------------------------------------------------

CREATE TABLE health_logs (
    health_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by    UUID NOT NULL REFERENCES users (user_id) ON DELETE RESTRICT,
    pet_id        UUID NOT NULL REFERENCES pets (pet_id) ON DELETE RESTRICT,
    note          VARCHAR(500),
    weight        NUMERIC(5, 2),
    food_amount   VARCHAR(100),
    food_type     VARCHAR(100),
    status        VARCHAR(100),
    logged_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_health_logs_at_least_one_field
        CHECK (
            weight IS NOT NULL
            OR food_amount IS NOT NULL
            OR food_type IS NOT NULL
            OR status IS NOT NULL
            OR note IS NOT NULL
        ) -- BR-HLOG-02
);

COMMENT ON TABLE health_logs IS 'Chỉ số sức khỏe theo thời điểm — BR-HLOG-01 (append-only), BR-HLOG-02';

CREATE INDEX idx_health_logs_pet_id ON health_logs (pet_id);
CREATE INDEX idx_health_logs_created_by ON health_logs (created_by);
CREATE INDEX idx_health_logs_logged_at ON health_logs (logged_at);

-- ---------------------------------------------------------------------------
-- pet_access (ERD: Pet 1..N Pet Access; N..1 User qua caretaker_id & granted_by)
-- MVP: quyền cố định View + Add only, không có permission_level (Business Rules CC-03)
-- ---------------------------------------------------------------------------

CREATE TABLE pet_access (
    access_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caretaker_id  UUID NOT NULL REFERENCES users (user_id) ON DELETE RESTRICT,
    granted_by    UUID NOT NULL REFERENCES users (user_id) ON DELETE RESTRICT,
    pet_id        UUID NOT NULL REFERENCES pets (pet_id) ON DELETE RESTRICT,
    valid_until   DATE NOT NULL,
    granted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status        pet_access_status NOT NULL,
    CONSTRAINT chk_pet_access_granted_by_not_caretaker
        CHECK (granted_by <> caretaker_id) -- BR-SHARE-08 (Owner không tự chia sẻ cho chính mình)
);

COMMENT ON TABLE pet_access IS 'Quyền Caretaker theo pet — BR-SHARE-05 (valid_until bắt buộc), BR-SHARE-06 (PendingInvitation khi email chưa có tài khoản)';

CREATE INDEX idx_pet_access_pet_id ON pet_access (pet_id);
CREATE INDEX idx_pet_access_caretaker_id ON pet_access (caretaker_id);
CREATE INDEX idx_pet_access_granted_by ON pet_access (granted_by);
