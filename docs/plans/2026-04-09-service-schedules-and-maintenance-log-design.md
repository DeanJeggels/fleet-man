# Service Schedule Management + Recent Maintenance Log

**Date:** 2026-04-09
**Status:** Approved

## Problem

1. The `service_schedules` table exists in Supabase with full schema but has zero management UI. Fleet managers cannot create, view, or edit service intervals for their vehicles.
2. The dashboard lacks a structured view of recent maintenance events. The activity feed mixes maintenance with notifications and doesn't show costs or categories.

## Design

### Feature 1: Service Schedule Card (Vehicle Overview Tab)

**Location:** New card in the Overview tab of `/vehicles/[id]`.

**States:**
- No schedule: "No service schedule configured" message + "Set Up Schedule" button
- Has schedule: displays interval, last/next service info, status badge + "Edit" button

**Displayed fields:**
- Service interval: "Every X km / Y months"
- Last service: date + km
- Next service: date + km
- Status: Overdue (red) / Due Soon (amber, <=14 days or within km threshold) / OK (green)

**Dialog form (create & edit):**
- Interval km (`inputMode="numeric"`)
- Interval months (`inputMode="numeric"`)
- Last service date (date picker)
- Last service km (`inputMode="numeric"`)
- Next service date (auto-calculated, editable)
- Next service km (auto-calculated, editable)

**Data:** Direct Supabase INSERT/UPDATE on `service_schedules`. 1:1 with vehicles via FK.

### Feature 2: Recent Maintenance Log (Dashboard)

**Location:** Replaces `ActivityFeed` in dashboard layout.

**Component:** `RecentMaintenance` — fetches last 8 `maintenance_events` joined with `vehicles(registration)` and `suppliers(name)`.

**Columns:** Date | Vehicle | Description (truncated) | Category (badge) | Cost (right-aligned)

**Mobile:** Card-based layout using `useIsMobile()` hook (same pattern as DataTable).

**Footer:** "View all" link to `/reports`.

## Files

| Action | File |
|---|---|
| Create | `src/components/vehicles/service-schedule-card.tsx` |
| Edit | `src/components/vehicles/tabs/overview-tab.tsx` |
| Create | `src/components/dashboard/recent-maintenance.tsx` |
| Edit | `src/app/(dashboard)/dashboard/page.tsx` |

## Existing code to reuse

- `useIsMobile()` from `src/hooks/use-mobile.ts`
- Category badge pattern from `activity-feed.tsx` and `report-viewer.tsx`
- Calendar/Popover date picker pattern from `maintenance-form.tsx`
- Dialog pattern from `maintenance-form.tsx` (Add Vehicle/Supplier dialogs)
- `service_schedules` types from `src/types/database.ts`
