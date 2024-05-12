This directory is used for storing versions handled by alembic

How to create a new version:

```bash
alembic revision --autogenerate -m "your message here"

alembic upgrade head
```
