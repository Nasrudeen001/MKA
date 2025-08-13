-- Create regions table
CREATE TABLE IF NOT EXISTS regions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create majlis table (renamed from jamaats)
CREATE TABLE IF NOT EXISTS majlis (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  region_id INTEGER REFERENCES regions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
  id SERIAL PRIMARY KEY,
  registration_number VARCHAR(10) UNIQUE NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  date_of_birth DATE NOT NULL,
  age INTEGER NOT NULL,
  category VARCHAR(10) CHECK (category IN ('Khuddam', 'Atfal', 'Under 7')) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  region_id INTEGER REFERENCES regions(id),
  majlis_id INTEGER REFERENCES majlis(id),
  date_of_arrival DATE NOT NULL,
  luggage_box_number VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id)
);

-- Create sequence counters table for registration numbers
CREATE TABLE IF NOT EXISTS registration_counters (
  category VARCHAR(10) PRIMARY KEY,
  counter INTEGER DEFAULT 0
);

-- Create table to track deleted registration numbers for reuse
CREATE TABLE IF NOT EXISTS deleted_registration_numbers (
  id SERIAL PRIMARY KEY,
  registration_number VARCHAR(10) NOT NULL,
  category VARCHAR(10) NOT NULL,
  deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initialize counters
INSERT INTO registration_counters (category, counter) VALUES 
  ('Khuddam', 0),
  ('Atfal', 0),
  ('Under 7', 0)
ON CONFLICT (category) DO NOTHING;

-- Insert the correct regions
INSERT INTO regions (name) VALUES 
  ('North Coast'),
  ('South Coast'),
  ('Taveta'),
  ('Voi'),
  ('Eastern'),
  ('Nairobi'),
  ('Nakuru'),
  ('Eldoret'),
  ('Western B'),
  ('Western A'),
  ('Kisumu'),
  ('Mabera')
ON CONFLICT (name) DO NOTHING;

-- Insert Majlis for North Coast (region_id = 1) (renamed from Jamaats)
INSERT INTO majlis (name, region_id) VALUES 
  ('Mombasa (H/Q)', 1),
  ('Mtondia', 1),
  ('Kibarani', 1),
  ('Kwakadogo/Chigombero', 1),
  ('Kwakikololo-Kadzonzo', 1),
  ('Kaloleni', 1),
  ('Katolani/Mwangoloto', 1),
  ('Mwakijembe', 1),
  ('Magozoni', 1),
  ('Nzovuni', 1),
  ('Chibuga', 1)
ON CONFLICT DO NOTHING;

-- Insert Majlis for South Coast (region_id = 2) (renamed from Jamaats)
INSERT INTO majlis (name, region_id) VALUES 
  ('Ukunda (H/Q)', 2),
  ('Mazumalume/Jorori', 2),
  ('Msulwa', 2),
  ('Tangini', 2),
  ('Mwereni', 2),
  ('Jelephi/Gandini', 2),
  ('Mirihini/Vyogato', 2),
  ('Kifyonzo/Maponda', 2),
  ('KwaMasaai', 2),
  ('Dzombo', 2),
  ('Kinyungu', 2),
  ('Bomani', 2),
  ('Nguluku', 2),
  ('Vitsangalaweni', 2)
ON CONFLICT DO NOTHING;

-- Insert Majlis for Taveta (region_id = 3) (renamed from Jamaats)
INSERT INTO majlis (name, region_id) VALUES 
  ('Kitobo (H/Q)', 3),
  ('Mrabani', 3),
  ('Eldoro', 3),
  ('Kitoghoto', 3)
ON CONFLICT DO NOTHING;

-- Insert Majlis for Voi (region_id = 4) (renamed from Jamaats)
INSERT INTO majlis (name, region_id) VALUES 
  ('Mwatunge (H/Q)', 4),
  ('Voi', 4),
  ('Majengoi', 4)
ON CONFLICT DO NOTHING;

-- Insert Majlis for Eastern (region_id = 5) (renamed from Jamaats)
INSERT INTO majlis (name, region_id) VALUES 
  ('Kathiani (H/Q)', 5),
  ('Mitaboni-Miumbuni', 5),
  ('Kauti', 5),
  ('Kabati', 5),
  ('Kikombaa-Mwala', 5)
ON CONFLICT DO NOTHING;

-- Insert Majlis for Nairobi (region_id = 6) (renamed from Jamaats)
INSERT INTO majlis (name, region_id) VALUES 
  ('Nairobi Centre (H/Q)', 6),
  ('Kasarani', 6),
  ('Dandora', 6),
  ('Kenol', 6),
  ('Jacaranda', 6),
  ('Gitugi (Muranga)', 6)
ON CONFLICT DO NOTHING;

-- Insert Majlis for Nakuru (region_id = 7) (renamed from Jamaats)
INSERT INTO majlis (name, region_id) VALUES 
  ('Nakuru (H/Q)', 7),
  ('Bahati', 7),
  ('Menengai', 7),
  ('Gilgil', 7),
  ('Naivasha/Kongoni', 7),
  ('Njoro', 7)
ON CONFLICT DO NOTHING;

-- Insert Majlis for Eldoret (region_id = 8) (renamed from Jamaats)
INSERT INTO majlis (name, region_id) VALUES 
  ('Eldoret (H/Q)', 8),
  ('Kuryot', 8),
  ('Mafuta Farm', 8),
  ('Ngara Falls', 8),
  ('Kapsabet', 8),
  ('Mugondoi/Shiru', 8),
  ('Makutano', 8),
  ('Soy/Sinoko', 8)
ON CONFLICT DO NOTHING;

-- Insert Majlis for Western B (region_id = 9) (renamed from Jamaats)
INSERT INTO majlis (name, region_id) VALUES 
  ('Inyesi', 9),
  ('Matawa', 9),
  ('Chibombo-Muluwa', 9),
  ('Musamba-Singalo', 9),
  ('Mumias', 9),
  ('Namusasi-Khasoko', 9),
  ('Makale', 9),
  ('Mungatsi-Siera', 9),
  ('Kwangamor-Dulienge', 9),
  ('Namisi', 9),
  ('Mundika-Matayos/Nasewa', 9),
  ('Hakati/Ganjala', 9),
  ('Buhuru-Bukhaya/Ingusi', 9)
ON CONFLICT DO NOTHING;

-- Insert Majlis for Western A (region_id = 10) (renamed from Jamaats)
INSERT INTO majlis (name, region_id) VALUES 
  ('Kakamega/Khayega (HQ)', 10),
  ('Indangalasia', 10),
  ('Shianda', 10),
  ('Shibinga', 10),
  ('Elwaminyi/Emulundu', 10),
  ('Malere', 10),
  ('Eshibimbi/Eshibehe', 10),
  ('Sinoko/Matisi', 10),
  ('Misikhu', 10),
  ('Ndivisi', 10)
ON CONFLICT DO NOTHING;

-- Insert Majlis for Kisumu (region_id = 11) (renamed from Jamaats)
INSERT INTO majlis (name, region_id) VALUES 
  ('Kisumu (H/Q)', 11),
  ('Ngiya', 11),
  ('Ugunja', 11),
  ('Korwenje-Ojola', 11),
  ('Banja/Chebilat', 11),
  ('Hamisi', 11),
  ('Luanda', 11),
  ('Holo', 11),
  ('Kombewa', 11),
  ('Khumsalaba-Yala', 11),
  ('Jebrock', 11)
ON CONFLICT DO NOTHING;

-- Insert Majlis for Mabera (region_id = 12) (renamed from Jamaats)
INSERT INTO majlis (name, region_id) VALUES 
  ('Mabera-Moheto (H/Q)', 12),
  ('Nyangoge/Nyangichenche', 12),
  ('Kombe/Masaba', 12),
  ('Kegonga', 12),
  ('Getongoroma', 12),
  ('Nyamagongwe', 12)
ON CONFLICT DO NOTHING;

-- Function to calculate age from date of birth
CREATE OR REPLACE FUNCTION calculate_age(date_of_birth DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM AGE(date_of_birth));
END;
$$ LANGUAGE plpgsql;

-- Function to determine category based on date of birth
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

-- Function to generate registration number with logic to check existing data and reuse deleted numbers
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

-- Function to handle registration number reuse when participant is deleted
CREATE OR REPLACE FUNCTION handle_participant_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- When a participant is deleted, add their registration number to the deleted numbers table
  INSERT INTO deleted_registration_numbers (registration_number, category)
  VALUES (OLD.registration_number, OLD.category);
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically track deleted registration numbers
CREATE TRIGGER participant_deletion_trigger
  AFTER DELETE ON participants
  FOR EACH ROW
  EXECUTE FUNCTION handle_participant_deletion();

-- Create trigger to automatically update age and category when date_of_birth changes
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

-- Create trigger to automatically update age and category
CREATE TRIGGER update_age_category_trigger
  BEFORE INSERT OR UPDATE ON participants
  FOR EACH ROW
  EXECUTE FUNCTION update_age_and_category();
