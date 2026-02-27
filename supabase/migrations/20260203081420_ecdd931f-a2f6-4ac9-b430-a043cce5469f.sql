-- Create a function to bulk import activities from JSON data
CREATE OR REPLACE FUNCTION public.bulk_import_activities(activities_json JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  activity JSONB;
  inserted_count INTEGER := 0;
  amenities_arr TEXT[];
BEGIN
  FOR activity IN SELECT * FROM jsonb_array_elements(activities_json)
  LOOP
    -- Parse amenities string into array
    amenities_arr := string_to_array(activity->>'amenities', ',');
    
    INSERT INTO activities (
      name, category, latitude, longitude, rating, review_count,
      description, address, phone, is_open,
      wifi, parking, wheelchair_accessible, outdoor_seating, pet_friendly,
      hero_image_url, hours_open, hours_close
    ) VALUES (
      activity->>'name',
      activity->>'category',
      (activity->>'latitude')::NUMERIC,
      (activity->>'longitude')::NUMERIC,
      (activity->>'rating')::NUMERIC,
      (activity->>'review_count')::INTEGER,
      activity->>'description',
      CONCAT(activity->>'address', ', ', activity->>'suburb'),
      activity->>'phone',
      TRUE,
      'wifi' = ANY(amenities_arr),
      'parking' = ANY(amenities_arr),
      'wheelchair_accessible' = ANY(amenities_arr),
      'outdoor' = ANY(amenities_arr) OR 'outdoor_seating' = ANY(amenities_arr),
      'pet_friendly' = ANY(amenities_arr),
      CASE (activity->>'category')
        WHEN 'Cafe' THEN 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop'
        WHEN 'Restaurant' THEN 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop'
        WHEN 'Bar' THEN 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&h=600&fit=crop'
        WHEN 'Park' THEN 'https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?w=800&h=600&fit=crop'
        WHEN 'Beach' THEN 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop'
        WHEN 'Museum' THEN 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&h=600&fit=crop'
        WHEN 'Gym' THEN 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop'
        WHEN 'Shopping' THEN 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&h=600&fit=crop'
        ELSE 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop'
      END,
      CASE (activity->>'category')
        WHEN 'Cafe' THEN '7:00 AM'
        WHEN 'Restaurant' THEN '11:00 AM'
        WHEN 'Bar' THEN '4:00 PM'
        WHEN 'Park' THEN '6:00 AM'
        WHEN 'Beach' THEN '6:00 AM'
        WHEN 'Museum' THEN '10:00 AM'
        WHEN 'Gym' THEN '5:00 AM'
        WHEN 'Shopping' THEN '9:00 AM'
        ELSE '9:00 AM'
      END,
      CASE (activity->>'category')
        WHEN 'Cafe' THEN '5:00 PM'
        WHEN 'Restaurant' THEN '10:00 PM'
        WHEN 'Bar' THEN '2:00 AM'
        WHEN 'Park' THEN '8:00 PM'
        WHEN 'Beach' THEN '8:00 PM'
        WHEN 'Museum' THEN '5:00 PM'
        WHEN 'Gym' THEN '10:00 PM'
        WHEN 'Shopping' THEN '6:00 PM'
        ELSE '5:00 PM'
      END
    );
    inserted_count := inserted_count + 1;
  END LOOP;
  
  RETURN inserted_count;
END;
$$;