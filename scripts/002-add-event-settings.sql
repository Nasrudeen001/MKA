-- Create event_settings table with integer ordinals
CREATE TABLE IF NOT EXISTS event_settings (
  id SERIAL PRIMARY KEY,
  event_name VARCHAR(200) NOT NULL DEFAULT 'Annual Majlis Khuddam-ul-Ahmadiyya Kenya Ijtemaa',
  khuddam_ordinal INTEGER NOT NULL DEFAULT 51,
  atfal_ordinal INTEGER NOT NULL DEFAULT 23,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  venue VARCHAR(200) NOT NULL DEFAULT 'Nairobi, Kenya',
  theme VARCHAR(300),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL DEFAULT CURRENT_DATE + INTERVAL '3 days',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO event_settings (
  event_name,
  khuddam_ordinal,
  atfal_ordinal,
  year,
  venue,
  theme,
  start_date,
  end_date
) VALUES (
  'Annual Majlis Khuddam-ul-Ahmadiyya Kenya Ijtemaa',
  51,
  23,
  2024,
  'Nairobi, Kenya',
  'Strengthening Faith Through Unity',
  '2024-12-20',
  '2024-12-23'
) ON CONFLICT DO NOTHING;

-- Function to get formatted event name by category with automatic ordinal suffix generation
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

-- Function to generate ordinal suffix for any number
CREATE OR REPLACE FUNCTION get_ordinal_suffix(num INTEGER)
RETURNS VARCHAR AS $$
BEGIN
  RETURN CASE 
    WHEN num % 100 BETWEEN 11 AND 13 THEN 'th'
    WHEN num % 10 = 1 THEN 'st'
    WHEN num % 10 = 2 THEN 'nd'
    WHEN num % 10 = 3 THEN 'rd'
    ELSE 'th'
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to format number with ordinal suffix
CREATE OR REPLACE FUNCTION format_ordinal(num INTEGER)
RETURNS VARCHAR AS $$
BEGIN
  RETURN num || get_ordinal_suffix(num);
END;
$$ LANGUAGE plpgsql;
