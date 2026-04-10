# Multi-Tenant Fleet Isolation

**Date:** 2026-04-10
**Status:** Approved

## Problem

All 12 data tables use a single RLS policy (`auth.uid() IS NOT NULL`), meaning any authenticated user can read/write all fleet data. Adding a second user exposes everything.

## Solution

Fleet-scoped multi-tenancy with `fleets` + `profiles_fleet` tables, `fleet_id` FK on all data tables, and rewritten RLS policies.

## New Tables

### `fleets`
- `id` UUID PK
- `name` TEXT NOT NULL
- `created_by` UUID NOT NULL → auth.users(id)
- `created_at`, `updated_at` TIMESTAMPTZ

### `profiles_fleet`
- `id` UUID PK
- `user_id` UUID NOT NULL → auth.users(id) ON DELETE CASCADE
- `fleet_id` UUID NOT NULL → fleets(id) ON DELETE CASCADE
- `role` TEXT NOT NULL DEFAULT 'member' CHECK (owner/admin/member)
- `display_name` TEXT
- `created_at` TIMESTAMPTZ
- UNIQUE(user_id, fleet_id)
- INDEX on (user_id)

## Column Addition

Add `fleet_id UUID NOT NULL REFERENCES fleets(id)` + index to all 12 tables:
vehicles, drivers, vehicle_driver_assignments, suppliers, maintenance_event_types, maintenance_events, maintenance_line_items, odometer_readings, uber_trip_data, fuel_logs, service_schedules, notifications.

## RLS

Helper function:
```sql
CREATE OR REPLACE FUNCTION user_fleet_ids()
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = '' AS $$
  SELECT fleet_id FROM public.profiles_fleet WHERE user_id = auth.uid()
$$;
```

All data tables:
```sql
CREATE POLICY "fleet_isolation" ON <table> FOR ALL
  USING (fleet_id IN (SELECT user_fleet_ids()))
  WITH CHECK (fleet_id IN (SELECT user_fleet_ids()));
```

## Auto-create on Signup

Trigger on `auth.users` INSERT → creates fleet + profiles_fleet (owner role).

## Frontend

- `FleetProvider` context with `useFleet()` hook → `{ fleetId, role, displayName }`
- All queries add `.eq("fleet_id", fleetId)`
- All inserts include `fleet_id`
- Topbar shows user display name

## Migration

Wipe all data, drop old RLS, create new tables/columns/policies, re-seed maintenance_event_types.

## Files

| Action | File |
|---|---|
| Create | `src/contexts/fleet-context.tsx` |
| Edit | `src/app/(dashboard)/layout.tsx` |
| Edit | `src/components/layout/topbar.tsx` |
| Edit | All page/component files with Supabase queries |
| Regenerate | `src/types/database.ts` |
