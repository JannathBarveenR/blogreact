-- Vaccines (5 dog + 3 cat). animal_type tags the vaccine row, not the pet.
INSERT INTO vaccine_database (vaccine_name, animal_type, default_interval_days) VALUES
  ('Rabies','dog',365),('DHPP','dog',365),('Leptospirosis','dog',365),
  ('Bordetella','dog',180),('Canine Influenza','dog',365),
  ('Rabies','cat',365),('FVRCP','cat',365),('FeLV','cat',365)
ON CONFLICT DO NOTHING;

-- Shampoos (20 across 5 categories)
INSERT INTO shampoo_database (brand_name, category) VALUES
  ('Ketochlor','anti_fungal'),('Micodin','anti_fungal'),('Ketohex','anti_fungal'),
  ('Malaseb','anti_fungal'),('Sebolytic','anti_dandruff'),('Erina EP','tick_flea'),
  ('Scaboma','tick_flea'),('Tick Free','tick_flea'),('Clinar M','anti_fungal'),
  ('Allermyl','anti_itch'),('Dermavet','general'),('Canifur','anti_fungal'),
  ('Himalaya Erina Coat Cleanser','general'),('Sebolytic Plus','anti_dandruff'),
  ('Selco','anti_dandruff'),('Coatex','general'),('Virbac Epi-Soothe','anti_itch'),
  ('Petben','anti_dandruff'),('Savavet Kiskin','anti_itch'),('Vetoquinol Skingel','anti_itch')
ON CONFLICT DO NOTHING;

-- Optional starter medicines (safe to extend later; users can add via is_preloaded=false)
INSERT INTO medicine_database (brand_name, composition, medicine_type, strength) VALUES
  ('Cephalexin','Cephalexin','tablet','500mg'),
  ('Amoxyclav','Amoxicillin + Clavulanic Acid','tablet','250mg'),
  ('Meloxicam','Meloxicam','syrup','1.5mg/ml'),
  ('Ciplox Eye Drops','Ciprofloxacin','eye_drop','0.3%'),
  ('Panderm','Clotrimazole + Beclomethasone','ointment',NULL)
ON CONFLICT DO NOTHING;
