# Student Report System Implementation

## Overview
This implementation adds a comprehensive report management system to the kids management page at `/management/kids/[kidId]`, allowing superusers to upload, manage, and store report files for students.

## Features Added

### 1. File Upload System
- **API Endpoint**: `/api/upload/report`
- **File Storage**: Local storage in `public/uploads/reports/[type]/[studentId]/`
- **Supported Formats**: PDF, DOC, DOCX, JPG, JPEG, PNG
- **File Size Limit**: 50MB
- **Unique Filenames**: Timestamp + random string to prevent conflicts

### 2. Report Management
- **API Endpoint**: `/api/manage/student-reports`
- **CRUD Operations**: Create, Read, Update, Delete
- **Report Types**: Academic, Behavioral, Medical, General
- **Database Table**: `student_reports`

### 3. User Interface
- **Report Card Section**: Displays all reports for the student
- **Add/Edit Dialog**: Form with file upload capability
- **File Preview**: Click to view uploaded files
- **Type Badges**: Visual indicators for report types

## Database Schema

```sql
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
```

## Implementation Steps

### 1. Database Setup
1. Run the SQL script: `create_student_reports_table.sql`
2. This creates the `student_reports` table with proper indexes

### 2. File Upload API
1. **File**: `src/app/api/upload/report/route.js`
2. **Purpose**: Handles file uploads to local storage
3. **Features**:
   - File validation (size, type)
   - Unique filename generation
   - Directory creation
   - Returns public URL

### 3. Report Management API
1. **File**: `src/app/api/manage/student-reports/route.js`
2. **Purpose**: CRUD operations for student reports
3. **Features**:
   - Superuser authentication
   - Full CRUD operations
   - Proper error handling

### 4. Frontend Integration
1. **File**: `src/app/management/kids/[kidId]/page.js`
2. **Features Added**:
   - Report state management
   - File upload handling
   - Report dialog forms
   - Report list display
   - Edit/Delete functionality

## Usage Instructions

### For Superusers

1. **Navigate to**: `/management/kids/[kidId]`
2. **Add Report**:
   - Click "Add Report" button
   - Fill in title, description, select type
   - Upload file (optional)
   - Click "Add Report"

3. **Edit Report**:
   - Click edit icon on existing report
   - Modify fields as needed
   - Upload new file if needed
   - Click "Update Report"

4. **Delete Report**:
   - Click trash icon
   - Confirm deletion

### File Storage

- **Location**: `public/uploads/reports/[type]/[studentId]/`
- **URL Format**: `/uploads/reports/[type]/[studentId]/[filename]`
- **Access**: Files accessible via direct URLs

## Security Features

1. **Superuser Authentication**: Only superusers can manage reports
2. **File Validation**: Size and type restrictions
3. **SQL Injection Protection**: Parameterized queries
4. **File Access Control**: Organized by student and type

## Error Handling

1. **File Upload Errors**:
   - Size limit exceeded
   - Invalid file types
   - Upload failures

2. **API Errors**:
   - Missing required fields
   - Database errors
   - Permission errors

3. **Frontend Errors**:
   - Toast notifications for all operations
   - Loading states during file upload
   - Form validation feedback

## Testing

### Manual Testing Steps

1. **Database Test**:
   ```sql
   -- Verify table exists
   \dt student_reports
   
   -- Test insert
   INSERT INTO student_reports (student_id, title, report_type, created_by) 
   VALUES (1, 'Test Report', 'academic', 1);
   ```

2. **API Testing**:
   ```bash
   # Test file upload
   curl -X POST http://localhost:3000/api/upload/report \
     -F "file=@test.pdf" \
     -F "studentId=123" \
     -F "reportType=academic"
   
   # Test report creation
   curl -X POST http://localhost:3000/api/manage/student-reports \
     -H "Content-Type: application/json" \
     -H "x-user-id: 1" \
     -d '{"student_id": 123, "title": "Test Report", "report_type": "academic"}'
   ```

3. **Frontend Testing**:
   - Navigate to kids management page
   - Test all CRUD operations
   - Verify file uploads work
   - Check toast notifications

## File Structure After Implementation

```
src/
├── app/
│   ├── api/
│   │   ├── upload/
│   │   │   └── report/
│   │   │       └── route.js (NEW)
│   │   └── manage/
│   │       └── student-reports/
│   │           └── route.js (NEW)
│   └── management/
│       └── kids/
│           └── [kidId]/
│               └── page.js (MODIFIED)
public/
└── uploads/
    └── reports/
        └── [type]/
            └── [studentId]/
                └── [files]
```

## Benefits

1. **Centralized Management**: All student reports in one place
2. **File Storage**: Local storage with proper organization
3. **Type Classification**: Different report types for better organization
4. **Audit Trail**: Created_by tracking for accountability
5. **User-Friendly**: Intuitive UI with file preview
6. **Scalable**: Easy to add new report types
7. **Secure**: Proper authentication and validation

## Future Enhancements

1. **Bulk Upload**: Allow multiple file uploads
2. **Report Templates**: Pre-defined report templates
3. **Email Notifications**: Send notifications to students
4. **Report Sharing**: Share reports with parents/guardians
5. **Analytics**: Report statistics and insights
6. **Export Functionality**: Export reports to different formats

## Troubleshooting

### Common Issues

1. **File Upload Fails**:
   - Check file size (< 50MB)
   - Verify file type is supported
   - Check directory permissions

2. **Reports Not Displaying**:
   - Verify database table exists
   - Check API authentication
   - Verify student ID is correct

3. **Permission Errors**:
   - Ensure user is superuser
   - Check x-user-id header
   - Verify requireSuperuser middleware

### Debug Steps

1. **Check Browser Console**: Look for JavaScript errors
2. **Check Network Tab**: Verify API requests
3. **Check Server Logs**: Look for backend errors
4. **Check Database**: Verify data integrity

This implementation provides a robust, secure, and user-friendly system for managing student reports with file storage capabilities.
