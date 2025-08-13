-- Migration script to update existing database schema
-- This script should be run after the initial setup scripts

-- 1. Add date_of_birth column to participants table
ALTER TABLE participants ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- 2. Update existing participants to have a default date_of_birth (you may want to manually update these)
-- For now, we'll set a default date based on current age
UPDATE participants 
SET date_of_birth = CURRENT_DATE - INTERVAL '1 year' * age 
WHERE date_of_birth IS NULL;

-- 3. Make date_of_birth NOT NULL after setting default values
ALTER TABLE participants ALTER COLUMN date_of_birth SET NOT NULL;

-- 4. Rename jamaats table to majlis
ALTER TABLE jamaats RENAME TO majlis;

-- 5. Update foreign key references in participants table
ALTER TABLE participants RENAME COLUMN jamaat_id TO majlis_id;

-- 6. Update the foreign key constraint
ALTER TABLE participants DROP CONSTRAINT IF EXISTS participants_jamaat_id_fkey;
ALTER TABLE participants ADD CONSTRAINT participants_majlis_id_fkey 
  FOREIGN KEY (majlis_id) REFERENCES majlis(id) ON DELETE CASCADE;

-- 7. Update registration_counters table to use 'Khuddam' instead of 'Khudam'
UPDATE registration_counters SET category = 'Khuddam' WHERE category = 'Khudam';

-- 8. Update existing participants to use 'Khuddam' instead of 'Khudam'
UPDATE participants SET category = 'Khuddam' WHERE category = 'Khudam';

-- 9. Update the check constraint on participants table
ALTER TABLE participants DROP CONSTRAINT IF EXISTS participants_category_check;
ALTER TABLE participants ADD CONSTRAINT participants_category_check 
  CHECK (category IN ('Khuddam', 'Atfal', 'Under 7'));

-- 10. Update event_settings table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'event_settings') THEN
    -- Update column names
    ALTER TABLE event_settings RENAME COLUMN khudam_ordinal TO khuddam_ordinal;
    
    -- Update default values
    ALTER TABLE event_settings ALTER COLUMN event_name SET DEFAULT 'Annual Majlis Khuddam-ul-Ahmadiyya Kenya Ijtemaa';
    
    -- Update existing data
    UPDATE event_settings 
    SET event_name = 'Annual Majlis Khuddam-ul-Ahmadiyya Kenya Ijtemaa',
        khuddam_ordinal = khudam_ordinal
    WHERE event_name LIKE '%Khudam%';
    
    -- Drop the old column if it still exists
    ALTER TABLE event_settings DROP COLUMN IF EXISTS khudam_ordinal;
  END IF;
END $$;

-- 11. Create or replace functions for age and category calculation
CREATE OR REPLACE FUNCTION calculate_age(date_of_birth DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM AGE(date_of_birth));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION determine_category(date_of_birth DATE)
RETURNS VARCHAR(10) AS $$
DECLARE
  age_years INTEGER;
