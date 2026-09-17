-- Seed the Hospital Facility Type
INSERT INTO public.inspection_facility_types (code, name, description, active)
VALUES ('hospital', 'Hospital', 'Comprehensive checklist for Hospital facility accreditation', true)
ON CONFLICT (code) DO UPDATE SET active = true, name = EXCLUDED.name;

-- Seed Sections for Hospital
INSERT INTO public.inspection_template_sections (facility_type_code, section_code, title, display_order, weight)
VALUES 
('hospital', 'ELIGIBILITY', 'Eligibility Criteria', 1, 0),
('hospital', 'PROFILE', 'Facility Profile', 2, 0),
('hospital', 'PERSONNEL', 'Section B — Personnel', 3, 25),
('hospital', 'INFRASTRUCTURE', 'Section C — Infrastructure', 4, 57),
('hospital', 'SERVICES', 'Section D — Essential Services', 5, 18)
ON CONFLICT (facility_type_code, section_code) DO NOTHING;

-- Eligibility Criteria for Hospital
INSERT INTO public.inspection_template_items (facility_type_code, section_code, item_code, label, description, input_type, max_points, is_required, display_order)
VALUES
('hospital', 'ELIGIBILITY', 'E1', 'Accredited by the National Health Insurance Authority (NHIA)', NULL, 'MET_NOT_MET', 0, true, 1),
('hospital', 'ELIGIBILITY', 'E2', 'Registered with the Ondo State Ministry of Health (SMOH)', NULL, 'MET_NOT_MET', 0, true, 2),
('hospital', 'ELIGIBILITY', 'E3', 'Prescribed fees paid', NULL, 'MET_NOT_MET', 0, true, 3),
('hospital', 'ELIGIBILITY', 'E4', 'Health Insurance Plan purchased for facility staff', NULL, 'MET_NOT_MET', 0, true, 4)
ON CONFLICT (facility_type_code, item_code) DO NOTHING;

-- Section A: Facility Profile (Metadata fields)
INSERT INTO public.inspection_template_items (facility_type_code, section_code, item_code, label, description, input_type, max_points, is_required, display_order)
VALUES
('hospital', 'PROFILE', 'P1', 'Name of Physician-in-Charge', NULL, 'TEXT', 0, true, 1),
('hospital', 'PROFILE', 'P2', 'Name of Desk Officer', NULL, 'TEXT', 0, true, 2),
('hospital', 'PROFILE', 'P3', 'Desk Officer Phone No', NULL, 'TEXT', 0, true, 3),
('hospital', 'PROFILE', 'P4', 'Number of Hospital Beds', NULL, 'NUMBER', 0, true, 4),
('hospital', 'PROFILE', 'P5', 'NHIA Registration No.', NULL, 'TEXT', 0, false, 5),
('hospital', 'PROFILE', 'P6', 'Current SMOH Registration No.', NULL, 'TEXT', 0, false, 6)
ON CONFLICT (facility_type_code, item_code) DO NOTHING;

-- Section B: Personnel (Manual Scoring)
INSERT INTO public.inspection_template_items (facility_type_code, section_code, item_code, label, description, input_type, max_points, is_required, display_order, min_required)
VALUES
('hospital', 'PERSONNEL', 'B1', 'Medical Doctors with professional licences/reg. no', 'Facility must have at least 1', 'MANUAL_SCORE', 3, true, 1, 1),
('hospital', 'PERSONNEL', 'B2', 'Pharmacist with professional licence/reg. no', NULL, 'MANUAL_SCORE', 2, false, 2, 0),
('hospital', 'PERSONNEL', 'B3', 'Pharmacy Technician with professional licence/reg. no', 'At least 1', 'MANUAL_SCORE', 2, true, 3, 1),
('hospital', 'PERSONNEL', 'B4', 'Registered Nurse or Midwife with professional licence/reg. no, BNSC', 'At least 2', 'MANUAL_SCORE', 3, true, 4, 2),
('hospital', 'PERSONNEL', 'B5', 'Nurse/Midwife with professional licence/reg. no — RN, RM, or RN/RM', NULL, 'MANUAL_SCORE', 2, false, 5, 0),
('hospital', 'PERSONNEL', 'B6', 'Chew/CHO with professional licence', 'At least 2', 'MANUAL_SCORE', 2, true, 6, 2),
('hospital', 'PERSONNEL', 'B7', 'Med/Lab Scientist with professional licence/reg. no', NULL, 'MANUAL_SCORE', 3, false, 7, 0),
('hospital', 'PERSONNEL', 'B8', 'Med/Lab Technician with professional licence/reg. no', NULL, 'MANUAL_SCORE', 2, false, 8, 0),
('hospital', 'PERSONNEL', 'B9', 'Medical Records Officers with professional licence/reg. no', NULL, 'MANUAL_SCORE', 2, false, 9, 0),
('hospital', 'PERSONNEL', 'B10', 'Medical Records Technician with professional licence/reg. no', 'At least 1', 'MANUAL_SCORE', 2, true, 10, 1),
('hospital', 'PERSONNEL', 'B11', 'Hospital Attendant', 'At least 2', 'MANUAL_SCORE', 2, true, 11, 2)
ON CONFLICT (facility_type_code, item_code) DO NOTHING;

