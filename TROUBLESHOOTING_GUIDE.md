# Document Display Issue - Troubleshooting Guide

## 🔍 **Current Issue**
- Documents are not showing in the Documents tab
- Test Upload is failing with "Unknown error"

## 🧪 **Step-by-Step Diagnosis**

### **Step 1: Test Database Connection**
1. Open: `http://localhost:3000/test-db.html`
2. Click "Test Connection" first
3. **Expected Result**: Should show "Database connection successful"
4. **If it fails**: Check Supabase configuration

### **Step 2: Initialize Database**
1. Click "Initialize Database"
2. **Expected Result**: Should create default user successfully
3. **If it fails**: Database schema might not be set up correctly

### **Step 3: Test Document Creation**
1. Click "Test Upload"
2. **Expected Result**: Should create a test document
3. **If it fails**: Check the detailed error message now provided

### **Step 4: Verify Document Retrieval**
1. Click "Get Documents"
2. **Expected Result**: Should show the test document
3. **If it fails**: Check user-document association

## 🔧 **Common Issues & Solutions**

### **Issue 1: Supabase Connection Failed**
**Symptoms**: Connection test fails
**Solutions**:
- Verify `.env` file has correct Supabase credentials
- Check if Supabase project is active
- Ensure service role key has proper permissions

### **Issue 2: Database Schema Not Set Up**
**Symptoms**: "relation does not exist" errors
**Solutions**:
1. Go to Supabase Dashboard → SQL Editor
2. Run the contents of `supabase-development-schema.sql`
3. Verify tables are created: users, documents, analyses, queries

### **Issue 3: Permission Errors**
**Symptoms**: "permission denied" errors
**Solutions**:
- Check Row Level Security (RLS) policies in Supabase
- Temporarily disable RLS for testing
- Ensure service role key is being used

### **Issue 4: User Creation Failed**
**Symptoms**: "Could not create/find default user"
**Solutions**:
- Check if users table exists
- Verify user creation permissions
- Check for unique constraint violations

## 🛠️ **Enhanced Error Reporting**

The test endpoints now provide detailed error information:
- Error type and constructor
- Full error message
- Stack trace (when available)
- Database connection status

## 📋 **Manual Testing Commands**

You can also test the endpoints directly:

```bash
# Test connection
curl http://localhost:3000/api/test-connection

# Initialize database
curl -X POST http://localhost:3000/api/init-db

# Test upload
curl -X POST http://localhost:3000/api/test-upload

# Get documents
curl http://localhost:3000/api/documents
```

## 🎯 **Expected Flow**

1. **Connection Test** → ✅ Database accessible
2. **Initialize Database** → ✅ Default user created
3. **Test Upload** → ✅ Test document created
4. **Get Documents** → ✅ Documents retrieved
5. **Main App** → ✅ Documents show in UI

## 🚨 **If All Tests Fail**

### **Check Environment Variables**
```bash
# Verify these are set in .env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### **Check Supabase Project Status**
- Log into Supabase dashboard
- Verify project is not paused
- Check if database is accessible

### **Reset Database Schema**
1. Go to Supabase → SQL Editor
2. Drop all tables if needed
3. Re-run `supabase-development-schema.sql`

## 📊 **What to Look For**

### **In Browser Console**
- Network errors (failed requests)
- JavaScript errors
- Authentication issues

### **In Server Logs**
- Database connection errors
- SQL query failures
- Authentication token issues

### **In Test Results**
- Specific error messages
- Stack traces
- Connection status

## ✅ **Success Indicators**

- Connection test passes
- Default user created successfully
- Test document appears in database
- Documents API returns data
- Main application shows documents

Run the tests in order and check each step. The enhanced error reporting will now show exactly what's failing and why.