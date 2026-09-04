-- College Discovery MVP — initial schema
-- Mirrors prisma/schema.prisma exactly (table/column names via @map).

CREATE TABLE "states" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "source_type" TEXT,
    "verification_status" TEXT,
    "notes" TEXT,
    CONSTRAINT "states_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cities" (
    "id" INTEGER NOT NULL,
    "state_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "source_type" TEXT,
    "verification_status" TEXT,
    "notes" TEXT,
    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "cities_state_id_idx" ON "cities"("state_id");
CREATE INDEX "cities_normalized_name_idx" ON "cities"("normalized_name");
ALTER TABLE "cities" ADD CONSTRAINT "cities_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "institution_types" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    CONSTRAINT "institution_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "institution_types_slug_key" ON "institution_types"("slug");

CREATE TABLE "ownership_types" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    CONSTRAINT "ownership_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ownership_types_slug_key" ON "ownership_types"("slug");

CREATE TABLE "study_goals" (
    "id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon_key" TEXT,
    "display_order" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "label" TEXT,
    "filter_group" TEXT,
    "source_type" TEXT,
    "source_url" TEXT,
    "verification_status" TEXT,
    "notes" TEXT,
    CONSTRAINT "study_goals_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "study_goals_slug_key" ON "study_goals"("slug");

CREATE TABLE "programs" (
    "id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "degree_level" TEXT,
    "category_id" INTEGER,
    "duration_years_default" DECIMAL(4,1),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "eligibility_summary" TEXT,
    "typical_education_level" TEXT,
    "stream_requirement" TEXT,
    "normalized_name" TEXT,
    "source_type" TEXT,
    "verification_status" TEXT,
    "notes" TEXT,
    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "programs_slug_key" ON "programs"("slug");
CREATE INDEX "programs_normalized_name_idx" ON "programs"("normalized_name");

CREATE TABLE "study_goal_programs" (
    "study_goal_id" INTEGER NOT NULL,
    "program_id" INTEGER NOT NULL,
    "display_order" INTEGER,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "source_type" TEXT,
    "verification_status" TEXT,
    "notes" TEXT,
    CONSTRAINT "study_goal_programs_pkey" PRIMARY KEY ("study_goal_id","program_id")
);
ALTER TABLE "study_goal_programs" ADD CONSTRAINT "study_goal_programs_study_goal_id_fkey" FOREIGN KEY ("study_goal_id") REFERENCES "study_goals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "study_goal_programs" ADD CONSTRAINT "study_goal_programs_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "entrance_exams" (
    "id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT,
    "conducting_body" TEXT,
    "website_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "exam_scope" TEXT,
    "admission_route" TEXT,
    "applicable_state" TEXT,
    "source_type" TEXT,
    "verification_status" TEXT,
    "notes" TEXT,
    CONSTRAINT "entrance_exams_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "entrance_exams_slug_key" ON "entrance_exams"("slug");

CREATE TABLE "program_exams" (
    "program_id" INTEGER NOT NULL,
    "exam_id" INTEGER NOT NULL,
    "eligibility_scope" TEXT,
    "priority" INTEGER,
    "exam_scope" TEXT,
    "admission_route" TEXT,
    "applicable_state" TEXT,
    "source_type" TEXT,
    "verification_status" TEXT,
    "notes" TEXT,
    CONSTRAINT "program_exams_pkey" PRIMARY KEY ("program_id","exam_id")
);
ALTER TABLE "program_exams" ADD CONSTRAINT "program_exams_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "program_exams" ADD CONSTRAINT "program_exams_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "entrance_exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "colleges" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "short_name" TEXT,
    "city_id" INTEGER,
    "state_id" INTEGER,
    "institution_type_id" INTEGER,
    "ownership_id" INTEGER,
    "fees_ug_inr" DECIMAL(12,2),
    "placement_avg_lpa" DECIMAL(8,2),
    "rating" DECIMAL(3,1),
    "nirf_rank" INTEGER,
    "description_short" TEXT,
    "website_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "search_name" TEXT,
    "normalized_name" TEXT,
    "logo_url" TEXT,
    "cover_image_url" TEXT,
    "address" TEXT,
    "pincode" TEXT,
    "established_year" INTEGER,
    "accreditation" TEXT,
    "detail_available" BOOLEAN NOT NULL DEFAULT false,
    "source_type" TEXT,
    "source_url" TEXT,
    "verification_status" TEXT,
    "notes" TEXT,
    CONSTRAINT "colleges_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "colleges_slug_key" ON "colleges"("slug");
CREATE INDEX "colleges_state_id_idx" ON "colleges"("state_id");
CREATE INDEX "colleges_city_id_idx" ON "colleges"("city_id");
CREATE INDEX "colleges_rating_idx" ON "colleges"("rating");
CREATE INDEX "colleges_search_name_idx" ON "colleges"("search_name");
CREATE INDEX "colleges_normalized_name_idx" ON "colleges"("normalized_name");
ALTER TABLE "colleges" ADD CONSTRAINT "colleges_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "colleges" ADD CONSTRAINT "colleges_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "colleges" ADD CONSTRAINT "colleges_institution_type_id_fkey" FOREIGN KEY ("institution_type_id") REFERENCES "institution_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "colleges" ADD CONSTRAINT "colleges_ownership_id_fkey" FOREIGN KEY ("ownership_id") REFERENCES "ownership_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "college_programs" (
    "id" SERIAL NOT NULL,
    "college_id" INTEGER NOT NULL,
    "program_id" INTEGER NOT NULL,
    "annual_fee_inr" DECIMAL(12,2),
    "duration_years" DECIMAL(4,1),
    "eligibility_text" TEXT,
    "seats_optional" INTEGER,
    "admissions_note" TEXT,
    "source_type" TEXT,
    "source_status" TEXT,
    "source_url" TEXT,
    "verification_status" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "mapping_confidence" TEXT,
    "mapping_basis" TEXT,
    CONSTRAINT "college_programs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "college_programs_college_id_program_id_key" ON "college_programs"("college_id","program_id");
CREATE INDEX "college_programs_program_id_is_active_idx" ON "college_programs"("program_id","is_active");
CREATE INDEX "college_programs_college_id_is_active_idx" ON "college_programs"("college_id","is_active");
ALTER TABLE "college_programs" ADD CONSTRAINT "college_programs_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "college_programs" ADD CONSTRAINT "college_programs_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "college_program_exams" (
    "id" SERIAL NOT NULL,
    "college_id" INTEGER NOT NULL,
    "program_id" INTEGER NOT NULL,
    "exam_id" INTEGER NOT NULL,
    "acceptance_scope" TEXT,
    "notes" TEXT,
    "source_type" TEXT,
    "source_status" TEXT,
    "source_url" TEXT,
    "verification_status" TEXT,
    "admission_route" TEXT,
    "applicable_state" TEXT,
    CONSTRAINT "college_program_exams_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "college_program_exams_college_id_program_id_exam_id_key" ON "college_program_exams"("college_id","program_id","exam_id");
CREATE INDEX "college_program_exams_exam_id_idx" ON "college_program_exams"("exam_id");
ALTER TABLE "college_program_exams" ADD CONSTRAINT "college_program_exams_college_id_program_id_fkey" FOREIGN KEY ("college_id","program_id") REFERENCES "college_programs"("college_id","program_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "college_program_exams" ADD CONSTRAINT "college_program_exams_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "entrance_exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "placements" (
    "id" INTEGER NOT NULL,
    "college_id" INTEGER NOT NULL,
    "year" INTEGER,
    "average_package_lpa" DECIMAL(8,2),
    "median_package_lpa" DECIMAL(8,2),
    "highest_package_lpa" DECIMAL(8,2),
    "placement_rate_pct" DECIMAL(5,2),
    "source_status" TEXT,
    "source_type" TEXT,
    "source_url" TEXT,
    "verification_status" TEXT,
    "notes" TEXT,
    CONSTRAINT "placements_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "placements_college_id_idx" ON "placements"("college_id");
ALTER TABLE "placements" ADD CONSTRAINT "placements_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "college_details" (
    "college_id" INTEGER NOT NULL,
    "established_year" INTEGER,
    "campus_area" TEXT,
    "accreditation" TEXT,
    "overview" TEXT,
    "facilities" TEXT,
    "hostel_info" TEXT,
    "website_url" TEXT,
    "source_type" TEXT,
    "source_url" TEXT,
    "verification_status" TEXT,
    "notes" TEXT,
    CONSTRAINT "college_details_pkey" PRIMARY KEY ("college_id")
);
ALTER TABLE "college_details" ADD CONSTRAINT "college_details_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "reviews_demo" (
    "id" INTEGER NOT NULL,
    "college_id" INTEGER NOT NULL,
    "user_id" TEXT,
    "rating" DECIMAL(2,1),
    "title" TEXT,
    "body" TEXT,
    "created_at" TIMESTAMP(3),
    "status" TEXT,
    "source_type" TEXT,
    "verification_status" TEXT,
    "notes" TEXT,
    CONSTRAINT "reviews_demo_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "reviews_demo_college_id_idx" ON "reviews_demo"("college_id");
ALTER TABLE "reviews_demo" ADD CONSTRAINT "reviews_demo_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "college_aliases" (
    "id" INTEGER NOT NULL,
    "college_id" INTEGER NOT NULL,
    "alias" TEXT NOT NULL,
    "normalized_alias" TEXT,
    "alias_type" TEXT,
    "source_type" TEXT,
    "verification_status" TEXT,
    "notes" TEXT,
    "confidence" TEXT,
    CONSTRAINT "college_aliases_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "college_aliases_normalized_alias_idx" ON "college_aliases"("normalized_alias");
CREATE INDEX "college_aliases_college_id_idx" ON "college_aliases"("college_id");
ALTER TABLE "college_aliases" ADD CONSTRAINT "college_aliases_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password_hash" TEXT,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider","provider_account_id");
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "saved_colleges" (
    "user_id" TEXT NOT NULL,
    "college_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "saved_colleges_pkey" PRIMARY KEY ("user_id","college_id")
);
ALTER TABLE "saved_colleges" ADD CONSTRAINT "saved_colleges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "saved_colleges" ADD CONSTRAINT "saved_colleges_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "saved_comparisons" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "saved_comparisons_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "saved_comparisons" ADD CONSTRAINT "saved_comparisons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "saved_comparison_colleges" (
    "comparison_id" TEXT NOT NULL,
    "college_id" INTEGER NOT NULL,
    CONSTRAINT "saved_comparison_colleges_pkey" PRIMARY KEY ("comparison_id","college_id")
);
ALTER TABLE "saved_comparison_colleges" ADD CONSTRAINT "saved_comparison_colleges_comparison_id_fkey" FOREIGN KEY ("comparison_id") REFERENCES "saved_comparisons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "saved_comparison_colleges" ADD CONSTRAINT "saved_comparison_colleges_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
