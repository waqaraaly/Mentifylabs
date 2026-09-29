-- Demo data. Apply with: npm run db:seed:local

INSERT INTO practitioners (id, slug, full_name, professional_title, email, phone, photo_url, short_bio, bio, specializations, services, experience_years, education, work_experience, certifications, languages, session_type, fee_currency, fee_min, fee_max, location, social_links, website_url, contact_methods, color_theme, status, profile_status, creation_method, date_joined, last_sign_in, approved_on, suspended_on, rejection_note, created_at) VALUES
  ('demo-practitioner', 'dr-ali', 'Ayesha Batool', 'Clinical Psychologist', 'ayesha.batool@example.com', '+92 300 1234567', '/practitioners/dr-ali.jpg', NULL, 'Ayesha Batool is a clinical psychologist with over eight years of experience helping clients manage anxiety, depression, and relationship challenges. She takes an evidence-based, client-centered approach, drawing on CBT and mindfulness techniques tailored to each person''s needs.', '["Anxiety","Depression","Relationship Counselling","Stress Management"]', '["Individual Therapy","Couples Counselling","Cognitive Behavioural Therapy (CBT)","Mindfulness-Based Therapy"]', 8, '["BSc (Hons) Psychology, University of the Punjab, 2010–2014","MSc Clinical Psychology, University of the Punjab, 2014–2016","M.Phil Clinical Psychology, University of the Punjab, 2016–2018","Clinical Internship, Fountain House Lahore, 2018"]', '["Clinical Psychologist, Mind & Wellness Clinic, 2022–Present","Staff Psychologist, Fountain House Lahore, 2019–2022","Associate Psychologist, Punjab Institute of Mental Health, 2018–2019"]', '["Certified CBT Practitioner","Registered Clinical Psychologist"]', '["English","Urdu"]', 'both', 'PKR', 3000, 5000, 'Mind & Wellness Clinic, Gulberg III, Lahore', '[{"platform":"instagram","url":"https://instagram.com/dr.ayeshabatool"},{"platform":"facebook","url":"https://facebook.com/dr.ayeshabatool"},{"platform":"linkedin","url":"https://linkedin.com/in/ayeshabatool"}]', 'https://ayeshabatool.com', '[{"label":"Email","value":"ayesha.batool@example.com","isPublic":true},{"label":"Phone","value":"+92 300 1234567","isPublic":true}]', 'sage', 'active', 'published', 'self', '2026-08-01', '2026-09-15T12:40:00.000Z', '2026-08-02', NULL, NULL, '2026-01-01T00:00:00.000Z'),
  (lower(hex(randomblob(16))), 'hina-farooq', 'Hina Farooq', 'Marriage & Family Therapist', 'hina.farooq@example.com', '+92 300 7654321', NULL, NULL, 'Hina Farooq specializes in couples and family therapy, helping partners and families rebuild communication and trust. She integrates systemic therapy with culturally-informed care for families across Pakistan.', '["Couples Therapy","Family Conflict","Premarital Counselling"]', '["Couples Therapy","Family Therapy","Premarital Counselling"]', 5, '["MS Family Therapy, Kinnaird College"]', NULL, '["Certified Family Therapist"]', '["English","Urdu","Punjabi"]', 'online', 'PKR', 2500, 4000, 'Islamabad, Pakistan', '[{"platform":"instagram","url":"https://instagram.com/hina.farooq.therapy"}]', NULL, '[{"label":"Email","value":"hina.farooq@example.com","isPublic":true},{"label":"Phone","value":"+92 300 7654321","isPublic":true}]', NULL, 'pending', 'in_review', 'self', '2026-09-14', NULL, NULL, NULL, NULL, '2026-01-01T00:00:01.000Z'),
  (lower(hex(randomblob(16))), 'omar-siddiqui', 'Omar Siddiqui', 'Psychiatrist', 'omar.siddiqui@example.com', '+92 300 1122334', NULL, NULL, 'Omar Siddiqui is a psychiatrist focused on mood disorders and medication management, working alongside therapists to provide integrated care.', '["Mood Disorders","Medication Management","Bipolar Disorder"]', '["Psychiatric Assessment","Medication Management","Follow-up Consultations"]', 12, '["MBBS, Dow Medical College","FCPS Psychiatry"]', NULL, '["Board Certified Psychiatrist"]', '["English","Urdu"]', 'offline', 'PKR', 5000, 8000, 'Karachi, Pakistan', '[]', NULL, '[{"label":"Email","value":"omar.siddiqui@example.com","isPublic":true},{"label":"Phone","value":"+92 300 1122334","isPublic":true}]', NULL, 'suspended', 'hidden', 'self', '2026-06-10', '2026-08-20T04:00:00.000Z', '2026-06-12', '2026-08-22', NULL, '2026-01-01T00:00:02.000Z'),
  (lower(hex(randomblob(16))), 'sara-malik', 'Sara Malik', 'Counselling Psychologist', 'sara.malik@example.com', '+92 300 9988776', NULL, NULL, 'Sara Malik works with young adults navigating academic stress, self-esteem, and identity concerns, using a warm, strengths-based approach.', '["Academic Stress","Self-Esteem","Young Adults"]', '["Individual Counselling","Student Counselling"]', 3, '["MSc Counselling Psychology, LUMS"]', NULL, '[]', '["English","Urdu"]', 'online', 'PKR', 2000, 3000, 'Lahore, Pakistan', '[]', NULL, '[{"label":"Email","value":"sara.malik@example.com","isPublic":true},{"label":"Phone","value":"+92 300 9988776","isPublic":true}]', NULL, 'active', 'published', 'super_admin', '2026-09-05', '2026-09-10T07:00:00.000Z', '2026-09-06', NULL, NULL, '2026-01-01T00:00:03.000Z'),
  (lower(hex(randomblob(16))), 'bilal-anwar', 'Bilal Anwar', 'Counsellor', 'bilal.anwar@example.com', '+92 300 5551212', NULL, NULL, '', '["Career Counselling"]', '[]', 2, '["PG Diploma in Counselling, AIOU"]', NULL, '[]', '["English","Urdu"]', 'online', 'PKR', 0, 0, 'Faisalabad, Pakistan', '[]', NULL, '[{"label":"Email","value":"bilal.anwar@example.com","isPublic":true},{"label":"Phone","value":"+92 300 5551212","isPublic":true}]', NULL, 'pending', 'incomplete', 'self', '2026-09-16', NULL, NULL, NULL, NULL, '2026-01-01T00:00:04.000Z');

