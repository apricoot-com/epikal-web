# Calendar & Scheduling Architecture

This document outlines the architecture for the calendar and scheduling module, enabling service-based businesses (clinics, salons, etc.) to manage appointments.

---

## Overview

| Aspect | Decision |
|--------|----------|
| Who books | Both customers (public) and staff |
| What gets scheduled | Professionals, with optional room booking (Pro) |
| Services | Predefined with fixed durations |
| Working hours | Per professional, constrained by location |
| Recurring events | Not supported |
| Multiple locations | Enterprise feature only |
| Customers | Contact info only, no user accounts |
| Walk-ins | Supported |

---

## Core Entities

```
Company
  └── Location(s)           [Enterprise: multiple]
        ├── LocationHours
        ├── Professional(s)
        │     ├── ProfessionalHours
        │     ├── ProfessionalTimeOff
        │     └── ProfessionalServices
        ├── Resource(s)      [Pro feature]
        └── Appointment(s)
```

---

## Data Model

### Location

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `companyId` | string | FK to Company |
| `name` | string | "Main Clinic", "Downtown Office" |
| `address` | string | Full address |
| `timezone` | string | e.g., "America/New_York" |
| `isActive` | boolean | Soft delete flag |
| `createdAt` | datetime | |

### LocationHours

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `locationId` | string | FK to Location |
| `dayOfWeek` | int | 0-6 (Sunday-Saturday) |
| `startTime` | string | "09:00" |
| `endTime` | string | "18:00" |
| `isClosed` | boolean | True if closed this day |

### Service

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `companyId` | string | FK to Company |
| `name` | string | "Haircut", "Consultation" |
| `description` | string | Optional description |
| `durationMinutes` | int | 30, 60, etc. |
| `price` | decimal | Optional, for display |
| `isActive` | boolean | |

### Professional

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `userId` | string | FK to User |
| `locationId` | string | FK to Location |
| `title` | string | "Dr.", "Stylist" |
| `bio` | string | Optional bio |
| `isActive` | boolean | |

### ProfessionalHours

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `professionalId` | string | FK to Professional |
| `dayOfWeek` | int | 0-6 |
| `startTime` | string | Must be within location hours |
| `endTime` | string | Must be within location hours |
| `isOff` | boolean | Not working this day |

### ProfessionalTimeOff

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `professionalId` | string | FK to Professional |
| `startDate` | date | |
| `endDate` | date | |
| `reason` | string | Optional |

### ProfessionalService

| Field | Type | Description |
|-------|------|-------------|
| `professionalId` | string | FK to Professional |
| `serviceId` | string | FK to Service |

### Resource (Pro Feature)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `locationId` | string | FK to Location |
| `name` | string | "Room 1", "Station A" |
| `type` | enum | `room`, `equipment` |
| `isActive` | boolean | |

### Appointment

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `companyId` | string | FK to Company |
| `locationId` | string | FK to Location |
| `professionalId` | string | FK to Professional |
| `serviceId` | string | FK to Service |
| `resourceId` | string | FK to Resource (nullable, Pro) |
| `customerName` | string | Customer's name |
| `customerEmail` | string | Optional |
| `customerPhone` | string | Optional |
| `startTime` | datetime | Appointment start |
| `endTime` | datetime | Calculated from service duration |
| `status` | enum | See statuses below |
| `notes` | string | Optional notes |
| `isWalkIn` | boolean | True if walk-in, not pre-booked |
| `bookedBy` | string | FK to User who created it |
| `createdAt` | datetime | |
| `updatedAt` | datetime | |

### Appointment Statuses

| Status | Description |
|--------|-------------|
| `scheduled` | Booked, awaiting confirmation or time |
| `confirmed` | Confirmed by staff/customer |
| `in_progress` | Currently happening |
| `completed` | Successfully finished |
| `cancelled` | Cancelled before start |
| `no_show` | Customer didn't show up |

---

## Availability Logic

When checking if a time slot is available:

```
1. Is the LOCATION open?
   → Check LocationHours for day/time

2. Is the PROFESSIONAL working?
   → Check ProfessionalHours for day/time
   → Check ProfessionalTimeOff for exceptions

3. Is the PROFESSIONAL free?
   → Check no overlapping Appointments

4. (Pro) Is the RESOURCE available?
   → Check no overlapping Appointments using that resource
```

---

## Booking Flows

### Customer Booking (Public)

```
1. Select Location (if enterprise with multiple)
2. Select Service
3. View available Professionals for that service
4. Select Professional
5. View available time slots
6. (Pro) Select Resource if required
7. Enter contact details (name, email, phone)
8. Confirm → Appointment created
```

### Staff Booking

```
1. Open Professional's calendar view
2. Click on time slot (or "Add Walk-in")
3. Select Service
4. (Pro) Select Resource if needed
5. Enter customer details
6. Save → Appointment created
```

### Walk-in Handling

```
1. Staff clicks "Add Walk-in"
2. Selects current or next available slot
3. Enters customer details
4. Creates appointment with isWalkIn = true
```

---

## Business Rules

1. **Professional hours ⊆ Location hours**
   - Professionals cannot work outside location operating hours
   - Validation enforced on save

2. **One location per professional**
   - Simplifies scheduling
   - Can expand to multi-location professionals later

3. **Services are company-wide**
   - All locations share the same service catalog
   - Professionals opt-in via ProfessionalService

4. **Appointment duration = Service duration**
   - No per-appointment duration overrides
   - Keeps scheduling predictable

5. **Customers are contact info only**
   - No user accounts for customers
   - Stored directly on Appointment

---

## Feature Gating by Plan

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Professionals | 1-3 | Unlimited | Unlimited |
| Services | 5 | Unlimited | Unlimited |
| Resource/room booking | ❌ | ✅ | ✅ |
| Multiple locations | ❌ | ❌ | ✅ |
| Custom booking page | Basic | Branded | Fully custom |
| Walk-ins | ✅ | ✅ | ✅ |

---

## UI Views

### Professional's Agenda View

- Daily/weekly calendar showing their appointments
- Color-coded by status or service type
- Quick actions: mark complete, cancel, no-show

### Location Calendar (Admin)

- View all professionals' schedules side-by-side
- Drag-and-drop to reschedule
- Filter by professional or service

### Public Booking Page

- Company-branded booking flow
- Select service → professional → time
- Mobile-friendly

---

## Future Considerations

Items explicitly not included but may be added later:

- [ ] Recurring appointments
- [ ] Buffer time between appointments
- [ ] External calendar sync (Google, Outlook)
- [ ] SMS/Email reminders
- [ ] Professional working at multiple locations
- [ ] Customer accounts with booking history
- [ ] Online payments at booking
- [ ] Waitlist when fully booked

---

## Related Documents

- [User, Company & Billing Architecture](./user-company-billing.md) - Users, companies, roles, subscriptions
