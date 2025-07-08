# Client Appointments Testing Guide

## Overview
The client appointments functionality is fully implemented and allows clients to view their bookings in three categories: Upcoming, Today, and Past appointments.

## How to Test

### 1. Login as Test Client
1. Navigate to http://localhost:3000/client-portal
2. Use the demo credentials:
   - **Email**: `emily.davis@example.com`
   - **Password**: any password (e.g., "password")
3. Click "Sign In"

### 2. Access Appointments
1. After login, click "My Appointments" in the navigation
2. Or directly visit: http://localhost:3000/client-portal/appointments

### 3. Expected Results
You should see three tabs with appointments:

#### **Today Tab**
- Shows appointments scheduled for today
- Includes time-sensitive status badges (Starting Soon, In Progress, etc.)
- Sample: "Haircut & Style" appointment

#### **Upcoming Tab**
- Shows future confirmed/pending appointments (excluding today)
- Sorted by date (earliest first)
- Sample: "Color & Highlights" (next week), "Manicure" (two weeks)

#### **Past Tab**
- Shows completed historical appointments
- Sorted by date (most recent first)
- Sample: "Deep Conditioning", "Blowout"

### 4. Features to Test
- ✅ **Appointment Cards**: Full details (service, staff, location, price, duration)
- ✅ **Cancel Functionality**: Cancel future appointments with confirmation dialog
- ✅ **Review System**: Leave reviews for completed appointments
- ✅ **Refresh Button**: Manually refresh appointment data
- ✅ **Book New**: Navigate to booking page
- ✅ **Empty States**: Proper messages when no appointments exist

## Troubleshooting

### If No Appointments Show
1. **Check Browser Console**: Look for debug logs
2. **Verify Authentication**: 
   - Open Developer Tools → Application → Local Storage
   - Ensure `client_id` is set to "ed1"
   - Ensure `client_email` is set to "emily.davis@example.com"
3. **Run Test Script**: Copy and paste `test-client-appointments.js` in browser console

### Debug Information
The page includes comprehensive logging:
- Client authentication status
- Total appointments loaded
- Appointment filtering results
- Categorization counts

### Sample Data
Emily Davis (ed1) has the following appointments:
- **Today**: Haircut & Style with Emma Johnson
- **Upcoming**: Color & Highlights (7 days), Manicure (14 days)
- **Past**: Deep Conditioning (7 days ago), Blowout (14 days ago)

## Alternative Test Clients
- **James Wilson**: `james.wilson@example.com` (client ID: jw2)
- **Default Fallback**: Any other email will use "ed1" as fallback

## Technical Details
- **Data Sources**: localStorage + mock data + appointments data
- **Real-time Sync**: Unified appointment service
- **Authentication**: localStorage-based with automatic client ID mapping
- **Responsive Design**: Works on desktop and mobile
- **Error Handling**: Toast notifications for errors and actions