INSERT INTO slots (id, practitioner_slug, date, start_time, end_time, session_type, status) VALUES
  ('slot-6', 'dr-ali', '2026-09-15', '17:00', '17:50', 'online', 'booked'),
  ('slot-1', 'dr-ali', '2026-09-18', '10:00', '10:50', 'online', 'open'),
  ('slot-2', 'dr-ali', '2026-09-18', '14:00', '14:50', 'offline', 'open'),
  ('slot-3', 'dr-ali', '2026-09-19', '11:00', '11:50', 'online', 'open'),
  ('slot-4', 'dr-ali', '2026-09-20', '15:00', '15:50', 'online', 'booked'),
  ('slot-5', 'dr-ali', '2026-09-21', '09:00', '09:50', 'offline', 'booked'),
  ('slot-7', 'dr-ali', '2026-09-24', '09:00', '09:50', 'both', 'open'),
  ('slot-8', 'dr-ali', '2026-09-24', '10:00', '10:50', 'offline', 'open'),
  ('slot-9', 'dr-ali', '2026-09-24', '11:30', '12:20', 'online', 'booked'),
  ('slot-10', 'dr-ali', '2026-09-24', '14:00', '14:50', 'online', 'open'),
  ('slot-17', 'dr-ali', '2026-09-24', '16:00', '16:50', 'offline', 'open'),
  ('slot-18', 'dr-ali', '2026-09-24', '17:30', '18:20', 'both', 'open'),
  ('slot-30', 'dr-ali', '2026-09-24', '21:00', '21:50', 'offline', 'booked'),
  ('slot-12', 'dr-ali', '2026-09-25', '09:00', '09:50', 'offline', 'open'),
  ('slot-13', 'dr-ali', '2026-09-25', '11:00', '11:50', 'online', 'open'),
  ('slot-14', 'dr-ali', '2026-09-25', '13:00', '13:50', 'offline', 'booked'),
  ('slot-15', 'dr-ali', '2026-09-25', '15:00', '15:50', 'online', 'open'),
  ('slot-16', 'dr-ali', '2026-09-25', '17:00', '17:50', 'online', 'open'),
  ('slot-31', 'dr-ali', '2026-09-25', '22:00', '22:50', 'online', 'booked'),
  ('slot-19', 'dr-ali', '2026-09-26', '09:30', '10:20', 'online', 'open'),
  ('slot-20', 'dr-ali', '2026-09-26', '10:30', '11:20', 'both', 'open'),
  ('slot-21', 'dr-ali', '2026-09-26', '12:00', '12:50', 'offline', 'booked'),
  ('slot-22', 'dr-ali', '2026-09-26', '14:30', '15:20', 'online', 'open'),
  ('slot-23', 'dr-ali', '2026-09-26', '16:00', '16:50', 'online', 'booked'),
  ('slot-24', 'dr-ali', '2026-09-26', '17:00', '17:50', 'offline', 'open'),
  ('slot-33', 'dr-ali', '2026-09-26', '21:00', '21:50', 'both', 'open'),
  ('slot-34', 'dr-ali', '2026-09-26', '22:00', '22:50', 'online', 'open'),
  ('slot-32', 'dr-ali', '2026-09-27', '00:00', '00:50', 'online', 'booked'),
  ('slot-25', 'dr-ali', '2026-10-05', '10:00', '10:50', 'online', 'open'),
  ('slot-26', 'dr-ali', '2026-10-05', '11:00', '11:50', 'both', 'open'),
  ('slot-27', 'dr-ali', '2026-10-05', '15:00', '15:50', 'offline', 'open'),
  ('slot-28', 'dr-ali', '2026-10-09', '09:00', '09:50', 'online', 'open'),
  ('slot-29', 'dr-ali', '2026-10-09', '10:00', '10:50', 'online', 'open');

