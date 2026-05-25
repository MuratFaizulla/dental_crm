# Dental CRM — CLAUDE.md

Django REST Framework API for managing dental clinic patients, doctors, appointments, and medical records.

## Stack

- Python 3.x, Django 5.0.6, Django REST Framework 3.15
- `djangorestframework-simplejwt` for JWT auth
- `django-cors-headers` for CORS
- PostgreSQL via `psycopg2-binary`
- No Celery — all operations are synchronous

## Project Layout

```
backend/
  requirements.txt
  dental_venv/           # virtualenv (not committed)
  src/
    manage.py
    dental/              # Django project settings
      settings.py
      test_settings.py
      urls.py
    api/                 # Shared API utilities, permissions
    users/               # Custom user model, JWT auth
    client/              # Patient records
    doctors/             # Doctor profiles and auth
    records/             # Visit/appointment records
    medical/             # Medical history
    benchmarks/          # Performance tests
```

## Running the Project

```bash
# Activate venv (Windows)
backend\dental_venv\Scripts\activate

# Run dev server
cd backend/src
python manage.py runserver

# Run tests
python manage.py test --settings=dental.test_settings

# Or with pytest
pytest --ds=dental.test_settings
```

## Critical Rules

### Python Conventions

- Type hints on all function signatures
- No `print()` — use `logging.getLogger(__name__)`
- f-strings for formatting, never `%` or `.format()`
- `pathlib.Path` not `os.path` for file operations
- Imports: stdlib → third-party → local

### Database

- All queries use Django ORM — raw SQL only via `.raw()` with parameterized queries
- Migrations committed to git — never `--fake` in production
- Use `select_related()` and `prefetch_related()` to prevent N+1 queries
- All models must have `created_at` and `updated_at` auto-fields
- Add indexes on fields used in `filter()`, `order_by()`, or `WHERE`

```python
# BAD: N+1
records = Record.objects.all()
for r in records:
    print(r.client.name)

# GOOD
records = Record.objects.select_related("client").all()
```

### Authentication

- JWT via `simplejwt` — access token (15 min) + refresh token (7 days)
- Every view must declare `permission_classes` explicitly — never rely on defaults
- Custom `doctors` permission logic is in `api/permissions.py`

### Serializers

- Use `ModelSerializer` for simple CRUD, `Serializer` for complex validation
- Validate at serializer level — views must be thin
- Separate read/write serializers when input and output shapes differ

### Error Handling

- Use DRF exception handler for consistent error responses
- Never expose internal error details to clients
- Domain exceptions belong in the relevant app, not views

### Code Style

- Max line length: 120 characters
- Classes: `PascalCase`, functions/variables: `snake_case`, constants: `UPPER_SNAKE_CASE`
- Functions under 50 lines, files under 800 lines

## Security Notes

> **Action required before production:**
> - Move `SECRET_KEY` out of `settings.py` into an environment variable
> - Set `DEBUG = False` and restrict `ALLOWED_HOSTS` in production
> - Rotate the current hardcoded secret key

```bash
# .env (add to .gitignore)
SECRET_KEY=<generated-secret>
DEBUG=False
ALLOWED_HOSTS=yourdomain.com
DATABASE_URL=postgres://user:pass@host:5432/dental_crm
```

## Testing

```bash
# All tests with coverage
pytest --ds=dental.test_settings --cov=. --cov-report=term-missing

# Specific app
pytest backend/src/records/ --ds=dental.test_settings -v

# Only last failures
pytest --lf --ds=dental.test_settings
```

Target: **80% coverage minimum** on all apps.

## ECC Workflow

```bash
# Plan a new feature
/plan "Add appointment scheduling with conflict detection"

# TDD for a new Django feature
/ecc:django-tdd

# Review after changes
/python-review
/ecc:django-security

# Before committing
/security-scan
/code-review

# Draft a PR
/pr
```

## Git Conventions

- `feat:` new features, `fix:` bug fixes, `refactor:` non-functional changes
- `perf:` performance improvements, `test:` test-only changes
- Feature branches from `master`, PRs required for review
