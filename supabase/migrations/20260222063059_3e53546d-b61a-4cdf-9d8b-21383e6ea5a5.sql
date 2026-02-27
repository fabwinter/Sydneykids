CREATE OR REPLACE FUNCTION public.admin_update_activity(p_activity_id uuid, p_updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE activities SET
    name = COALESCE(p_updates->>'name', name),
    description = COALESCE(p_updates->>'description', description),
    category = COALESCE(p_updates->>'category', category),
    address = COALESCE(p_updates->>'address', address),
    phone = COALESCE(p_updates->>'phone', phone),
    website = COALESCE(p_updates->>'website', website),
    hero_image_url = COALESCE(p_updates->>'hero_image_url', hero_image_url),
    hours_open = COALESCE(p_updates->>'hours_open', hours_open),
    hours_close = COALESCE(p_updates->>'hours_close', hours_close),
    wifi = COALESCE((p_updates->>'wifi')::boolean, wifi),
    parking = COALESCE((p_updates->>'parking')::boolean, parking),
    wheelchair_accessible = COALESCE((p_updates->>'wheelchair_accessible')::boolean, wheelchair_accessible),
    outdoor_seating = COALESCE((p_updates->>'outdoor_seating')::boolean, outdoor_seating),
    pet_friendly = COALESCE((p_updates->>'pet_friendly')::boolean, pet_friendly),
    family_friendly = COALESCE((p_updates->>'family_friendly')::boolean, family_friendly),
    high_chairs = COALESCE((p_updates->>'high_chairs')::boolean, high_chairs),
    change_rooms = COALESCE((p_updates->>'change_rooms')::boolean, change_rooms),
    coffee = COALESCE((p_updates->>'coffee')::boolean, coffee),
    power_outlets = COALESCE((p_updates->>'power_outlets')::boolean, power_outlets),
    showers = COALESCE((p_updates->>'showers')::boolean, showers),
    bike_parking = COALESCE((p_updates->>'bike_parking')::boolean, bike_parking),
    shade = COALESCE((p_updates->>'shade')::boolean, shade),
    rating = COALESCE((p_updates->>'rating')::numeric, rating),
    is_event = COALESCE((p_updates->>'is_event')::boolean, is_event),
    event_dates = COALESCE(p_updates->>'event_dates', event_dates),
    event_cost = COALESCE(p_updates->>'event_cost', event_cost),
    ticket_url = COALESCE(p_updates->>'ticket_url', ticket_url),
    organizer_name = COALESCE(p_updates->>'organizer_name', organizer_name),
    organizer_phone = COALESCE(p_updates->>'organizer_phone', organizer_phone),
    organizer_website = COALESCE(p_updates->>'organizer_website', organizer_website),
    organizer_facebook = COALESCE(p_updates->>'organizer_facebook', organizer_facebook),
    organizer_instagram = COALESCE(p_updates->>'organizer_instagram', organizer_instagram),
    source_url = COALESCE(p_updates->>'source_url', source_url),
    region = COALESCE(p_updates->>'region', region),
    show_in_whats_on = COALESCE((p_updates->>'show_in_whats_on')::boolean, show_in_whats_on),
    show_in_featured = COALESCE((p_updates->>'show_in_featured')::boolean, show_in_featured),
    updated_at = now()
  WHERE id = p_activity_id;
END;
$$;