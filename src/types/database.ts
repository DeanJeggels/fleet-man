export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          fleet_id: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          fleet_id?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          fleet_id?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_fleet_id_fkey"
            columns: ["fleet_id"]
            isOneToOne: false
            referencedRelation: "fleets"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_clients: {
        Row: {
          address_line: string | null
          anonymised_at: string | null
          city: string | null
          consented_at: string | null
          contact_person: string | null
          created_at: string
          default_rate_per_trip: number | null
          email: string | null
          fleet_id: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          province: string | null
          updated_at: string
        }
        Insert: {
          address_line?: string | null
          anonymised_at?: string | null
          city?: string | null
          consented_at?: string | null
          contact_person?: string | null
          created_at?: string
          default_rate_per_trip?: number | null
          email?: string | null
          fleet_id: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          updated_at?: string
        }
        Update: {
          address_line?: string | null
          anonymised_at?: string | null
          city?: string | null
          consented_at?: string | null
          contact_person?: string | null
          created_at?: string
          default_rate_per_trip?: number | null
          email?: string | null
          fleet_id?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_clients_fleet_id_fkey"
            columns: ["fleet_id"]
            isOneToOne: false
            referencedRelation: "fleets"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_invoices: {
        Row: {
          bank_account_holder: string | null
          bank_account_number: string | null
          bank_account_type: string | null
          bank_branch_code: string | null
          bank_name: string | null
          client_id: string
          created_at: string
          driver_id: string | null
          driver_name_snapshot: string | null
          fleet_id: string
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          paid_amount: number | null
          paid_at: string | null
          sent_at: string | null
          service_period_end: string
          service_period_start: string
          status: string
          subtotal: number
          total: number
          updated_at: string
          vehicle_id: string | null
          vehicle_registration_snapshot: string | null
        }
        Insert: {
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_account_type?: string | null
          bank_branch_code?: string | null
          bank_name?: string | null
          client_id: string
          created_at?: string
          driver_id?: string | null
          driver_name_snapshot?: string | null
          fleet_id: string
          id?: string
          invoice_date?: string
          invoice_number: string
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          sent_at?: string | null
          service_period_end: string
          service_period_start: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          vehicle_id?: string | null
          vehicle_registration_snapshot?: string | null
        }
        Update: {
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_account_type?: string | null
          bank_branch_code?: string | null
          bank_name?: string | null
          client_id?: string
          created_at?: string
          driver_id?: string | null
          driver_name_snapshot?: string | null
          fleet_id?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          sent_at?: string | null
          service_period_end?: string
          service_period_start?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          vehicle_id?: string | null
          vehicle_registration_snapshot?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "contract_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_invoices_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_invoices_fleet_id_fkey"
            columns: ["fleet_id"]
            isOneToOne: false
            referencedRelation: "fleets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_invoices_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_trips: {
        Row: {
          amount: number
          area: string
          client_id: string
          commission_amount: number | null
          company_label: string | null
          created_at: string
          driver_id: string | null
          fleet_id: string
          id: string
          invoice_id: string | null
          notes: string | null
          pax: number | null
          trip_date: string
          trip_time: string | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          amount: number
          area: string
          client_id: string
          commission_amount?: number | null
          company_label?: string | null
          created_at?: string
          driver_id?: string | null
          fleet_id: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          pax?: number | null
          trip_date: string
          trip_time?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          amount?: number
          area?: string
          client_id?: string
          commission_amount?: number | null
          company_label?: string | null
          created_at?: string
          driver_id?: string | null
          fleet_id?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          pax?: number | null
          trip_date?: string
          trip_time?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_trips_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "contract_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_trips_fleet_id_fkey"
            columns: ["fleet_id"]
            isOneToOne: false
            referencedRelation: "fleets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_trips_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "contract_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_payouts: {
        Row: {
          created_at: string
          driver_id: string
          fleet_id: string
          id: string
          notes: string | null
          paid_at: string | null
          period_end: string
          period_start: string
          status: string
          total_payout: number
          trip_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          fleet_id: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          period_end: string
          period_start: string
          status?: string
          total_payout: number
          trip_count: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          fleet_id?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          period_end?: string
          period_start?: string
          status?: string
          total_payout?: number
          trip_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_payouts_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_payouts_fleet_id_fkey"
            columns: ["fleet_id"]
            isOneToOne: false
            referencedRelation: "fleets"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          anonymised_at: string | null
          bank_account_number: string | null
          category: Database["public"]["Enums"]["fleet_category"]
          commission_per_trip: number | null
          consented_at: string | null
          created_at: string
          email: string | null
          first_name: string
          fleet_id: string
          id: string
          last_name: string
          license_expiry: string
          license_number: string
          notes: string | null
          phone: string | null
          status: Database["public"]["Enums"]["driver_status"]
          uber_driver_id: string | null
          updated_at: string
        }
        Insert: {
          anonymised_at?: string | null
          bank_account_number?: string | null
          category?: Database["public"]["Enums"]["fleet_category"]
          commission_per_trip?: number | null
          consented_at?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          fleet_id: string
          id?: string
          last_name: string
          license_expiry: string
          license_number: string
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["driver_status"]
          uber_driver_id?: string | null
          updated_at?: string
        }
        Update: {
          anonymised_at?: string | null
          bank_account_number?: string | null
          category?: Database["public"]["Enums"]["fleet_category"]
          commission_per_trip?: number | null
          consented_at?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          fleet_id?: string
          id?: string
          last_name?: string
          license_expiry?: string
          license_number?: string
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["driver_status"]
          uber_driver_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drivers_fleet_id_fkey"
            columns: ["fleet_id"]
            isOneToOne: false
            referencedRelation: "fleets"
            referencedColumns: ["id"]
          },
        ]
      }
      fleet_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          fleet_id: string
          id: string
          invited_by: string | null
          role: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          fleet_id: string
          id?: string
          invited_by?: string | null
          role?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          fleet_id?: string
          id?: string
          invited_by?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "fleet_invites_fleet_id_fkey"
            columns: ["fleet_id"]
            isOneToOne: false
            referencedRelation: "fleets"
            referencedColumns: ["id"]
          },
        ]
      }
      fleet_settings: {
        Row: {
          alert_days_threshold: number
          alert_km_threshold: number
          bank_account_holder: string | null
          bank_account_number: string | null
          bank_account_type: string | null
          bank_branch_code: string | null
          bank_name: string | null
          company_address_line: string | null
          company_city: string | null
          company_email: string | null
          company_name: string | null
          company_phone: string | null
          company_postal_code: string | null
          company_province: string | null
          created_at: string
          fleet_id: string
          id: string
          next_invoice_number: number
          notification_email: boolean
          notification_in_app: boolean
          notification_telegram: boolean
          telegram_chat_id: string | null
          uber_client_id: string | null
          uber_client_secret: string | null
          uber_org_uuid: string | null
          updated_at: string
        }
        Insert: {
          alert_days_threshold?: number
          alert_km_threshold?: number
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_account_type?: string | null
          bank_branch_code?: string | null
          bank_name?: string | null
          company_address_line?: string | null
          company_city?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          company_postal_code?: string | null
          company_province?: string | null
          created_at?: string
          fleet_id: string
          id?: string
          next_invoice_number?: number
          notification_email?: boolean
          notification_in_app?: boolean
          notification_telegram?: boolean
          telegram_chat_id?: string | null
          uber_client_id?: string | null
          uber_client_secret?: string | null
          uber_org_uuid?: string | null
          updated_at?: string
        }
        Update: {
          alert_days_threshold?: number
          alert_km_threshold?: number
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_account_type?: string | null
          bank_branch_code?: string | null
          bank_name?: string | null
          company_address_line?: string | null
          company_city?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          company_postal_code?: string | null
          company_province?: string | null
          created_at?: string
          fleet_id?: string
          id?: string
          next_invoice_number?: number
          notification_email?: boolean
          notification_in_app?: boolean
          notification_telegram?: boolean
          telegram_chat_id?: string | null
          uber_client_id?: string | null
          uber_client_secret?: string | null
          uber_org_uuid?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fleet_settings_fleet_id_fkey"
            columns: ["fleet_id"]
            isOneToOne: true
            referencedRelation: "fleets"
            referencedColumns: ["id"]
          },
        ]
      }
      fleets: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      fuel_logs: {
        Row: {
          cost: number
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          fleet_id: string
          id: string
          litres: number | null
          notes: string | null
          odometer_reading: number | null
          vehicle_id: string
          week_starting: string
        }
        Insert: {
          cost: number
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          fleet_id: string
          id?: string
          litres?: number | null
          notes?: string | null
          odometer_reading?: number | null
          vehicle_id: string
          week_starting: string
        }
        Update: {
          cost?: number
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          fleet_id?: string
          id?: string
          litres?: number | null
          notes?: string | null
          odometer_reading?: number | null
          vehicle_id?: string
          week_starting?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_logs_fleet_id_fkey"
            columns: ["fleet_id"]
            isOneToOne: false
            referencedRelation: "fleets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_event_types: {
        Row: {
          category: Database["public"]["Enums"]["maintenance_category"]
          created_at: string
          fleet_id: string | null
          id: string
          is_system: boolean
          name: string
          sort_order: number
        }
        Insert: {
          category?: Database["public"]["Enums"]["maintenance_category"]
          created_at?: string
          fleet_id?: string | null
          id?: string
          is_system?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["maintenance_category"]
          created_at?: string
          fleet_id?: string | null
          id?: string
          is_system?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_event_types_fleet_id_fkey"
            columns: ["fleet_id"]
            isOneToOne: false
            referencedRelation: "fleets"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_events: {
        Row: {
          ai_parse_confidence: number | null
          category: Database["public"]["Enums"]["maintenance_category"]
          cost_labour: number
          cost_parts: number
          cost_total: number
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          description: string | null
          event_date: string
          event_type_id: string | null
          fleet_id: string
          id: string
          invoice_file_url: string | null
          invoice_parsed_by_ai: boolean
          next_service_date: string | null
          next_service_km: number | null
          notes: string | null
          odometer_reading: number | null
          supplier_id: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          ai_parse_confidence?: number | null
          category?: Database["public"]["Enums"]["maintenance_category"]
          cost_labour?: number
          cost_parts?: number
          cost_total?: number
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          description?: string | null
          event_date?: string
          event_type_id?: string | null
          fleet_id: string
          id?: string
          invoice_file_url?: string | null
          invoice_parsed_by_ai?: boolean
          next_service_date?: string | null
          next_service_km?: number | null
          notes?: string | null
          odometer_reading?: number | null
          supplier_id?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          ai_parse_confidence?: number | null
          category?: Database["public"]["Enums"]["maintenance_category"]
          cost_labour?: number
          cost_parts?: number
          cost_total?: number
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          description?: string | null
          event_date?: string
          event_type_id?: string | null
          fleet_id?: string
          id?: string
          invoice_file_url?: string | null
          invoice_parsed_by_ai?: boolean
          next_service_date?: string | null
          next_service_km?: number | null
          notes?: string | null
          odometer_reading?: number | null
          supplier_id?: string | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_events_event_type_id_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "maintenance_event_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_events_fleet_id_fkey"
            columns: ["fleet_id"]
            isOneToOne: false
            referencedRelation: "fleets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_events_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_events_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_line_items: {
        Row: {
          created_at: string
          description: string
          fleet_id: string
          id: string
          item_type: Database["public"]["Enums"]["line_item_type"]
          line_total: number | null
          maintenance_event_id: string
          normalised_name: string | null
          quantity: number
          sort_order: number
          unit_cost: number
        }
        Insert: {
          created_at?: string
          description: string
          fleet_id: string
          id?: string
          item_type?: Database["public"]["Enums"]["line_item_type"]
          line_total?: number | null
          maintenance_event_id: string
          normalised_name?: string | null
          quantity?: number
          sort_order?: number
          unit_cost?: number
        }
        Update: {
          created_at?: string
          description?: string
          fleet_id?: string
          id?: string
          item_type?: Database["public"]["Enums"]["line_item_type"]
          line_total?: number | null
          maintenance_event_id?: string
          normalised_name?: string | null
          quantity?: number
          sort_order?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_line_items_fleet_id_fkey"
            columns: ["fleet_id"]
            isOneToOne: false
            referencedRelation: "fleets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_line_items_maintenance_event_id_fkey"
            columns: ["maintenance_event_id"]
            isOneToOne: false
            referencedRelation: "maintenance_events"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          driver_id: string | null
          fleet_id: string
          id: string
          is_read: boolean
          message: string
          type: Database["public"]["Enums"]["notification_type"]
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          driver_id?: string | null
          fleet_id: string
          id?: string
          is_read?: boolean
          message: string
          type: Database["public"]["Enums"]["notification_type"]
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          driver_id?: string | null
          fleet_id?: string
          id?: string
          is_read?: boolean
          message?: string
          type?: Database["public"]["Enums"]["notification_type"]
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_fleet_id_fkey"
            columns: ["fleet_id"]
            isOneToOne: false
            referencedRelation: "fleets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      odometer_readings: {
        Row: {
          created_at: string
          fleet_id: string
          id: string
          notes: string | null
          reading: number
          reading_date: string
          source: Database["public"]["Enums"]["odometer_source"]
          source_ref_id: string | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          fleet_id: string
          id?: string
          notes?: string | null
          reading: number
          reading_date?: string
          source: Database["public"]["Enums"]["odometer_source"]
          source_ref_id?: string | null
          vehicle_id: string
        }
        Update: {
          created_at?: string
          fleet_id?: string
          id?: string
          notes?: string | null
          reading?: number
          reading_date?: string
          source?: Database["public"]["Enums"]["odometer_source"]
          source_ref_id?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "odometer_readings_fleet_id_fkey"
            columns: ["fleet_id"]
            isOneToOne: false
            referencedRelation: "fleets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odometer_readings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_fleet: {
        Row: {
          created_at: string
          display_name: string | null
          fleet_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          fleet_id: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          fleet_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_fleet_fleet_id_fkey"
            columns: ["fleet_id"]
            isOneToOne: false
            referencedRelation: "fleets"
            referencedColumns: ["id"]
          },
        ]
      }
      service_schedules: {
        Row: {
          alert_days_threshold: number
          alert_km_threshold: number
          created_at: string
          fleet_id: string
          id: string
          interval_km: number | null
          interval_months: number | null
          last_service_date: string | null
          last_service_km: number | null
          next_service_date: string | null
          next_service_km: number | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          alert_days_threshold?: number
          alert_km_threshold?: number
          created_at?: string
          fleet_id: string
          id?: string
          interval_km?: number | null
          interval_months?: number | null
          last_service_date?: string | null
          last_service_km?: number | null
          next_service_date?: string | null
          next_service_km?: number | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          alert_days_threshold?: number
          alert_km_threshold?: number
          created_at?: string
          fleet_id?: string
          id?: string
          interval_km?: number | null
          interval_months?: number | null
          last_service_date?: string | null
          last_service_km?: number | null
          next_service_date?: string | null
          next_service_km?: number | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_schedules_fleet_id_fkey"
            columns: ["fleet_id"]
            isOneToOne: false
            referencedRelation: "fleets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_schedules_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: true
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          anonymised_at: string | null
          consented_at: string | null
          created_at: string
          email: string | null
          event_count: number
          fleet_id: string
          id: string
          location: string | null
          name: string
          notes: string | null
          phone: string | null
          total_spend: number
          updated_at: string
        }
        Insert: {
          anonymised_at?: string | null
          consented_at?: string | null
          created_at?: string
          email?: string | null
          event_count?: number
          fleet_id: string
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          total_spend?: number
          updated_at?: string
        }
        Update: {
          anonymised_at?: string | null
          consented_at?: string | null
          created_at?: string
          email?: string | null
          event_count?: number
          fleet_id?: string
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          total_spend?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_fleet_id_fkey"
            columns: ["fleet_id"]
            isOneToOne: false
            referencedRelation: "fleets"
            referencedColumns: ["id"]
          },
        ]
      }
      uber_trip_data: {
        Row: {
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          distance_km: number
          fleet_id: string
          hours_on_trip: number
          hours_online: number
          id: string
          period_date: string
          synced_at: string
          total_earnings: number
          total_trips: number
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          distance_km?: number
          fleet_id: string
          hours_on_trip?: number
          hours_online?: number
          id?: string
          period_date: string
          synced_at?: string
          total_earnings?: number
          total_trips?: number
          vehicle_id: string
        }
        Update: {
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          distance_km?: number
          fleet_id?: string
          hours_on_trip?: number
          hours_online?: number
          id?: string
          period_date?: string
          synced_at?: string
          total_earnings?: number
          total_trips?: number
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uber_trip_data_fleet_id_fkey"
            columns: ["fleet_id"]
            isOneToOne: false
            referencedRelation: "fleets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uber_trip_data_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_driver_assignments: {
        Row: {
          assigned_at: string
          created_at: string
          driver_id: string
          fleet_id: string
          id: string
          notes: string | null
          unassigned_at: string | null
          vehicle_id: string
        }
        Insert: {
          assigned_at?: string
          created_at?: string
          driver_id: string
          fleet_id: string
          id?: string
          notes?: string | null
          unassigned_at?: string | null
          vehicle_id: string
        }
        Update: {
          assigned_at?: string
          created_at?: string
          driver_id?: string
          fleet_id?: string
          id?: string
          notes?: string | null
          unassigned_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_driver_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_driver_assignments_fleet_id_fkey"
            columns: ["fleet_id"]
            isOneToOne: false
            referencedRelation: "fleets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_driver_assignments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          category: Database["public"]["Enums"]["fleet_category"]
          color: string | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          current_odometer: number
          date_added: string
          date_retired: string | null
          fleet_id: string
          id: string
          make: string
          model: string
          notes: string | null
          registration: string
          retirement_notes: string | null
          status: Database["public"]["Enums"]["vehicle_status"]
          summary_service_count: number
          total_distance_km: number
          total_earnings: number
          total_fuel_cost: number
          total_maintenance_cost: number
          total_trips: number
          uber_vehicle_id: string | null
          updated_at: string
          vehicle_type: string | null
          vin: string | null
          year: number | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["fleet_category"]
          color?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          current_odometer?: number
          date_added?: string
          date_retired?: string | null
          fleet_id: string
          id?: string
          make: string
          model: string
          notes?: string | null
          registration: string
          retirement_notes?: string | null
          status?: Database["public"]["Enums"]["vehicle_status"]
          summary_service_count?: number
          total_distance_km?: number
          total_earnings?: number
          total_fuel_cost?: number
          total_maintenance_cost?: number
          total_trips?: number
          uber_vehicle_id?: string | null
          updated_at?: string
          vehicle_type?: string | null
          vin?: string | null
          year?: number | null
        }
        Update: {
          category?: Database["public"]["Enums"]["fleet_category"]
          color?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          current_odometer?: number
          date_added?: string
          date_retired?: string | null
          fleet_id?: string
          id?: string
          make?: string
          model?: string
          notes?: string | null
          registration?: string
          retirement_notes?: string | null
          status?: Database["public"]["Enums"]["vehicle_status"]
          summary_service_count?: number
          total_distance_km?: number
          total_earnings?: number
          total_fuel_cost?: number
          total_maintenance_cost?: number
          total_trips?: number
          uber_vehicle_id?: string | null
          updated_at?: string
          vehicle_type?: string | null
          vin?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_fleet_id_fkey"
            columns: ["fleet_id"]
            isOneToOne: false
            referencedRelation: "fleets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_fleet_owner_or_admin: {
        Args: { target_fleet_id: string }
        Returns: boolean
      }
      user_fleet_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      currency_code: "ZAR" | "USD" | "EUR" | "GBP"
      driver_status: "active" | "inactive" | "suspended"
      fleet_category: "uber" | "contract"
      line_item_type: "parts" | "labour" | "consumable" | "other"
      maintenance_category:
        | "routine"
        | "repair"
        | "emergency"
        | "inspection"
        | "compliance"
        | "accident_related"
      notification_type:
        | "service_due"
        | "service_overdue"
        | "license_expiry"
        | "sync_failure"
        | "custom"
      odometer_source: "service" | "fuel_log" | "manual" | "uber_sync"
      vehicle_status: "active" | "maintenance" | "retired" | "sold"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      currency_code: ["ZAR", "USD", "EUR", "GBP"],
      driver_status: ["active", "inactive", "suspended"],
      fleet_category: ["uber", "contract"],
      line_item_type: ["parts", "labour", "consumable", "other"],
      maintenance_category: [
        "routine",
        "repair",
        "emergency",
        "inspection",
        "compliance",
        "accident_related",
      ],
      notification_type: [
        "service_due",
        "service_overdue",
        "license_expiry",
        "sync_failure",
        "custom",
      ],
      odometer_source: ["service", "fuel_log", "manual", "uber_sync"],
      vehicle_status: ["active", "maintenance", "retired", "sold"],
    },
  },
} as const

// ============================================================
// Custom types and convenience aliases
// ============================================================

// Invoice AI parsing types (used by maintenance invoice upload)
export interface ParsedInvoiceLineItem {
  description: string
  item_type: LineItemType
  quantity: number
  unit_cost: number
  normalised_name: string
}

export interface ParsedInvoice {
  supplier_name: string | null
  supplier_phone: string | null
  supplier_address: string | null
  vehicle_registration: string | null
  odometer_reading: number | null
  invoice_date: string | null
  invoice_number: string | null
  subtotal: number | null
  vat_inclusive: boolean
  total: number | null
  line_items: ParsedInvoiceLineItem[]
  description_summary: string | null
  inferred_event_type: string | null
  inferred_category: MaintenanceCategory | null
  confidence: number
}

// Convenience Row types
export type Fleet = Tables<"fleets">
export type ProfileFleet = Tables<"profiles_fleet">
export type FleetSettings = Tables<"fleet_settings">
export type FleetInvite = Tables<"fleet_invites">
export type AuditLog = Tables<"audit_logs">
export type Vehicle = Tables<"vehicles">
export type Driver = Tables<"drivers">
export type VehicleDriverAssignment = Tables<"vehicle_driver_assignments">
export type Supplier = Tables<"suppliers">
export type MaintenanceEventType = Tables<"maintenance_event_types">
export type MaintenanceEvent = Tables<"maintenance_events">
export type MaintenanceLineItem = Tables<"maintenance_line_items">
export type OdometerReading = Tables<"odometer_readings">
export type UberTripData = Tables<"uber_trip_data">
export type FuelLog = Tables<"fuel_logs">
export type ServiceSchedule = Tables<"service_schedules">
export type Notification = Tables<"notifications">

// Contract fleet aliases
export type ContractClient = Tables<"contract_clients">
export type ContractInvoice = Tables<"contract_invoices">
export type ContractTrip = Tables<"contract_trips">
export type DriverPayout = Tables<"driver_payouts">

// Enum types
export type FleetCategory = Database["public"]["Enums"]["fleet_category"]
export type VehicleStatus = Database["public"]["Enums"]["vehicle_status"]
export type DriverStatus = Database["public"]["Enums"]["driver_status"]
export type MaintenanceCategory = Database["public"]["Enums"]["maintenance_category"]
export type LineItemType = Database["public"]["Enums"]["line_item_type"]
export type OdometerSource = Database["public"]["Enums"]["odometer_source"]
export type NotificationType = Database["public"]["Enums"]["notification_type"]
export type CurrencyCode = Database["public"]["Enums"]["currency_code"]

// Role helpers
export type FleetRole = "owner" | "admin" | "member"