INSERT INTO weekly_rules (id, practitioner_slug, weekday, start_time, end_time, session_type) VALUES
  ('rule-1', 'dr-ali', 1, '09:00', '09:50', 'online'),
  ('rule-2', 'dr-ali', 1, '10:00', '10:50', 'offline'),
  ('rule-3', 'dr-ali', 1, '14:00', '14:50', 'both'),
  ('rule-4', 'dr-ali', 2, '09:00', '09:50', 'online'),
  ('rule-5', 'dr-ali', 2, '10:00', '10:50', 'offline'),
  ('rule-6', 'dr-ali', 2, '14:00', '14:50', 'both'),
  ('rule-7', 'dr-ali', 3, '09:00', '09:50', 'online'),
  ('rule-8', 'dr-ali', 3, '10:00', '10:50', 'offline'),
  ('rule-9', 'dr-ali', 3, '14:00', '14:50', 'both'),
  ('rule-16', 'dr-ali', 3, '16:00', '16:50', 'online'),
  ('rule-10', 'dr-ali', 4, '09:00', '09:50', 'online'),
  ('rule-11', 'dr-ali', 4, '10:00', '10:50', 'offline'),
  ('rule-12', 'dr-ali', 4, '14:00', '14:50', 'both'),
  ('rule-13', 'dr-ali', 5, '09:00', '09:50', 'online'),
  ('rule-14', 'dr-ali', 5, '10:00', '10:50', 'offline'),
  ('rule-15', 'dr-ali', 5, '14:00', '14:50', 'both'),
  ('rule-17', 'dr-ali', 6, '10:00', '10:50', 'offline');

-- time_off: no rows

