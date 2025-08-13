import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://nayexzdxocanaafwvsso.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5heWV4emR4b2NhbmFhZnd2c3NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NjU1NTIsImV4cCI6MjA3MDM0MTU1Mn0.mYkvun2_FRk3uIkL8Pkevb48IZNc_TY1QDa7L5AEYTI"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      regions: {
        Row: {
          id: number
          name: string
          created_at: string
        }
        Insert: {
          name: string
        }
        Update: {
          name?: string
        }
      }
      jamaats: {
        Row: {
          id: number
          name: string
          region_id: number
          created_at: string
        }
        Insert: {
          name: string
          region_id: number
        }
        Update: {
          name?: string
          region_id?: number
        }
      }
      participants: {
        Row: {
          id: number
          registration_number: string
          full_name: string
          age: number
          category: "Khudam" | "Atfal"
          phone_number: string
          region_id: number
          jamaat_id: number
          date_of_arrival: string
          luggage_box_number: string | null
          created_at: string
          created_by: string
        }
        Insert: {
          registration_number: string
          full_name: string
          age: number
          category: "Khudam" | "Atfal"
          phone_number: string
          region_id: number
          jamaat_id: number
          date_of_arrival: string
          luggage_box_number?: string
          created_by: string
        }
        Update: {
          full_name?: string
          age?: number
          category?: "Khudam" | "Atfal"
          phone_number?: string
          region_id?: number
          jamaat_id?: number
          date_of_arrival?: string
          luggage_box_number?: string
        }
      }
    }
  }
}
