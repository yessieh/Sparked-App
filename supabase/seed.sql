-- ============================================================================
-- DEV SEED — NOT A MIGRATION. Never run against production data.
-- One seed host workspace + events scattered around Sahuarita/Tucson/Phoenix
-- at varying distances so the distance-pure feed is verifiable from the test
-- origin (Sahuarita: 31.9576, -110.9556, 25 mi radius).
--   • 7 published events IN radius (≈0.4 → ≈18.5 mi, mixed categories/fees)
--   • 2 published events OUT of radius (Oro Valley ~30 mi, Phoenix ~100 mi)
--     — must NOT appear in the feed
--   • 1 draft event at the origin — must NOT appear (status filter)
-- Idempotent: deletes its own fixed-UUID rows first, then re-inserts.
-- Times are relative to now() so countdowns are live at any run date.
-- ============================================================================

-- Wipe prior seed rows (workspace delete cascades its events).
delete from public.workspaces where id = '22222222-2222-2222-2222-222222222222';
delete from auth.users where id = '11111111-1111-1111-1111-111111111111';

-- Seed auth user → signup trigger creates the profile.
insert into auth.users
  (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('11111111-1111-1111-1111-111111111111',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'seed-host@example.com', '', now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"name":"Seed Host"}'::jsonb,
   now(), now());

-- Seed workspace → trigger creates the owner membership.
insert into public.workspaces (id, name, bio, location_text, created_by)
values
  ('22222222-2222-2222-2222-222222222222',
   'Desert Nights Collective',
   'Community events across the Santa Cruz valley — markets, music, and starry nights.',
   'Sahuarita, AZ',
   '11111111-1111-1111-1111-111111111111');

-- Events. location = geography point (lng, lat). Distances noted from the
-- Sahuarita test origin.
insert into public.events
  (id, workspace_id, title, description, tier_id, status, starts_at, ends_at,
   venue_name, address, location, entry_fee_cents, publish_fee_cents)
