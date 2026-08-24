# Project Rules: CareerOS

## Mandatory Data Privacy & GitHub Zero-PII Policy
- **Zero Real PII in Git**: Real resumes, personal phone numbers, real emails, addresses, .env, tokens, credentials.json, token.json, or personal endpoint URLs must NEVER be committed to Git or pushed to GitHub.
- **Automatic Masking & Anonymization**: All tracked sample data files must strictly use realistic mock/dummy data.
- **Local Backup Protection**: Real user data must be backed up exclusively to local_private_backup/ or private_data/ (both enforced in .gitignore).
- **Mandatory Pre-Commit Sanitization**: Follow the git-privacy-sanitizer skill before every git commit or git push.
