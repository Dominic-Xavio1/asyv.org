-- Create student_reports table for storing student reports and documents
CREATE TABLE IF NOT EXISTS student_reports (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES api_user(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    report_file TEXT, -- URL to the uploaded file
    report_type VARCHAR(50) DEFAULT 'academic' CHECK (report_type IN ('academic', 'behavioral', 'medical', 'general')),
    created_by INTEGER REFERENCES api_user(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_student_reports_student_id ON student_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_student_reports_created_at ON student_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_reports_type ON student_reports(report_type);

-- Add comments for documentation
COMMENT ON TABLE student_reports IS 'Stores reports and documents for students including academic reports, behavioral reports, medical records, and general documents';
COMMENT ON COLUMN student_reports.report_file IS 'URL to the uploaded report file stored in local storage';
COMMENT ON COLUMN student_reports.report_type IS 'Type of report: academic, behavioral, medical, or general';
COMMENT ON COLUMN student_reports.created_by IS 'ID of the superuser who created this report';
