# College Discovery MVP — Final Revised Dataset

This package revises the supplied college dataset around the required hierarchy:

**Study Goal → Program → College → College + Program → Accepted Exams**

The supplied 1,203-college base is preserved. The central eligibility relation is `college_programs.csv`; institution type and ownership are separate filters rather than proxies for what a student can study.

## Highest-priority change: `college_programs.csv`

- Original revised build: 3,940 mappings.
- Final file: 3,570 mappings after the accuracy pass and additional official mappings.
- 408 mappings removed as clearly incompatible or institution-specific legacy mappings.
- Low-confidence legacy rows are retained for audit but marked `is_active=false`, so they cannot contaminate live eligibility filtering.
- Active mappings are limited to higher-confidence/verified rows.
- `mapping_confidence` values: `verified`, `high`, `medium`, `low`.
- `mapping_basis` explains why each relation exists.

This prevents unsupported legacy mappings from silently determining the result universe.

## Verification semantics

`verified` = supported by an exact official institutional programme source checked during this revision.

`high` = strong institution/type or explicit programme-name evidence, but not individually verified against an official page.

`medium` = plausible derived mapping based on explicit naming/institution clues; requires later verification.

`low` = legacy/ambiguous derived mapping retained only for audit and disabled from active eligibility.

`source_type` uses: `official`, `public_dataset`, `curated`, `derived`, `synthetic_demo`.

## Other revisions

- `study_goals.csv`: adds `label` and `filter_group`.
- `study_goal_programs.csv`: adds `display_order` and `is_primary`.
- `programs.csv`: adds description, eligibility summary, typical education level, stream requirement and normalized name.
- `entrance_exams.csv`: adds exam scope, admission route and applicable state; adds NLSAT-LLB.
- `program_exams.csv`: adds the same exam classification fields and the institution-specific NLSAT-LLB route.
- `college_program_exams.csv`: tightened to program-specific acceptance; includes `admission_route` and `applicable_state`.
- `colleges.csv`: normalized search fields, institution type, ownership where defensible, optional presentation metadata and safe website seeds.
- `institution_types.csv`: expanded to 19 canonical types.
- `ownership_types.csv`: expanded to include Central Government, State Government and Deemed University without forcing unsupported classifications.
- `placements.csv`: keeps missing median/highest/placement-rate values null/blank instead of fabricating them.
- `college_details.csv`: retains 150 rich/demo detail shells; narrative fields remain explicitly synthetic/demo.
- `reviews_demo.csv`: remains synthetic/demo and is labeled accordingly.
- `college_aliases.csv`: adds alias confidence and verified acronyms for a small safe set.
- City data remains canonical; unresolved city values are left null rather than invented.

## Hard filtering rule

A college is eligible for a selected goal only through an **active** `college_programs` mapping to a program that belongs to that goal.

With a selected program, the college must have that same active program mapping.

With a selected exam, the exam must be accepted for that same college/program pair through `college_program_exams.csv` (or an explicitly supported program-level default).

## Data-quality safeguards

- 1,203 colleges retained.
- Missing city values are not converted into invented locations.
- Missing NIRF ranks remain null, never 0.
- Numeric placement fields remain blank when unsupported.
- Foreign-key references are validated.
- Special institutional families (IIT/NIT/IIIT/IIM/AIIMS/NLU/medical/polytechnic/hospitality) receive tighter mapping rules.
- Current official source-backed rows are recorded in `VERIFICATION_SOURCES.md`.


## Low-confidence accuracy pass (2026-09-03)

The 1,373 previously inactive low-confidence legacy mappings were adjudicated one-by-one. Each row now has a decision in `low_confidence_mapping_audit.csv`: `PROMOTE` or `KEEP_INACTIVE`. 124 rows were promoted because they met a strong institutional-identity rule, an explicit domain rule, or an official programme-catalogue match. The remaining 1249 rows stay inactive because the evidence was ambiguous or the specific programme was not supported.

Promotion semantics remain backend-facing: `verified`, `high`, and `medium` are eligible when `is_active=true`; `low` is excluded. The frontend does not need to understand confidence values.

This pass also corrected obvious institution-type taxonomy errors: IIIT institutions are classified as IIIT rather than IIT; JIIT Noida and KIIT University Bhubaneswar use `Deemed University`; and obvious IIT management departments use `Management Institute`.

### Accuracy-pass result

- Previously inactive low-confidence mappings reviewed: **1,373**
- Promoted to active: **124**
- Kept inactive after review: **1,249**
- Active college-program rows after the pass: **2,321**
- Colleges with at least one active program mapping: **746**

The pass is intentionally conservative: generic `University`, `College`, `Government`, or `Private` labels were not treated as proof of a specific programme. Strong institutional/domain signals and official programme catalogues were used where available.
## v3 taxonomy correction: B.Arch

- Removed the `Engineering -> B.Arch` relationship from `study_goal_programs.csv`.
- `B.Arch` remains under `Architecture & Planning` only.
- Kept `program_exams.csv` mappings for B.Arch (including NATA and applicable routes) because exams remain program-specific rather than goal-wide.
- Recomputed `qa_goal_coverage.csv` from the active mapping tables.

This prevents Architecture/Planning colleges from entering the Engineering goal solely because B.Arch was previously attached to that goal.