values
  -- ~0.4 mi — free, markets/food, this evening
  ('33333333-0001-4000-8000-000000000001', '22222222-2222-2222-2222-222222222222',
   'Sahuarita Farmers Market', '40+ local vendors, produce, and breakfast burritos.',
   'standard', 'published', now() + interval '6 hours', now() + interval '9 hours',
   'Sahuarita Town Hall Plaza', '375 W Sahuarita Center Way, Sahuarita, AZ 85629',
   extensions.st_setsrid(extensions.st_makepoint(-110.9559, 31.9629), 4326)::extensions.geography,
   0, 500),

  -- ~1.2 mi — $5, music/community, tomorrow evening
  ('33333333-0002-4000-8000-000000000002', '22222222-2222-2222-2222-222222222222',
   'Lakeside Songwriters Night', 'Four local writers, one mic, sunset over the lake.',
   'plus', 'published', now() + interval '1 day 3 hours', now() + interval '1 day 6 hours',
   'Rancho Sahuarita Lake Club', '15455 S Camino Lago Azul, Sahuarita, AZ 85629',
   extensions.st_setsrid(extensions.st_makepoint(-110.9694, 31.9448), 4326)::extensions.geography,
   500, 1500),

  -- ~4.5 mi — free CURBSIDE post (auto-tags the curbside category)
  ('33333333-0003-4000-8000-000000000003', '22222222-2222-2222-2222-222222222222',
   'Neighborhood Yard Sale — Quail Creek', 'Furniture, tools, and a very loved kayak.',
   'curbside', 'published', now() + interval '2 days', now() + interval '2 days 5 hours',
   null, '2055 E Quail Crossing Blvd, Green Valley, AZ 85614',
   extensions.st_setsrid(extensions.st_makepoint(-110.9245, 31.9047), 4326)::extensions.geography,
   0, null),

  -- ~7.5 mi — free, art/community, in 3 days
  ('33333333-0004-4000-8000-000000000004', '22222222-2222-2222-2222-222222222222',
   'Green Valley Art Walk', 'A slow stroll past 12 studios and two live murals.',
   'standard', 'published', now() + interval '3 days', now() + interval '3 days 3 hours',
   'Green Valley Village', '101 S La Cañada Dr, Green Valley, AZ 85614',
   extensions.st_setsrid(extensions.st_makepoint(-110.9937, 31.8543), 4326)::extensions.geography,
   0, 500),

  -- ~11 mi — free, markets/art, in 4 days
  ('33333333-0005-4000-8000-000000000005', '22222222-2222-2222-2222-222222222222',
   'San Xavier Craft Fair', 'Tohono O''odham artisans, frybread, and desert honey.',
   'standard', 'published', now() + interval '4 days', now() + interval '4 days 6 hours',
   'Mission San Xavier del Bac', '1950 W San Xavier Rd, Tucson, AZ 85746',
   extensions.st_setsrid(extensions.st_makepoint(-111.0081, 32.1067), 4326)::extensions.geography,
   0, 500),

  -- ~17 mi — $12, outdoors/family, in 5 days
  ('33333333-0006-4000-8000-000000000006', '22222222-2222-2222-2222-222222222222',
   'Madera Canyon Stargazing', 'Telescopes, rangers, and the Milky Way from 5,000 ft.',
   'plus', 'published', now() + interval '5 days', now() + interval '5 days 3 hours',
   'Madera Canyon Amphitheater', 'Madera Canyon Rd, Amado, AZ 85645',
   extensions.st_setsrid(extensions.st_makepoint(-110.8802, 31.7256), 4326)::extensions.geography,
   1200, 1500),

  -- ~18.5 mi — $8, food/community, LIVE RIGHT NOW (countdown shows NOW)
  ('33333333-0007-4000-8000-000000000007', '22222222-2222-2222-2222-222222222222',
   'Downtown Food Truck Round-Up', 'A dozen trucks along the streetcar line, live acoustic sets.',
   'standard', 'published', now() - interval '1 hour', now() + interval '2 hours',
   'Jácome Plaza', '101 N Stone Ave, Tucson, AZ 85701',
   extensions.st_setsrid(extensions.st_makepoint(-110.9747, 32.2226), 4326)::extensions.geography,
   800, 500),

  -- ~30 mi — OUT of the 25 mi radius; must NOT appear in the feed
  ('33333333-0008-4000-8000-000000000008', '22222222-2222-2222-2222-222222222222',
   'Oro Valley Concert in the Park', 'OUT-OF-RADIUS CONTROL — should never render.',
   'standard', 'published', now() + interval '2 days', now() + interval '2 days 3 hours',
   'James D. Kriegh Park', '23 W Calle Concordia, Oro Valley, AZ 85704',
   extensions.st_setsrid(extensions.st_makepoint(-110.9665, 32.3909), 4326)::extensions.geography,
   0, 500),

  -- ~100 mi — far OUT of radius; must NOT appear
  ('33333333-0009-4000-8000-000000000009', '22222222-2222-2222-2222-222222222222',
   'Phoenix First Friday', 'OUT-OF-RADIUS CONTROL — should never render.',
   'plus', 'published', now() + interval '3 days', now() + interval '3 days 5 hours',
   'Roosevelt Row', 'E Roosevelt St, Phoenix, AZ 85004',
   extensions.st_setsrid(extensions.st_makepoint(-112.0740, 33.4484), 4326)::extensions.geography,
   0, 1500),

  -- draft at the origin — must NOT appear (status filter)
  ('33333333-0010-4000-8000-000000000010', '22222222-2222-2222-2222-222222222222',
   'Draft Event — Should Not Render', 'STATUS CONTROL — drafts stay invisible.',
   'standard', 'draft', now() + interval '1 day', now() + interval '1 day 2 hours',
   'Nowhere', null,
   extensions.st_setsrid(extensions.st_makepoint(-110.9556, 31.9576), 4326)::extensions.geography,
   0, null);

-- Category tags (the curbside event self-tags via trigger; skip it here).
insert into public.event_categories (event_id, category_id) values
  ('33333333-0001-4000-8000-000000000001', 'markets'),
  ('33333333-0001-4000-8000-000000000001', 'food'),
  ('33333333-0002-4000-8000-000000000002', 'music'),
  ('33333333-0002-4000-8000-000000000002', 'community'),
  ('33333333-0004-4000-8000-000000000004', 'art'),
  ('33333333-0004-4000-8000-000000000004', 'community'),
  ('33333333-0005-4000-8000-000000000005', 'markets'),
  ('33333333-0005-4000-8000-000000000005', 'art'),
  ('33333333-0005-4000-8000-000000000005', 'pop-ups'),
  ('33333333-0006-4000-8000-000000000006', 'outdoors'),
  ('33333333-0006-4000-8000-000000000006', 'family'),
  ('33333333-0007-4000-8000-000000000007', 'food'),
  ('33333333-0007-4000-8000-000000000007', 'community'),
  ('33333333-0008-4000-8000-000000000008', 'music'),
  ('33333333-0009-4000-8000-000000000009', 'art');
