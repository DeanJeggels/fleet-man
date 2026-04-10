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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      billboard_signals: {
        Row: {
          company_name: string | null
          contact_hint: string | null
          created_at: string | null
          date_found: string
          headline: string | null
          id: string
          location: string | null
          project_name: string | null
          project_type: string | null
          relevance_score: number | null
          signal_id: string
          source_url: string | null
          status: string
          summary: string | null
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          contact_hint?: string | null
          created_at?: string | null
          date_found?: string
          headline?: string | null
          id?: string
          location?: string | null
          project_name?: string | null
          project_type?: string | null
          relevance_score?: number | null
          signal_id: string
          source_url?: string | null
          status?: string
          summary?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          contact_hint?: string | null
          created_at?: string | null
          date_found?: string
          headline?: string | null
          id?: string
          location?: string | null
          project_name?: string | null
          project_type?: string | null
          relevance_score?: number | null
          signal_id?: string
          source_url?: string | null
          status?: string
          summary?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string
          guest_id: string | null
          id: string
          room_id: string | null
          status: string | null
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          guest_id?: string | null
          id?: string
          room_id?: string | null
          status?: string | null
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          guest_id?: string | null
          id?: string
          room_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          call_date: string | null
          can_afford: boolean | null
          company_name: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          message: string | null
          phone: string
          problem: string | null
          recaptcha_token: string | null
          service_type: string
          timeline: string | null
          website: string | null
        }
        Insert: {
          call_date?: string | null
          can_afford?: boolean | null
          company_name?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          message?: string | null
          phone: string
          problem?: string | null
          recaptcha_token?: string | null
          service_type: string
          timeline?: string | null
          website?: string | null
        }
        Update: {
          call_date?: string | null
          can_afford?: boolean | null
          company_name?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          phone?: string
          problem?: string | null
          recaptcha_token?: string | null
          service_type?: string
          timeline?: string | null
          website?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          fts: unknown
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          fts?: unknown
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          fts?: unknown
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      documents_pjd: {
        Row: {
          content: string | null
          embedding: string | null
          fts: unknown
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          fts?: unknown
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          fts?: unknown
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      drivers: {
        Row: {
          created_at: string
          email: string | null
          first_name: string
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
          created_at?: string
          email?: string | null
          first_name: string
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
          created_at?: string
          email?: string | null
          first_name?: string
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
        Relationships: []
      }
      ebook_purchases: {
        Row: {
          amount_fee: number | null
          amount_gross: number
          amount_net: number | null
          created_at: string | null
          custom_int1: number | null
          custom_str1: string | null
          custom_str2: string | null
          download_count: number | null
          download_expires_at: string | null
          download_url: string | null
          email_address: string
          id: string
          ip_address: string | null
          item_description: string | null
          item_name: string
          merchant_id: string | null
          name_first: string | null
          name_last: string | null
          payment_status: string
          pf_payment_id: string
        }
        Insert: {
          amount_fee?: number | null
          amount_gross: number
          amount_net?: number | null
          created_at?: string | null
          custom_int1?: number | null
          custom_str1?: string | null
          custom_str2?: string | null
          download_count?: number | null
          download_expires_at?: string | null
          download_url?: string | null
          email_address: string
          id?: string
          ip_address?: string | null
          item_description?: string | null
          item_name: string
          merchant_id?: string | null
          name_first?: string | null
          name_last?: string | null
          payment_status?: string
          pf_payment_id: string
        }
        Update: {
          amount_fee?: number | null
          amount_gross?: number
          amount_net?: number | null
          created_at?: string | null
          custom_int1?: number | null
          custom_str1?: string | null
          custom_str2?: string | null
          download_count?: number | null
          download_expires_at?: string | null
          download_url?: string | null
          email_address?: string
          id?: string
          ip_address?: string | null
          item_description?: string | null
          item_name?: string
          merchant_id?: string | null
          name_first?: string | null
          name_last?: string | null
          payment_status?: string
          pf_payment_id?: string
        }
        Relationships: []
      }
      email_subscribers: {
        Row: {
          created_at: string | null
          email: string
          id: string
          last_emailed_at: string | null
          name: string | null
          source: string
          status: string
          tags: string[] | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          last_emailed_at?: string | null
          name?: string | null
          source?: string
          status?: string
          tags?: string[] | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          last_emailed_at?: string | null
          name?: string | null
          source?: string
          status?: string
          tags?: string[] | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      fuel_logs: {
        Row: {
          cost: number
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
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
          id?: string
          litres?: number | null
          notes?: string | null
          odometer_reading?: number | null
          vehicle_id?: string
          week_starting?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      launch_pipeline: {
        Row: {
          converted_at: string | null
          created_at: string | null
          email: string
          first_touch_at: string | null
          id: string
          notes: string | null
          revenue: number | null
          source: string | null
          stage: string
          updated_at: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          converted_at?: string | null
          created_at?: string | null
          email: string
          first_touch_at?: string | null
          id?: string
          notes?: string | null
          revenue?: number | null
          source?: string | null
          stage: string
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          converted_at?: string | null
          created_at?: string | null
          email?: string
          first_touch_at?: string | null
          id?: string
          notes?: string | null
          revenue?: number | null
          source?: string | null
          stage?: string
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      maintenance_event_types: {
        Row: {
          category: Database["public"]["Enums"]["maintenance_category"]
          created_at: string
          id: string
          is_system: boolean
          name: string
          sort_order: number
        }
        Insert: {
          category?: Database["public"]["Enums"]["maintenance_category"]
          created_at?: string
          id?: string
          is_system?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["maintenance_category"]
          created_at?: string
          id?: string
          is_system?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
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
            foreignKeyName: "maintenance_line_items_maintenance_event_id_fkey"
            columns: ["maintenance_event_id"]
            isOneToOne: false
            referencedRelation: "maintenance_events"
            referencedColumns: ["id"]
          },
        ]
      }
      matters: {
        Row: {
          active: boolean | null
          attorney_name: string | null
          client_email: string | null
          client_name: string | null
          client_whatsapp: string | null
          created_at: string | null
          id: string
          matter_ref: string
          preferred_channel: string | null
          property_address: string | null
        }
        Insert: {
          active?: boolean | null
          attorney_name?: string | null
          client_email?: string | null
          client_name?: string | null
          client_whatsapp?: string | null
          created_at?: string | null
          id?: string
          matter_ref: string
          preferred_channel?: string | null
          property_address?: string | null
        }
        Update: {
          active?: boolean | null
          attorney_name?: string | null
          client_email?: string | null
          client_name?: string | null
          client_whatsapp?: string | null
          created_at?: string | null
          id?: string
          matter_ref?: string
          preferred_channel?: string | null
          property_address?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          driver_id: string | null
          id: string
          is_read: boolean
          message: string
          type: Database["public"]["Enums"]["notification_type"]
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          driver_id?: string | null
          id?: string
          is_read?: boolean
          message: string
          type: Database["public"]["Enums"]["notification_type"]
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          driver_id?: string | null
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
            foreignKeyName: "odometer_readings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      pjd_chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          lead_captured: boolean | null
          messages: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_captured?: boolean | null
          messages?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_captured?: boolean | null
          messages?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pjd_leads: {
        Row: {
          board_type: string | null
          budget: string | null
          created_at: string | null
          email: string
          fin_setup: string | null
          glass_job: string | null
          height_cm: string | null
          id: string
          interest: string | null
          length_board: string | null
          message: string | null
          name: string
          notes: string | null
          phone: string | null
          source: string | null
          status: string | null
          thickness_board: string | null
          updated_at: string | null
          wave_type: string | null
          weight_kg: string | null
          width_board: string | null
        }
        Insert: {
          board_type?: string | null
          budget?: string | null
          created_at?: string | null
          email: string
          fin_setup?: string | null
          glass_job?: string | null
          height_cm?: string | null
          id?: string
          interest?: string | null
          length_board?: string | null
          message?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
          thickness_board?: string | null
          updated_at?: string | null
          wave_type?: string | null
          weight_kg?: string | null
          width_board?: string | null
        }
        Update: {
          board_type?: string | null
          budget?: string | null
          created_at?: string | null
          email?: string
          fin_setup?: string | null
          glass_job?: string | null
          height_cm?: string | null
          id?: string
          interest?: string | null
          length_board?: string | null
          message?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
          thickness_board?: string | null
          updated_at?: string | null
          wave_type?: string | null
          weight_kg?: string | null
          width_board?: string | null
        }
        Relationships: []
      }
      pjd_stock_boards: {
        Row: {
          condition: string | null
          created_at: string | null
          description: string | null
          dimensions: string | null
          featured: boolean | null
          id: string
          image_urls: string[] | null
          length_ft: string | null
          name: string
          price: number | null
          sold: boolean | null
          thickness_in: string | null
          width_in: string | null
        }
        Insert: {
          condition?: string | null
          created_at?: string | null
          description?: string | null
          dimensions?: string | null
          featured?: boolean | null
          id?: string
          image_urls?: string[] | null
          length_ft?: string | null
          name: string
          price?: number | null
          sold?: boolean | null
          thickness_in?: string | null
          width_in?: string | null
        }
        Update: {
          condition?: string | null
          created_at?: string | null
          description?: string | null
          dimensions?: string | null
          featured?: boolean | null
          id?: string
          image_urls?: string[] | null
          length_ft?: string | null
          name?: string
          price?: number | null
          sold?: boolean | null
          thickness_in?: string | null
          width_in?: string | null
        }
        Relationships: []
      }
      record_manager: {
        Row: {
          created_at: string
          data_type: string | null
          doc_id: string
          document_title: string | null
          hash: string
          id: number
          schema: string | null
        }
        Insert: {
          created_at?: string
          data_type?: string | null
          doc_id: string
          document_title?: string | null
          hash: string
          id?: number
          schema?: string | null
        }
        Update: {
          created_at?: string
          data_type?: string | null
          doc_id?: string
          document_title?: string | null
          hash?: string
          id?: number
          schema?: string | null
        }
        Relationships: []
      }
      record_manager_pjd: {
        Row: {
          created_at: string
          doc_id: string
          hash: string
          id: number
        }
        Insert: {
          created_at?: string
          doc_id: string
          hash: string
          id?: number
        }
        Update: {
          created_at?: string
          doc_id?: string
          hash?: string
          id?: number
        }
        Relationships: []
      }
      report_runs: {
        Row: {
          approved: boolean | null
          approved_by: string | null
          created_at: string | null
          delivery_channel: string | null
          extracted_json: Json | null
          id: string
          matter_id: string | null
          raw_source_url: string | null
          report_pdf_url: string | null
          run_date: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          approved?: boolean | null
          approved_by?: string | null
          created_at?: string | null
          delivery_channel?: string | null
          extracted_json?: Json | null
          id?: string
          matter_id?: string | null
          raw_source_url?: string | null
          report_pdf_url?: string | null
          run_date: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          approved?: boolean | null
          approved_by?: string | null
          created_at?: string | null
          delivery_channel?: string | null
          extracted_json?: Json | null
          id?: string
          matter_id?: string | null
          raw_source_url?: string | null
          report_pdf_url?: string | null
          run_date?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_runs_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          capacity: number
          created_at: string
          description: string | null
          id: string
          name: string
          price_per_night: number
          size_sqm: number | null
        }
        Insert: {
          capacity: number
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price_per_night: number
          size_sqm?: number | null
        }
        Update: {
          capacity?: number
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price_per_night?: number
          size_sqm?: number | null
        }
        Relationships: []
      }
      service_schedules: {
        Row: {
          alert_days_threshold: number
          alert_km_threshold: number
          created_at: string
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
          created_at: string
          email: string | null
          event_count: number
          id: string
          location: string | null
          name: string
          notes: string | null
          phone: string | null
          total_spend: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          event_count?: number
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          total_spend?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          event_count?: number
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          total_spend?: number
          updated_at?: string
        }
        Relationships: []
      }
      tabular_document_rows: {
        Row: {
          created_at: string
          id: number
          record_manager_id: number | null
          row_data: Json | null
        }
        Insert: {
          created_at?: string
          id?: number
          record_manager_id?: number | null
          row_data?: Json | null
        }
        Update: {
          created_at?: string
          id?: number
          record_manager_id?: number | null
          row_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "tabular_document_rows_record_manager_id_fkey"
            columns: ["record_manager_id"]
            isOneToOne: false
            referencedRelation: "record_manager"
            referencedColumns: ["id"]
          },
        ]
      }
      uber_trip_data: {
        Row: {
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          distance_km: number
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
          id: string
          notes: string | null
          unassigned_at: string | null
          vehicle_id: string
        }
        Insert: {
          assigned_at?: string
          created_at?: string
          driver_id: string
          id?: string
          notes?: string | null
          unassigned_at?: string | null
          vehicle_id: string
        }
        Update: {
          assigned_at?: string
          created_at?: string
          driver_id?: string
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
          color: string | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          current_odometer: number
          date_added: string
          date_retired: string | null
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
          color?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          current_odometer?: number
          date_added?: string
          date_retired?: string | null
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
          color?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          current_odometer?: number
          date_added?: string
          date_retired?: string | null
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
        Relationships: []
      }
      website_demo: {
        Row: {
          company_name: string | null
          created_at: string | null
          full_name: string | null
          id: number
          job_title: string | null
          niche: string | null
          recaptcha_token: string | null
          summary: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: number
          job_title?: string | null
          niche?: string | null
          recaptcha_token?: string | null
          summary?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: number
          job_title?: string | null
          niche?: string | null
          recaptcha_token?: string | null
          summary?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_incoming_booking: { Args: never; Returns: undefined }
      create_profile: {
        Args: {
          user_email: string
          user_full_name: string
          user_id: string
          user_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: undefined
      }
      get_available_rooms: {
        Args: { requested_check_in: string; requested_guests: number }
        Returns: {
          capacity: number
          description: string
          price: number
          room_name: string
        }[]
      }
      get_purchase_counts: {
        Args: never
        Returns: {
          item_name: string
          purchase_count: number
        }[]
      }
      hybrid_search_pjd: {
        Args: {
          filter?: Json
          full_text_weight?: number
          match_count?: number
          query_embedding: string
          query_text: string
          rrf_k?: number
          semantic_weight?: number
        }
        Returns: {
          content: string
          fts_rank: number
          hybrid_score: number
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      hybrid_search_pjd_with_details: {
        Args: {
          filter?: Json
          match_count?: number
          query_embedding: string
          query_text: string
          rrf_k?: number
        }
        Returns: {
          combined_score: number
          content: string
          id: number
          keyword_rank: number
          keyword_score: number
          metadata: Json
          vector_rank: number
          vector_score: number
        }[]
      }
      hybrid_search_v2: {
        Args: {
          filter?: Json
          full_text_weight?: number
          match_count?: number
          query_embedding: string
          query_text: string
          rrf_k?: number
          semantic_weight?: number
        }
        Returns: {
          content: string
          fts_rank: number
          hybrid_score: number
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      insert_signal_if_new: {
        Args: {
          p_company_name: string
          p_contact_hint: string
          p_date_found: string
          p_location: string
          p_project_name: string
          p_project_type: string
          p_relevance_score: number
          p_signal_id: string
          p_source_url: string
          p_summary: string
        }
        Returns: {
          company_name: string | null
          contact_hint: string | null
          created_at: string | null
          date_found: string
          headline: string | null
          id: string
          location: string | null
          project_name: string | null
          project_type: string | null
          relevance_score: number | null
          signal_id: string
          source_url: string | null
          status: string
          summary: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "billboard_signals"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      is_fleet_user: { Args: never; Returns: boolean }
      keyword_search_pjd: {
        Args: { filter?: Json; match_count?: number; query_text: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          rank: number
        }[]
      }
      match_documents_pjd: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      booking_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "en_route"
        | "in_progress"
        | "completed"
        | "cancelled"
      currency_code: "ZAR" | "USD" | "EUR" | "GBP"
      driver_status: "active" | "inactive" | "suspended"
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
      user_role: "client" | "tradesman"
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
      booking_status: [
        "pending",
        "accepted",
        "rejected",
        "en_route",
        "in_progress",
        "completed",
        "cancelled",
      ],
      currency_code: ["ZAR", "USD", "EUR", "GBP"],
      driver_status: ["active", "inactive", "suspended"],
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
      user_role: ["client", "tradesman"],
      vehicle_status: ["active", "maintenance", "retired", "sold"],
    },
  },
} as const

// Invoice AI parsing types
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

// Convenience types for fleet tables
export type Vehicle = Tables<"vehicles">;
export type Driver = Tables<"drivers">;
export type VehicleDriverAssignment = Tables<"vehicle_driver_assignments">;
export type Supplier = Tables<"suppliers">;
export type MaintenanceEventType = Tables<"maintenance_event_types">;
export type MaintenanceEvent = Tables<"maintenance_events">;
export type MaintenanceLineItem = Tables<"maintenance_line_items">;
export type OdometerReading = Tables<"odometer_readings">;
export type UberTripData = Tables<"uber_trip_data">;
export type FuelLog = Tables<"fuel_logs">;
export type ServiceSchedule = Tables<"service_schedules">;
export type Notification = Tables<"notifications">;

// Enum types
export type VehicleStatus = Database["public"]["Enums"]["vehicle_status"];
export type DriverStatus = Database["public"]["Enums"]["driver_status"];
export type MaintenanceCategory = Database["public"]["Enums"]["maintenance_category"];
export type LineItemType = Database["public"]["Enums"]["line_item_type"];
export type OdometerSource = Database["public"]["Enums"]["odometer_source"];
export type NotificationType = Database["public"]["Enums"]["notification_type"];
export type CurrencyCode = Database["public"]["Enums"]["currency_code"];