INSERT INTO day_overrides (id, practitioner_slug, date, type) VALUES
  ('override-1', 'dr-ali', '2026-09-24', 'custom'),
  ('override-2', 'dr-ali', '2026-09-25', 'custom'),
  ('override-3', 'dr-ali', '2026-09-26', 'custom'),
  ('override-4', 'dr-ali', '2026-09-29', 'unavailable'),
  ('override-5', 'dr-ali', '2026-10-02', 'unavailable'),
  ('override-6', 'dr-ali', '2026-10-05', 'custom'),
  ('override-7', 'dr-ali', '2026-10-09', 'custom');

INSERT INTO appointments (id, client_id, practitioner_slug, slot_id, client_name, client_contact, concern, date, start_time, end_time, session_type, status, created_at) VALUES
  ('appt-mock-late-midnight', 'CL-1112', 'dr-ali', 'slot-32', 'Maryam Zafar', '0300 9900112', 'Overnight shift worker; midnight is the only time I am free.', '2026-09-27', '00:00', '00:50', 'online', 'confirmed', '2026-09-23T08:45:00.000Z'),
  ('appt-mock-late-10pm', 'CL-1111', 'dr-ali', 'slot-31', 'Imran Shah', '0300 7788990', 'Trouble winding down at night; prefer a late session.', '2026-09-25', '22:00', '22:50', 'online', 'completed', '2026-09-22T15:30:00.000Z'),
  ('appt-mock-26b', 'CL-1104', 'dr-ali', 'slot-23', 'Ahsan Iqbal', '0300 1122334', 'Managing exam-related anxiety.', '2026-09-26', '16:00', '16:50', 'online', 'confirmed', '2026-09-22T09:05:00.000Z'),
  ('appt-mock-26a', 'CL-1103', 'dr-ali', 'slot-21', 'Zainab Malik', '0300 6677889', 'Ongoing support after a recent loss.', '2026-09-26', '12:00', '12:50', 'offline', 'confirmed', '2026-09-22T04:20:00.000Z'),
  ('appt-mock-late-9pm', 'CL-1110', 'dr-ali', 'slot-30', 'Sana Tariq', '0300 5566778', 'Evening slot works best around my shifts.', '2026-09-24', '21:00', '21:50', 'offline', 'completed', '2026-09-21T13:10:00.000Z'),
  ('appt-mock-25', 'CL-1102', 'dr-ali', 'slot-14', 'Omar Farooq', '0300 2233445', 'First consultation about work-life balance.', '2026-09-25', '13:00', '13:50', 'offline', 'confirmed', '2026-09-21T10:30:00.000Z'),
  ('appt-14', 'CL-1014', 'dr-ali', NULL, 'Sana Riaz', '0300 9012345', 'Caring for an aging parent full-time and feeling burnt out.', '2026-10-03', '15:00', '15:50', 'online', 'pending', '2026-09-20T13:40:00.000Z'),
  ('appt-9', 'CL-1009', 'dr-ali', NULL, 'Usman Tariq', '0300 8890011', 'First time considering therapy, dealing with anxiety around an upcoming job change.', '2026-09-28', '10:00', '10:50', 'online', 'pending', '2026-09-20T07:15:00.000Z'),
  ('appt-mock-24', 'CL-1101', 'dr-ali', 'slot-9', 'Hina Raza', '0300 8899001', 'Follow-up on sleep and anxiety.', '2026-09-24', '11:30', '12:20', 'online', 'confirmed', '2026-09-20T05:00:00.000Z'),
  ('appt-10', 'CL-1010', 'dr-ali', NULL, 'Ayesha Kamal', '0300 2213344', 'Going through a difficult breakup, would like to talk through some of the grief.', '2026-09-29', '11:00', '11:50', 'online', 'pending', '2026-09-20T04:05:00.000Z'),
  ('appt-8', 'CL-1008', 'dr-ali', NULL, 'Zara Malik', '0300 3345678', 'Struggling with sleep and racing thoughts before bed, would like some coping strategies.', '2026-09-26', '13:00', '13:50', 'offline', 'pending', '2026-09-19T11:45:00.000Z'),
  ('appt-16', 'CL-1016', 'dr-ali', NULL, 'Mahnoor Aslam', '0300 4498765', 'New mother experiencing what might be postpartum anxiety, would like to talk to someone.', '2026-10-06', '10:00', '10:50', 'online', 'pending', '2026-09-19T03:15:00.000Z'),
  ('appt-11', 'CL-1011', 'dr-ali', NULL, 'Hamza Siddiqui', '0300 7789012', 'Panic attacks have gotten more frequent over the last month, not sure what''s triggering them.', '2026-09-30', '16:00', '16:50', 'offline', 'pending', '2026-09-18T09:30:00.000Z'),
  ('appt-12', 'CL-1012', 'dr-ali', NULL, 'Nida Farooqi', '0300 5567890', 'Constant comparison with peers on social media is affecting my self-esteem.', '2026-10-01', '14:00', '14:50', 'online', 'pending', '2026-09-17T05:20:00.000Z'),
  ('appt-13', 'CL-1013', 'dr-ali', NULL, 'Bilal Ahmed', '0300 3321987', 'Recently diagnosed with ADHD as an adult, looking for help adjusting.', '2026-10-02', '09:00', '09:50', 'offline', 'pending', '2026-09-16T12:50:00.000Z'),
  ('appt-15', 'CL-1015', 'dr-ali', NULL, 'Faisal Mehmood', '0300 6654321', 'Struggling to set boundaries at work, ending up overcommitted every week.', '2026-10-05', '12:00', '12:50', 'offline', 'pending', '2026-09-15T08:10:00.000Z'),
  ('appt-1', 'CL-1001', 'dr-ali', 'slot-4', 'Sara Ahmed', '0300 1234567', 'Feeling overwhelmed with work stress lately, hoping to talk it through.', '2026-09-20', '15:00', '15:50', 'online', 'pending', '2026-09-15T04:10:00.000Z'),
  ('appt-17', 'CL-1017', 'dr-ali', NULL, 'Danish Iqbal', '0300 1187654', 'Struggling with motivation and focus since switching to remote work.', '2026-10-07', '17:00', '17:50', 'offline', 'pending', '2026-09-14T06:25:00.000Z'),
  ('appt-3', 'CL-1003', 'dr-ali', 'slot-6', 'Mariam Sheikh', '0300 5551234', NULL, '2026-09-15', '17:00', '17:50', 'online', 'confirmed', '2026-09-14T03:00:00.000Z'),
  ('appt-18', 'CL-1018', 'dr-ali', NULL, 'Rabia Yousaf', '0300 8823456', 'Persistent worry about health that doesn''t seem to match what doctors are telling me.', '2026-10-08', '13:00', '13:50', 'online', 'pending', '2026-09-13T10:55:00.000Z'),
  ('appt-2', 'CL-1002', 'dr-ali', 'slot-5', 'Bilal Khan', '0300 7654321', NULL, '2026-09-21', '09:00', '09:50', 'offline', 'confirmed', '2026-09-13T06:30:00.000Z'),
  ('appt-19', 'CL-1019', 'dr-ali', NULL, 'Adeel Chaudhry', '0300 2298765', 'Considering a big career change and feeling stuck weighing the decision.', '2026-10-09', '11:00', '11:50', 'offline', 'pending', '2026-09-12T04:40:00.000Z'),
  ('appt-5', 'CL-1005', 'dr-ali', NULL, 'Omar Farooq', '0300 1122334', NULL, '2026-09-12', '16:00', '16:50', 'offline', 'cancelled', '2026-09-08T09:20:00.000Z'),
  ('appt-4', 'CL-1004', 'dr-ali', NULL, 'Hina Rizvi', '0300 9988776', NULL, '2026-09-10', '11:00', '11:50', 'online', 'completed', '2026-09-05T05:00:00.000Z'),
  ('appt-overdue-demo', 'CL-1000', 'dr-ali', NULL, 'Junaid Aslam (overdue demo)', '0300 4455667', NULL, '2026-09-08', '12:00', '12:50', 'online', 'confirmed', '2026-09-01T05:00:00.000Z'),
  ('appt-7', 'CL-1007', 'omar-siddiqui', NULL, 'Ahmed Raza', '0300 6677889', NULL, '2026-08-12', '14:00', '14:50', 'offline', 'cancelled', '2026-08-09T08:00:00.000Z'),
  ('appt-6', 'CL-1006', 'omar-siddiqui', NULL, 'Fatima Noor', '0300 4432211', NULL, '2026-08-05', '10:00', '10:50', 'offline', 'completed', '2026-08-01T04:00:00.000Z');

