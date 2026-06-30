# DATABASE_SCHEMA

Document ID: DOC-025  
Version: 0.1.0  
Status: Draft

## Core Tables

### users

Single-user local mode initially.

Fields:
- id
- full_name
- email
- location
- timezone
- created_at
- updated_at

### profiles

Master Candidate Profile.

Fields:
- id
- user_id
- summary
- target_roles
- industries
- locations
- salary_expectations
- preferences_json

### experiences

Fields:
- id
- profile_id
- company
- title
- start_date
- end_date
- description
- achievements_json

### skills

Fields:
- id
- profile_id
- name
- category
- proficiency
- evidence

### resumes

Fields:
- id
- profile_id
- name
- version
- content_markdown
- target_role
- created_at

### jobs

Fields:
- id
- company
- title
- location
- url
- source
- jd_text
- status
- score
- created_at

### applications

Fields:
- id
- job_id
- resume_id
- status
- applied_at
- notes
- follow_up_date

### documents

Fields:
- id
- profile_id
- filename
- file_type
- local_path
- tags_json

### ai_runs

Fields:
- id
- task_type
- provider
- model
- input_hash
- output_path
- created_at

## Vector Store Collections

- profile_chunks
- resume_chunks
- job_description_chunks
- interview_notes
- learning_materials
