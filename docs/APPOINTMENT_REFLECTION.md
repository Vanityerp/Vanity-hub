# Appointment Reflection System

## Overview

The Appointment Reflection System automatically creates "shadow" or "reflected" appointments to prevent double-booking for staff members who have home service capability. When a staff member with `homeService: true` is booked at a physical location, the system automatically creates a blocking appointment in the home service location, and vice versa.

## How It Works

### Staff Identification
Staff members are identified as having home service capability through:
- `homeService: true` flag in their profile
- Assignment to the "home" location in their locations array

### Automatic Reflection Process

1. **Physical Location Booking**: When a home service staff is booked at a physical location (e.g., Medinat Khalifa), the system automatically creates a reflected appointment in the home service location.

2. **Home Service Booking**: When a home service staff is booked for home service, the system creates reflected appointments in all their assigned physical locations.

3. **Visual Indicators**: Reflected appointments are displayed with:
   - 🔄 icon to indicate they are reflected appointments
   - Dashed border styling
   - Reduced opacity (75%)
   - Modified client name with location prefix (e.g., "[LOC1] Customer Name")
   - Modified service name with blocking indicator

## Example Scenario

### Booking Woyni at Medinat Khalifa

**Staff Profile:**
```typescript
{
  id: "staff-woyni",
  name: "Woyni",
  homeService: true,
  locations: ["loc1", "loc2"] // Medinat Khalifa and other location
}
```

**Original Appointment:**
```typescript
{
  id: "apt-123",
  staffId: "staff-woyni",
  staffName: "Woyni",
  clientName: "John Doe",
  service: "Hair Styling",
  location: "loc1", // Medinat Khalifa
  date: "2025-06-26T10:00:00.000Z",
  duration: 90
}
```

**Automatically Created Reflected Appointment:**
```typescript
{
  id: "reflected-apt-123-home",
  originalAppointmentId: "apt-123",
  staffId: "staff-woyni",
  staffName: "Woyni",
  clientName: "[LOC1] John Doe",
  service: "Hair Styling (Location Blocking)",
  location: "home",
  date: "2025-06-26T10:00:00.000Z",
  duration: 90,
  isReflected: true,
  reflectionType: "physical-to-home"
}
```

## Key Features

### 1. Bidirectional Blocking
- Physical location bookings block home service availability
- Home service bookings block physical location availability

### 2. Automatic Synchronization
- Updates to original appointments automatically update reflected appointments
- Deletion of original appointments automatically deletes reflected appointments
- Rescheduling updates both original and reflected appointments

### 3. Visual Distinction
- Reflected appointments have distinct styling in calendar views
- Clear indicators show the relationship between original and reflected appointments
- Tooltips provide context about the reflection type

### 4. Conflict Prevention
- Integrates with existing bidirectional conflict checking
- Prevents double-booking across all location types
- Real-time validation during appointment creation

## Technical Implementation

### Core Service
The `AppointmentReflectionService` handles all reflection logic:

```typescript
// Create reflected appointments
await appointmentReflectionService.createReflectedAppointments(originalAppointment);

// Update reflected appointments
await appointmentReflectionService.updateReflectedAppointments(updatedAppointment);

// Delete reflected appointments
await appointmentReflectionService.deleteReflectedAppointments(appointmentId);
```

### Integration Points

1. **Appointment Creation**: Automatically triggered in `addAppointmentWithValidation()`
2. **Appointment Updates**: Automatically triggered in `updateAppointment()`
3. **Appointment Deletion**: Automatically triggered in `deleteAppointment()`
4. **Calendar Display**: Enhanced to show reflected appointments with visual indicators

### Data Structure

Reflected appointments include additional fields:
- `isReflected: true` - Identifies the appointment as reflected
- `originalAppointmentId` - Links to the original appointment
- `reflectionType` - Indicates direction ('physical-to-home' or 'home-to-physical')

## Benefits

1. **Prevents Double-Booking**: Automatic blocking across location types
2. **Visual Clarity**: Clear indication of staff availability across all locations
3. **Seamless Integration**: Works with existing appointment management system
4. **Real-Time Updates**: Immediate reflection of changes across locations
5. **Staff Efficiency**: No manual coordination needed between locations

## Configuration

### Staff Setup
To enable appointment reflection for a staff member:

```typescript
{
  homeService: true, // Enable home service capability
  locations: ["loc1", "loc2", "home"] // Assign to physical and home locations
}
```

### Location Types
- Physical locations: `loc1`, `loc2`, `loc3`, etc.
- Home service location: `home`

## Maintenance

### Cleanup Operations
The system includes cleanup utilities:

```typescript
// Remove orphaned reflected appointments
await appointmentReflectionService.cleanupOrphanedReflections();
```

### Monitoring
- Reflected appointments are logged for debugging
- Error handling ensures main appointment operations continue even if reflection fails
- Real-time events are emitted for cross-location updates

## Testing

Comprehensive tests verify:
- Correct reflection creation for home service staff
- No reflection for non-home service staff
- Proper synchronization of updates and deletions
- Visual indicators in calendar components
- Integration with existing conflict checking

Run tests with:
```bash
npm test lib/services/__tests__/appointment-reflection.test.ts
```

## Future Enhancements

1. **Bulk Operations**: Batch reflection updates for performance
2. **Advanced Scheduling**: Time-based reflection rules
3. **Notification System**: Alerts for reflection conflicts
4. **Analytics**: Reporting on reflection usage and conflicts