-- Section C: Infrastructure (Manual Score + Yes/No context)
INSERT INTO public.inspection_template_items (facility_type_code, section_code, item_code, label, description, input_type, max_points, is_required, display_order)
VALUES
('hospital', 'INFRASTRUCTURE', 'C12', 'Waiting/Reception area, at least 4x3 metres', NULL, 'MANUAL_SCORE', 2, true, 12),
('hospital', 'INFRASTRUCTURE', 'C13', 'Medical record keeping facilities', NULL, 'MANUAL_SCORE', 2, true, 13),
('hospital', 'INFRASTRUCTURE', 'C14', 'Consulting room, 4x3 metres', NULL, 'MANUAL_SCORE', 2, true, 14),
('hospital', 'INFRASTRUCTURE', 'C15', 'Treatment room with wash-hand basin and safety box for sharps', NULL, 'MANUAL_SCORE', 3, true, 15),
('hospital', 'INFRASTRUCTURE', 'C16', 'Pharmacy with drug cabinet', NULL, 'MANUAL_SCORE', 5, true, 16),
('hospital', 'INFRASTRUCTURE', 'C17', 'Medical Laboratory (USS machine, MP, Urinalysis, PCV, blood sugar & pregnancy test kits, spirit lamps, lab glassware, haematocrit centrifuge, etc.)', NULL, 'MANUAL_SCORE', 3, true, 17),
('hospital', 'INFRASTRUCTURE', 'C18', 'Surgical operating theatre (circumcision set, ear-piercing set, catheterization materials, I&D instruments, other surgical sets)', NULL, 'MANUAL_SCORE', 3, true, 18),
('hospital', 'INFRASTRUCTURE', 'C19', 'Possession of adequate ICT with internet access', NULL, 'MANUAL_SCORE', 3, true, 19),
('hospital', 'INFRASTRUCTURE', 'C20', 'Lying-in ward, minimum distance of 1m in-between beds', NULL, 'MANUAL_SCORE', 2, true, 20),
('hospital', 'INFRASTRUCTURE', 'C21', 'A locker and an over-bed table per bed', NULL, 'MANUAL_SCORE', 1, true, 21),
('hospital', 'INFRASTRUCTURE', 'C22', 'Colour-coded containers', NULL, 'MANUAL_SCORE', 2, true, 22),
('hospital', 'INFRASTRUCTURE', 'C23', 'Separate wards for male, female, and children', NULL, 'MANUAL_SCORE', 3, true, 23),
('hospital', 'INFRASTRUCTURE', 'C24', 'Delivery room with required gadgets, consumables, instruments, and emergency drugs', NULL, 'MANUAL_SCORE', 2, true, 24),
('hospital', 'INFRASTRUCTURE', 'C25', 'Wheelchair / patient''s examination couch', NULL, 'MANUAL_SCORE', 2, true, 25),
('hospital', 'INFRASTRUCTURE', 'C26', 'Sluice Room', NULL, 'MANUAL_SCORE', 3, true, 26),
('hospital', 'INFRASTRUCTURE', 'C27', 'Possession of appropriate equipment and staff for other specialization', NULL, 'MANUAL_SCORE', 3, true, 27),
('hospital', 'INFRASTRUCTURE', 'C28', 'Laundry Service', NULL, 'MANUAL_SCORE', 2, true, 28),
('hospital', 'INFRASTRUCTURE', 'C29', 'Stadiometer', NULL, 'MANUAL_SCORE', 2, true, 29),
('hospital', 'INFRASTRUCTURE', 'C30', 'Oxygen', NULL, 'MANUAL_SCORE', 4, true, 30),
('hospital', 'INFRASTRUCTURE', 'C31', 'Resuscitative equipment (ambu bag, suction machine, etc.)', NULL, 'MANUAL_SCORE', 4, true, 31),
('hospital', 'INFRASTRUCTURE', 'C32', 'Bed Pan / Urinal', NULL, 'MANUAL_SCORE', 2, true, 32),
('hospital', 'INFRASTRUCTURE', 'C33', 'At least 4 bed linens per bed', NULL, 'MANUAL_SCORE', 2, true, 33)
ON CONFLICT (facility_type_code, item_code) DO NOTHING;

-- Section D: Essential Services
INSERT INTO public.inspection_template_items (facility_type_code, section_code, item_code, label, description, input_type, max_points, is_required, display_order)
VALUES
('hospital', 'SERVICES', 'D34', 'Vital signs tray or trolley (sphygmomanometer, thermometer, stethoscope, etc.)', NULL, 'MANUAL_SCORE', 2, true, 34),
('hospital', 'SERVICES', 'D35', 'Sterilizer / Autoclave', NULL, 'MANUAL_SCORE', 2, true, 35),
('hospital', 'SERVICES', 'D36', 'Screens and weighing scale', NULL, 'MANUAL_SCORE', 2, true, 36),
('hospital', 'SERVICES', 'D37', 'Emergency tray or trolley (hydrocortisone, adrenaline, etc.)', NULL, 'MANUAL_SCORE', 2, true, 37),
('hospital', 'SERVICES', 'D38', 'Instrument tray for specific service', NULL, 'MANUAL_SCORE', 1, true, 38),
('hospital', 'SERVICES', 'D39', 'Adequate water source', NULL, 'MANUAL_SCORE', 2, true, 39),
('hospital', 'SERVICES', 'D40', 'Adequate and alternative power source', NULL, 'MANUAL_SCORE', 2, true, 40),
('hospital', 'SERVICES', 'D41', 'Firefighting equipment', NULL, 'MANUAL_SCORE', 2, true, 41),
('hospital', 'SERVICES', 'D42', 'Emergency parking space', NULL, 'MANUAL_SCORE', 1, true, 42),
('hospital', 'SERVICES', 'D43', 'Ambulance services', NULL, 'MANUAL_SCORE', 2, true, 43)
ON CONFLICT (facility_type_code, item_code) DO NOTHING;