INSERT INTO practitioner_documents (id, practitioner_slug, name, category, uploaded_at) VALUES
  ('doc-1', 'dr-ali', 'Clinical Psychology License.pdf', 'License', '2026-08-01T05:00:00.000Z'),
  ('doc-2', 'dr-ali', 'CBT Certification.pdf', 'Certification', '2026-08-01T05:05:00.000Z'),
  ('doc-3', 'hina-farooq', 'CNIC.jpg', 'Identity Verification', '2026-09-14T03:20:00.000Z'),
  ('doc-4', 'hina-farooq', 'Family Therapy Certificate.pdf', 'Certification', '2026-09-14T03:22:00.000Z'),
  ('doc-5', 'omar-siddiqui', 'Psychiatry Board Certification.pdf', 'License', '2026-06-10T04:00:00.000Z');

INSERT INTO features (id, name, description, icon, category, status, shared_by_default, quantity, unit, plan, sort_order) VALUES
  ('video-sessions', 'Video Sessions', '1-to-1 encrypted video calls with screen share and waiting room.', 'Video', 'Sessions', 'live', 1, 100, 'sessions / mo', 'All plans', 0),
  ('group-therapy', 'Group Therapy Booking', 'Allow clients to book group therapy sessions.', 'Users', 'Scheduling', 'beta', 0, 20, 'sessions / mo', 'Growth+', 1),
  ('messaging', 'Client Messaging', 'Secure in-app encrypted chat between practitioner and client.', 'Mail', 'Engagement', 'live', 1, 500, 'threads', 'Growth+', 2),
  ('ai-notes', 'AI Session Notes', 'Automatically summarize session notes with AI assistance.', 'FileText', 'Records', 'beta', 0, 0, 'unlimited', 'Growth+', 3),
  ('custom-branding', 'Custom Branding', 'Let practitioners customize their public profile theme.', 'Palette', 'Presence', 'disabled', 0, NULL, NULL, 'Enterprise', 4),
  ('waitlist', 'Waitlist Management', 'Automatically notify clients when a slot opens up.', 'Bell', 'Engagement', 'live', 1, 200, 'messages / mo', 'All plans', 5);

INSERT INTO feature_access (feature_id, practitioner_slug) VALUES
  ('messaging', 'dr-ali'),
  ('messaging', 'sara-malik');

INSERT INTO feature_access_logs (id, feature_id, practitioner_slug, action, by, at, note) VALUES
  ('fl_4', 'messaging', 'sara-malik', 'granted', 'Super Admin', '2026-09-12T06:00:00.000Z', NULL),
  ('fl_3', 'messaging', 'dr-ali', 'granted', 'Super Admin', '2026-09-10T09:00:00.000Z', NULL),
  ('fl_2', 'waitlist', NULL, 'enabled_all', 'Super Admin', '2026-09-01T04:00:00.000Z', NULL),
  ('fl_1', 'video-sessions', NULL, 'enabled_all', 'Super Admin', '2026-09-01T04:00:00.000Z', NULL);

INSERT INTO admin_settings (id, name, email, skip_verification_by_default, notify_new_signup, notify_profile_submitted, notify_daily_digest) VALUES
  (1, 'Super Admin', 'admin@mentifylabs.com', 1, 1, 1, 0);
