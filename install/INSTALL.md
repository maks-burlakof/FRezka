# Installation

## Auto-install and deploy

```bash
bash install/install.sh
```

Use `-h` option to get help. You can specify installation path `-p`, user `-u` and domain name for nginx configuration `-d`.

**Testing application:**

```bash
bash install/install.sh test
```

## Manual installation

Create a venv, install requirements.

Create `.env` file in directory `app/`. Fill the following info:

```text
DATABASE_HOSTNAME=
DATABASE_PORT=
DATABASE_PASSWORD=
DATABASE_NAME=
DATABASE_USERNAME=
SECRET_KEY=
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=525600
REZKA_URL="http://hdrezka.ag/"
```

**What's next?**

Read the [DEPLOY.md](DEPLOY.md).
