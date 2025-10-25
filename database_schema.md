| table_name               | column_name             | data_type                   | character_maximum_length | is_nullable | column_default                                                     |
| ------------------------ | ----------------------- | --------------------------- | ------------------------ | ----------- | ------------------------------------------------------------------ |
| admin_users              | id                      | uuid                        | null                     | NO          | null                                                               |
| admin_users              | created_at              | timestamp with time zone    | null                     | YES         | now()                                                              |
| admin_users              | updated_at              | timestamp with time zone    | null                     | YES         | now()                                                              |
| availability_slots       | id                      | bigint                      | null                     | NO          | nextval('availability_slots_id_seq'::regclass)                     |
| availability_slots       | date                    | date                        | null                     | NO          | null                                                               |
| availability_slots       | start_time              | time without time zone      | null                     | NO          | null                                                               |
| availability_slots       | end_time                | time without time zone      | null                     | NO          | null                                                               |
| availability_slots       | service_type            | text                        | null                     | NO          | 'both'::text                                                       |
| availability_slots       | notes                   | text                        | null                     | YES         | null                                                               |
| availability_slots       | created_at              | timestamp with time zone    | null                     | YES         | now()                                                              |
| availability_slots       | updated_at              | timestamp with time zone    | null                     | YES         | now()                                                              |
| blog_comments            | id                      | bigint                      | null                     | NO          | nextval('blog_comments_id_seq'::regclass)                          |
| blog_comments            | post_id                 | bigint                      | null                     | YES         | null                                                               |
| blog_comments            | author_name             | text                        | null                     | NO          | null                                                               |
| blog_comments            | author_email            | text                        | null                     | NO          | null                                                               |
| blog_comments            | content                 | text                        | null                     | NO          | null                                                               |
| blog_comments            | approved                | boolean                     | null                     | YES         | false                                                              |
| blog_comments            | created_at              | timestamp with time zone    | null                     | YES         | now()                                                              |
| blog_comments            | user_id                 | uuid                        | null                     | YES         | null                                                               |
| blog_posts               | id                      | bigint                      | null                     | NO          | nextval('blog_posts_id_seq'::regclass)                             |
| blog_posts               | title                   | text                        | null                     | NO          | null                                                               |
| blog_posts               | content                 | text                        | null                     | NO          | null                                                               |
| blog_posts               | excerpt                 | text                        | null                     | YES         | null                                                               |
| blog_posts               | category                | text                        | null                     | YES         | 'Spiritual Guidance'::text                                         |
| blog_posts               | published               | boolean                     | null                     | YES         | false                                                              |
| blog_posts               | created_at              | timestamp with time zone    | null                     | YES         | now()                                                              |
| blog_posts               | updated_at              | timestamp with time zone    | null                     | YES         | now()                                                              |
| blog_posts               | author                  | text                        | null                     | YES         | 'Elizabeth Carol'::text                                            |
| blog_posts               | image_url               | text                        | null                     | YES         | null                                                               |
| bookings                 | id                      | bigint                      | null                     | NO          | nextval('bookings_id_seq'::regclass)                               |
| bookings                 | availability_slot_id    | bigint                      | null                     | NO          | null                                                               |
| bookings                 | client_name             | text                        | null                     | YES         | null                                                               |
| bookings                 | client_email            | text                        | null                     | YES         | null                                                               |
| bookings                 | client_phone            | text                        | null                     | YES         | null                                                               |
| bookings                 | booking_type            | text                        | null                     | YES         | 'manual'::text                                                     |
| bookings                 | status                  | text                        | null                     | YES         | 'pending'::text                                                    |
| bookings                 | notes                   | text                        | null                     | YES         | null                                                               |
| bookings                 | created_at              | timestamp with time zone    | null                     | YES         | now()                                                              |
| bookings                 | updated_at              | timestamp with time zone    | null                     | YES         | now()                                                              |
| bookings                 | reading_type            | character varying           | 20                       | YES         | null                                                               |
| bookings                 | user_notes              | text                        | null                     | YES         | null                                                               |
| bookings                 | user_id                 | uuid                        | null                     | YES         | null                                                               |
| bookings                 | payment_status          | character varying           | 32                       | YES         | null                                                               |
| email_notifications      | id                      | bigint                      | null                     | NO          | nextval('email_notifications_id_seq'::regclass)                    |
| email_notifications      | booking_id              | bigint                      | null                     | YES         | null                                                               |
| email_notifications      | recipient_email         | text                        | null                     | NO          | null                                                               |
| email_notifications      | email_type              | text                        | null                     | NO          | null                                                               |
| email_notifications      | subject                 | text                        | null                     | NO          | null                                                               |
| email_notifications      | sent_at                 | timestamp with time zone    | null                     | YES         | CURRENT_TIMESTAMP                                                  |
| email_notifications      | status                  | text                        | null                     | NO          | 'sent'::text                                                       |
| payments                 | id                      | bigint                      | null                     | NO          | nextval('payments_id_seq'::regclass)                               |
| payments                 | booking_id              | bigint                      | null                     | YES         | null                                                               |
| payments                 | payment_method          | text                        | null                     | NO          | 'paypal'::text                                                     |
| payments                 | payment_intent_id       | text                        | null                     | NO          | null                                                               |
| payments                 | amount                  | numeric                     | null                     | NO          | null                                                               |
| payments                 | currency                | text                        | null                     | YES         | 'GBP'::text                                                        |
| payments                 | status                  | text                        | null                     | NO          | null                                                               |
| payments                 | paypal_order_id         | text                        | null                     | YES         | null                                                               |
| payments                 | paypal_payer_id         | text                        | null                     | YES         | null                                                               |
| payments                 | transaction_fee         | numeric                     | null                     | YES         | null                                                               |
| payments                 | created_at              | timestamp with time zone    | null                     | YES         | CURRENT_TIMESTAMP                                                  |
| payments                 | updated_at              | timestamp with time zone    | null                     | YES         | CURRENT_TIMESTAMP                                                  |
| perim_customers          | id                      | bigint                      | null                     | NO          | null                                                               |
| perim_customers          | name                    | text                        | null                     | NO          | null                                                               |
| perim_customers          | address                 | text                        | null                     | NO          | null                                                               |
| perim_customers          | postcode                | text                        | null                     | NO          | null                                                               |
| perim_customers          | system_type             | text                        | null                     | NO          | null                                                               |
| perim_customers          | date_installed          | date                        | null                     | NO          | null                                                               |
| perim_customers          | inspections_per_year    | integer                     | null                     | NO          | 1                                                                  |
| perim_customers          | first_inspection_month  | integer                     | null                     | NO          | null                                                               |
| perim_customers          | second_inspection_month | integer                     | null                     | YES         | null                                                               |
| perim_customers          | notes                   | text                        | null                     | YES         | null                                                               |
| perim_customers          | inspection_history      | jsonb                       | null                     | YES         | '{"inspection1": [], "inspection2": []}'::jsonb                    |
| perim_customers          | created_at              | timestamp with time zone    | null                     | YES         | now()                                                              |
| perim_customers          | updated_at              | timestamp with time zone    | null                     | YES         | now()                                                              |
| perim_customers          | battery_replacement     | jsonb                       | null                     | YES         | '{"siren": null, "detectors": null, "control_panel": null}'::jsonb |
| perim_customers          | nsi_status              | text                        | null                     | YES         | 'NSI'::text                                                        |
| perim_customers          | cloud_id                | text                        | null                     | YES         | null                                                               |
| perim_customers          | cloud_renewal_date      | date                        | null                     | YES         | null                                                               |
| perim_customers          | arc_no                  | text                        | null                     | YES         | null                                                               |
| perim_customers          | arc_renewal_date        | date                        | null                     | YES         | null                                                               |
| perim_inspection_stats   | id                      | bigint                      | null                     | YES         | null                                                               |
| perim_inspection_stats   | name                    | text                        | null                     | YES         | null                                                               |
| perim_inspection_stats   | system_type             | text                        | null                     | YES         | null                                                               |
| perim_inspection_stats   | inspections_per_year    | integer                     | null                     | YES         | null                                                               |
| perim_inspection_stats   | first_inspection_month  | integer                     | null                     | YES         | null                                                               |
| perim_inspection_stats   | second_inspection_month | integer                     | null                     | YES         | null                                                               |
| perim_inspection_stats   | inspection1_history     | text                        | null                     | YES         | null                                                               |
| perim_inspection_stats   | inspection2_history     | text                        | null                     | YES         | null                                                               |
| perim_inspection_stats   | inspection1_count       | integer                     | null                     | YES         | null                                                               |
| perim_inspection_stats   | inspection2_count       | integer                     | null                     | YES         | null                                                               |
| perim_inspection_stats   | created_at              | timestamp with time zone    | null                     | YES         | null                                                               |
| perim_inspection_stats   | updated_at              | timestamp with time zone    | null                     | YES         | null                                                               |
| perim_nsi_complaints     | id                      | integer                     | null                     | NO          | nextval('perim_nsi_complaints_id_seq'::regclass)                   |
| perim_nsi_complaints     | date                    | date                        | null                     | NO          | null                                                               |
| perim_nsi_complaints     | reference               | character varying           | 50                       | NO          | null                                                               |
| perim_nsi_complaints     | customer                | character varying           | 255                      | NO          | null                                                               |
| perim_nsi_complaints     | type                    | character varying           | 100                      | NO          | null                                                               |
| perim_nsi_complaints     | description             | text                        | null                     | NO          | null                                                               |
| perim_nsi_complaints     | status                  | character varying           | 50                       | NO          | 'open'::character varying                                          |
| perim_nsi_complaints     | assigned_to             | character varying           | 255                      | YES         | null                                                               |
| perim_nsi_complaints     | notes                   | text                        | null                     | YES         | null                                                               |
| perim_nsi_complaints     | created_at              | timestamp with time zone    | null                     | YES         | now()                                                              |
| perim_nsi_complaints     | updated_at              | timestamp with time zone    | null                     | YES         | now()                                                              |
| perim_nsi_complaints     | images                  | text                        | null                     | YES         | null                                                               |
| perim_nsi_first_aid      | id                      | integer                     | null                     | NO          | nextval('perim_nsi_first_aid_id_seq'::regclass)                    |
| perim_nsi_first_aid      | kit_id                  | character varying           | 100                      | NO          | null                                                               |
| perim_nsi_first_aid      | kit_type                | character varying           | 100                      | NO          | null                                                               |
| perim_nsi_first_aid      | issued_to               | character varying           | 255                      | NO          | null                                                               |
| perim_nsi_first_aid      | issued_by               | character varying           | 255                      | NO          | null                                                               |
| perim_nsi_first_aid      | issue_date              | date                        | null                     | NO          | null                                                               |
| perim_nsi_first_aid      | expiry_date             | date                        | null                     | NO          | null                                                               |
| perim_nsi_first_aid      | location                | character varying           | 255                      | NO          | null                                                               |
| perim_nsi_first_aid      | notes                   | text                        | null                     | YES         | null                                                               |
| perim_nsi_first_aid      | created_at              | timestamp with time zone    | null                     | YES         | now()                                                              |
| perim_nsi_first_aid      | updated_at              | timestamp with time zone    | null                     | YES         | now()                                                              |
| perim_nsi_first_aid      | images                  | text                        | null                     | YES         | null                                                               |
| perim_nsi_id_badges      | id                      | integer                     | null                     | NO          | nextval('perim_nsi_id_badges_id_seq'::regclass)                    |
| perim_nsi_id_badges      | badge_number            | character varying           | 100                      | NO          | null                                                               |
| perim_nsi_id_badges      | badge_type              | character varying           | 50                       | NO          | null                                                               |
| perim_nsi_id_badges      | issued_to               | character varying           | 255                      | NO          | null                                                               |
| perim_nsi_id_badges      | issued_by               | character varying           | 255                      | NO          | null                                                               |
| perim_nsi_id_badges      | valid_from              | date                        | null                     | NO          | null                                                               |
| perim_nsi_id_badges      | valid_to                | date                        | null                     | NO          | null                                                               |
| perim_nsi_id_badges      | notes                   | text                        | null                     | YES         | null                                                               |
| perim_nsi_id_badges      | created_at              | timestamp with time zone    | null                     | YES         | now()                                                              |
| perim_nsi_id_badges      | updated_at              | timestamp with time zone    | null                     | YES         | now()                                                              |
| perim_nsi_id_badges      | images                  | text                        | null                     | YES         | null                                                               |
| perim_nsi_test_equipment | id                      | integer                     | null                     | NO          | nextval('perim_nsi_test_equipment_id_seq'::regclass)               |
| perim_nsi_test_equipment | equipment_id            | character varying           | 100                      | NO          | null                                                               |
| perim_nsi_test_equipment | equipment_type          | character varying           | 100                      | NO          | null                                                               |
| perim_nsi_test_equipment | manufacturer            | character varying           | 255                      | NO          | null                                                               |
| perim_nsi_test_equipment | model                   | character varying           | 255                      | NO          | null                                                               |
| perim_nsi_test_equipment | purchase_date           | date                        | null                     | NO          | null                                                               |
| perim_nsi_test_equipment | serial_number           | character varying           | 255                      | YES         | null                                                               |
| perim_nsi_test_equipment | last_calibration        | date                        | null                     | YES         | null                                                               |
| perim_nsi_test_equipment | next_calibration        | date                        | null                     | NO          | null                                                               |
| perim_nsi_test_equipment | notes                   | text                        | null                     | YES         | null                                                               |
| perim_nsi_test_equipment | created_at              | timestamp with time zone    | null                     | YES         | now()                                                              |
| perim_nsi_test_equipment | updated_at              | timestamp with time zone    | null                     | YES         | now()                                                              |
| perim_nsi_test_equipment | images                  | text                        | null                     | YES         | null                                                               |
| perim_scaff_systems      | id                      | bigint                      | null                     | NO          | null                                                               |
| perim_scaff_systems      | p_number                | text                        | null                     | NO          | null                                                               |
| perim_scaff_systems      | extra_sensors           | integer                     | null                     | YES         | 0                                                                  |
| perim_scaff_systems      | site_contact            | text                        | null                     | NO          | null                                                               |
| perim_scaff_systems      | site_phone              | text                        | null                     | YES         | null                                                               |
| perim_scaff_systems      | app_contact             | text                        | null                     | NO          | null                                                               |
| perim_scaff_systems      | app_phone               | text                        | null                     | YES         | null                                                               |
| perim_scaff_systems      | arc_enabled             | boolean                     | null                     | YES         | false                                                              |
| perim_scaff_systems      | arc_contact             | text                        | null                     | YES         | null                                                               |
| perim_scaff_systems      | arc_phone               | text                        | null                     | YES         | null                                                               |
| perim_scaff_systems      | start_date              | date                        | null                     | NO          | null                                                               |
| perim_scaff_systems      | last_invoice_date       | date                        | null                     | NO          | null                                                               |
| perim_scaff_systems      | created_at              | timestamp with time zone    | null                     | YES         | now()                                                              |
| perim_scaff_systems      | updated_at              | timestamp with time zone    | null                     | YES         | now()                                                              |
| perim_scaff_systems      | hire_status             | text                        | null                     | YES         | 'on-hire'::text                                                    |
| perim_scaff_systems      | address1                | text                        | null                     | YES         | ''::text                                                           |
| perim_scaff_systems      | address2                | text                        | null                     | YES         | ''::text                                                           |
| perim_scaff_systems      | postcode                | text                        | null                     | YES         | ''::text                                                           |
| phona_assistants         | id                      | text                        | null                     | NO          | null                                                               |
| phona_assistants         | name                    | text                        | null                     | NO          | null                                                               |
| phona_assistants         | config                  | jsonb                       | null                     | NO          | null                                                               |
| phona_assistants         | created_at              | timestamp with time zone    | null                     | NO          | now()                                                              |
| profiles                 | id                      | uuid                        | null                     | NO          | null                                                               |
| profiles                 | email                   | text                        | null                     | YES         | null                                                               |
| profiles                 | name                    | text                        | null                     | YES         | null                                                               |
| profiles                 | phone                   | text                        | null                     | YES         | null                                                               |
| profiles                 | avatar_url              | text                        | null                     | YES         | null                                                               |
| profiles                 | created_at              | timestamp with time zone    | null                     | YES         | now()                                                              |
| profiles                 | updated_at              | timestamp with time zone    | null                     | YES         | now()                                                              |
| reviews                  | id                      | bigint                      | null                     | NO          | nextval('reviews_id_seq'::regclass)                                |
| reviews                  | name                    | text                        | null                     | NO          | null                                                               |
| reviews                  | email                   | text                        | null                     | NO          | null                                                               |
| reviews                  | rating                  | integer                     | null                     | YES         | null                                                               |
| reviews                  | title                   | text                        | null                     | YES         | null                                                               |
| reviews                  | content                 | text                        | null                     | NO          | null                                                               |
| reviews                  | approved                | boolean                     | null                     | YES         | false                                                              |
| reviews                  | featured                | boolean                     | null                     | YES         | false                                                              |
| reviews                  | created_at              | timestamp with time zone    | null                     | YES         | now()                                                              |
| reviews                  | user_id                 | uuid                        | null                     | YES         | null                                                               |
| reviews                  | location                | text                        | null                     | YES         | null                                                               |
| reviews                  | service                 | text                        | null                     | YES         | null                                                               |
| reviews                  | booking_id              | integer                     | null                     | YES         | null                                                               |
| scaffold_rental_history  | id                      | integer                     | null                     | NO          | nextval('scaffold_rental_history_id_seq'::regclass)                |
| scaffold_rental_history  | system_id               | bigint                      | null                     | YES         | null                                                               |
| scaffold_rental_history  | p_number                | text                        | null                     | NO          | null                                                               |
| scaffold_rental_history  | hire_date               | timestamp without time zone | null                     | NO          | null                                                               |
| scaffold_rental_history  | off_hire_date           | timestamp without time zone | null                     | YES         | null                                                               |
| scaffold_rental_history  | customer_name           | text                        | null                     | NO          | null                                                               |
| scaffold_rental_history  | site_address            | text                        | null                     | NO          | null                                                               |
| scaffold_rental_history  | site_contact            | text                        | null                     | YES         | null                                                               |
| scaffold_rental_history  | site_phone              | text                        | null                     | YES         | null                                                               |
| scaffold_rental_history  | extra_sensors           | integer                     | null                     | YES         | 0                                                                  |
| scaffold_rental_history  | arc_enabled             | boolean                     | null                     | YES         | false                                                              |
| scaffold_rental_history  | arc_contact             | text                        | null                     | YES         | null                                                               |
| scaffold_rental_history  | arc_phone               | text                        | null                     | YES         | null                                                               |
| scaffold_rental_history  | app_contact             | text                        | null                     | YES         | null                                                               |
| scaffold_rental_history  | app_phone               | text                        | null                     | YES         | null                                                               |
| scaffold_rental_history  | invoices                | jsonb                       | null                     | YES         | '[]'::jsonb                                                        |
| scaffold_rental_history  | created_at              | timestamp without time zone | null                     | YES         | now()                                                              |
| scaffold_rental_history  | updated_at              | timestamp without time zone | null                     | YES         | now()                                                              |
| services                 | id                      | bigint                      | null                     | NO          | nextval('services_id_seq'::regclass)                               |
| services                 | name                    | text                        | null                     | NO          | null                                                               |
| services                 | description             | text                        | null                     | YES         | null                                                               |
| services                 | duration_minutes        | integer                     | null                     | NO          | null                                                               |
| services                 | price_pounds            | numeric                     | null                     | NO          | null                                                               |
| services                 | service_type            | text                        | null                     | NO          | null                                                               |
| services                 | location_type           | text                        | null                     | NO          | null                                                               |
| services                 | max_participants        | integer                     | null                     | YES         | 1                                                                  |
| services                 | active                  | boolean                     | null                     | YES         | true                                                               |
| services                 | created_at              | timestamp with time zone    | null                     | YES         | CURRENT_TIMESTAMP                                                  |
| services                 | updated_at              | timestamp with time zone    | null                     | YES         | CURRENT_TIMESTAMP                                                  |
| subscribers              | id                      | bigint                      | null                     | NO          | nextval('subscribers_id_seq'::regclass)                            |
| subscribers              | email                   | text                        | null                     | NO          | null                                                               |
| subscribers              | name                    | text                        | null                     | YES         | null                                                               |
| subscribers              | source                  | text                        | null                     | YES         | 'subscription'::text                                               |
| subscribers              | date_added              | timestamp with time zone    | null                     | YES         | now()                                                              |
| subscribers              | active                  | boolean                     | null                     | YES         | true                                                               |
| subscribers              | user_id                 | uuid                        | null                     | YES         | null                                                               |
| user_content             | content_type            | text                        | null                     | YES         | null                                                               |
| user_content             | id                      | bigint                      | null                     | YES         | null                                                               |
| user_content             | post_id                 | bigint                      | null                     | YES         | null                                                               |
| user_content             | content                 | text                        | null                     | YES         | null                                                               |
| user_content             | approved                | boolean                     | null                     | YES         | null                                                               |
| user_content             | created_at              | timestamp with time zone    | null                     | YES         | null                                                               |
| user_content             | user_id                 | uuid                        | null                     | YES         | null                                                               |
