import { createClient } from "@supabase/supabase-js"
import type { Database } from "./supabase"

export function createServerClient() {
  const supabaseUrl = "https://nayexzdxocanaafwvsso.supabase.co"
  const serviceRoleKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5heWV4emR4b2NhbmFhZnd2c3NvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc2NTU1MiwiZXhwIjoyMDcwMzQxNTUyfQ.ZZhDrvYI3XGhLOqLs3F-m-5lTJBqZ4E1R-4xjgVEQCo"

  return createClient<Database>(supabaseUrl, serviceRoleKey)
}