BEGIN
  age_years := EXTRACT(YEAR FROM AGE(date_of_birth));
  
  IF age_years < 7 THEN
    RETURN 'Under 7';
  ELSIF age_years >= 7 AND age_years <= 15 THEN
    RETURN 'Atfal';
  ELSIF age_years >= 15 AND age_years <= 40 THEN
    RETURN 'Khuddam';
  ELSE
    RETURN 'Under 7'; -- Default for ages outside expected range
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 12. Update the generate_registration_number function
CREATE OR REPLACE FUNCTION generate_registration_number(participant_category VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
  prefix VARCHAR(1);
  counter_val INTEGER;
  reg_number VARCHAR(10);
  deleted_number VARCHAR(10);
  total_participants INTEGER;
BEGIN
  -- Set prefix based on category
  IF participant_category = 'Khuddam' THEN
    prefix := 'K';
  ELSIF participant_category = 'Atfal' THEN
    prefix := 'A';
  ELSIF participant_category = 'Under 7' THEN
    prefix := 'U';
  ELSE
    RAISE EXCEPTION 'Invalid category: %', participant_category;
  END IF;
  
  -- Check if there's any existing data for this category
  SELECT COUNT(*) INTO total_participants 
  FROM participants 
  WHERE category = participant_category;
  
  -- If no existing data, check for deleted registration numbers to reuse
  IF total_participants = 0 THEN
    -- Get the oldest deleted registration number for this category
    SELECT registration_number INTO deleted_number
    FROM deleted_registration_numbers
    WHERE category = participant_category
    ORDER BY deleted_at ASC
    LIMIT 1;
    
    -- If there's a deleted number, reuse it
    IF deleted_number IS NOT NULL THEN
      DELETE FROM deleted_registration_numbers 
      WHERE registration_number = deleted_number;
      RETURN deleted_number;
    END IF;
  END IF;
  
  -- If there's existing data or no deleted numbers to reuse, proceed with normal logic
  -- First check for any deleted numbers to reuse (even if there's existing data)
  SELECT registration_number INTO deleted_number
  FROM deleted_registration_numbers
  WHERE category = participant_category
  ORDER BY deleted_at ASC
  LIMIT 1;
  
  -- If there's a deleted number, reuse it
  IF deleted_number IS NOT NULL THEN
    DELETE FROM deleted_registration_numbers 
    WHERE registration_number = deleted_number;
    RETURN deleted_number;
  END IF;
  
  -- Update and get counter for new registration number
  UPDATE registration_counters 
  SET counter = counter + 1 
  WHERE category = participant_category
  RETURNING counter INTO counter_val;
  
  -- Format registration number
  reg_number := prefix || LPAD(counter_val::TEXT, 3, '0');
  
  RETURN reg_number;
END;
$$ LANGUAGE plpgsql;

-- 13. Create trigger to automatically update age and category when date_of_birth changes
CREATE OR REPLACE FUNCTION update_age_and_category()
RETURNS TRIGGER AS $$
BEGIN
  -- Update age based on date of birth
  NEW.age := calculate_age(NEW.date_of_birth);
  
  -- Update category based on date of birth
  NEW.category := determine_category(NEW.date_of_birth);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 14. Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_age_category_trigger ON participants;
CREATE TRIGGER update_age_category_trigger
  BEFORE INSERT OR UPDATE ON participants
  FOR EACH ROW
  EXECUTE FUNCTION update_age_and_category();

-- 15. Update the get_event_name function if event_settings table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'event_settings') THEN
    CREATE OR REPLACE FUNCTION get_event_name(participant_category VARCHAR)
    RETURNS VARCHAR AS $$
    DECLARE
      settings RECORD;
      formatted_name VARCHAR;
      khuddam_suffix VARCHAR;
      atfal_suffix VARCHAR;
    BEGIN
      SELECT * INTO settings FROM event_settings ORDER BY id DESC LIMIT 1;
      
      -- Generate ordinal suffixes for Khuddam
      SELECT CASE 
        WHEN settings.khuddam_ordinal % 100 BETWEEN 11 AND 13 THEN 'th'
        WHEN settings.khuddam_ordinal % 10 = 1 THEN 'st'
        WHEN settings.khuddam_ordinal % 10 = 2 THEN 'nd'
        WHEN settings.khuddam_ordinal % 10 = 3 THEN 'rd'
        ELSE 'th'
      END INTO khuddam_suffix;
      
      -- Generate ordinal suffixes for Atfal
      SELECT CASE 
        WHEN settings.atfal_ordinal % 100 BETWEEN 11 AND 13 THEN 'th'
        WHEN settings.atfal_ordinal % 10 = 1 THEN 'st'
        WHEN settings.atfal_ordinal % 10 = 2 THEN 'nd'
        WHEN settings.atfal_ordinal % 10 = 3 THEN 'rd'
        ELSE 'th'
      END INTO atfal_suffix;
      
      IF participant_category = 'Khuddam' THEN
        formatted_name := settings.khuddam_ordinal || khuddam_suffix || ' ' || settings.event_name;
      ELSIF participant_category = 'Atfal' THEN
        formatted_name := settings.atfal_ordinal || atfal_suffix || ' Annual Majlis Atfal-ul-Ahmadiyya Kenya Ijtemaa';
      ELSE
        formatted_name := settings.event_name;
      END IF;
      
      RETURN formatted_name;
    END;
    $$ LANGUAGE plpgsql;
  END IF;
END $$;

-- 16. Update any existing data that might have the old category values
UPDATE participants SET category = 'Khuddam' WHERE category = 'Khudam';

-- 17. Verify the changes
SELECT 'Migration completed successfully. Please verify the following:' as status;
SELECT '1. date_of_birth column added to participants table' as check_item;
SELECT '2. jamaats table renamed to majlis' as check_item;
SELECT '3. Khudam updated to Khuddam throughout' as check_item;
SELECT '4. New functions and triggers created' as check_item;
