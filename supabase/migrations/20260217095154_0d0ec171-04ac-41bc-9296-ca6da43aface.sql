
-- Normalize categories to agreed filter names

-- Shopping: toy store, clothing stores, department store, store, shopping mall, Retail
UPDATE activities SET category = 'Shopping', description = COALESCE(NULLIF(description, ''), 'Toy store') WHERE category = 'toy store';
UPDATE activities SET category = 'Shopping', description = COALESCE(NULLIF(description, ''), 'Children''s clothing store') WHERE category = 'Children''s Clothing Store';
UPDATE activities SET category = 'Shopping', description = COALESCE(NULLIF(description, ''), 'Clothing store') WHERE category IN ('clothing store', 'Clothing Store') AND (description IS NULL OR description = '');
UPDATE activities SET category = 'Shopping' WHERE category IN ('clothing store', 'Clothing Store') AND description IS NOT NULL AND description != '';
UPDATE activities SET category = 'Shopping', description = COALESCE(NULLIF(description, ''), 'Department store') WHERE category = 'department store';
UPDATE activities SET category = 'Shopping', description = COALESCE(NULLIF(description, ''), 'Shopping mall') WHERE category = 'shopping mall' AND (description IS NULL OR description = '');
UPDATE activities SET category = 'Shopping' WHERE category = 'shopping mall' AND description IS NOT NULL AND description != '';
UPDATE activities SET category = 'Shopping', description = COALESCE(NULLIF(description, ''), 'Retail store') WHERE category IN ('store', 'Retail');

-- Daycare: child care agency, Child Care Service, Preschool
UPDATE activities SET category = 'Daycare', description = COALESCE(NULLIF(description, ''), 'Child care service') WHERE category IN ('child care agency', 'Child Care Service');
UPDATE activities SET category = 'Daycare', description = COALESCE(NULLIF(description, ''), 'Preschool & early learning') WHERE category = 'Preschool';

-- Education: Psychologist, Mental Health Clinic (kids-focused services)
UPDATE activities SET category = 'Education', description = COALESCE(NULLIF(description, ''), 'Child psychology services') WHERE category IN ('Psychologist', 'Mental Health Clinic');

-- Education: Drama for Kids is already Preschool -> Daycare, but it's drama education
-- Arts and Entertainment -> Education (Creative Kids Co)
UPDATE activities SET category = 'Education', description = COALESCE(NULLIF(description, ''), 'Arts & entertainment for kids') WHERE category = 'Arts and Entertainment';

-- Sports and Recreation: Golf Course
UPDATE activities SET category = 'Sports and Recreation', description = COALESCE(NULLIF(description, ''), 'Golf course') WHERE category = 'Golf Course';

-- Normalize lowercase 'park' to 'Park'
UPDATE activities SET category = 'Park' WHERE category = 'park';

-- Pizza -> Restaurant
UPDATE activities SET category = 'Restaurant', description = COALESCE(NULLIF(description, ''), 'Pizza restaurant') WHERE category = 'Pizza';

-- tourist attraction -> keep but normalize case
UPDATE activities SET category = 'tourist attraction' WHERE category = 'point of interest';

-- Venue -> best-guess based on name
-- Cotton Candy Kids Double Bay -> Shopping
UPDATE activities SET category = 'Shopping', description = COALESCE(NULLIF(description, ''), 'Kids clothing & accessories') WHERE id = '4059c060-97c6-4520-b6c5-3cc31bce50b1';
-- Organic Babe & Kids Wear -> Shopping
UPDATE activities SET category = 'Shopping', description = COALESCE(NULLIF(description, ''), 'Organic kids clothing store') WHERE id = '8a96aded-75fb-4963-9a18-9632c3cde7e0';
-- Pegasus Counselling for Kids -> Education
UPDATE activities SET category = 'Education', description = COALESCE(NULLIF(description, ''), 'Counselling services for children') WHERE id = 'b3557385-9f43-46f9-998b-59044c826d8f';

-- Charity -> Education (kids charities/services)
UPDATE activities SET category = 'Education', description = COALESCE(NULLIF(description, ''), 'Children''s charity & community service') WHERE category = 'Charity';

-- Business and Professional Services -> Education (kids services)
UPDATE activities SET category = 'Education', description = COALESCE(NULLIF(description, ''), 'Kids professional services') WHERE category = 'Business and Professional Services';

-- Employment Agency -> Education
UPDATE activities SET category = 'Education', description = COALESCE(NULLIF(description, ''), 'Kids talent & modelling agency') WHERE category = 'Employment Agency';

-- service -> Education (Entertainment Emporium Kids Events)
UPDATE activities SET category = 'Education', description = COALESCE(NULLIF(description, ''), 'Kids entertainment & events') WHERE category = 'service';

-- StarDust Kids (point of interest, now tourist attraction) -> Education
UPDATE activities SET category = 'Education', description = COALESCE(NULLIF(description, ''), 'Kids entertainment') WHERE id = '12c8c367-4cce-47cd-8f4d-100424097519';

-- Hotel stays as-is but map to a known category if desired
-- Park Hyatt is a legitimate venue, keep it but no agreed filter → leave as "Hotel" or re-map
-- Actually let's keep it, it has a description already
