# Deployment

Read the [INSTALL.md](INSTALL.md) file before.

## Gunicorn

```bash
pip install gunicorn

nano gunicorn_start.sh
```

Add the following content to it:

```text
#!/bin/bash

NAME=frezka
DIR=/root/FRezka
USER=root
GROUP=root
WORKERS=2
WORKER_CLASS=uvicorn.workers.UvicornWorker
VENV=$DIR/venv/bin/activate
BIND=unix:$DIR/run/gunicorn.sock
LOG_LEVEL=error

cd $DIR
source $VENV

exec gunicorn app.main:app \
  --name $NAME \
  --workers $WORKERS \
  --worker-class $WORKER_CLASS \
  --user=$USER \
  --group=$GROUP \
  --bind=$BIND \
  --log-level=$LOG_LEVEL \
  --log-file=-
```

```bash
chmod u+x gunicorn_start.sh

mkdir run
```

## Supervisor

```bash
sudo apt install supervisor -y
sudo systemctl enable supervisor
sudo systemctl start supervisor

sudo nano /etc/supervisor/conf.d/frezka.conf
```

Paste the following:

```text
[program:frezka]
command=/root/FRezka/gunicorn_start.sh
user=root
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/root/FRezka/logs/gunicorn-error.log
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl status frezka

curl --unix-socket /root/FRezka/run/gunicorn.sock localhost
```

_If you need to restart process:_  
`sudo supervisorctl restart fastapi-app`

## Nginx

```bash
sudo apt install nginx -y

sudo nano /etc/nginx/sites-available/frezka
```

Paste the following:

```text
upstream app_server {
    server unix:/root/FRezka/run/gunicorn.sock fail_timeout=0;
}

server {
    listen 80;

    server_name burlakov.live;

    keepalive_timeout 5;
    client_max_body_size 4G;

    access_log /root/FRezka/logs/nginx-access.log;
    error_log /root/FRezka/logs/nginx-error.log;

    location / {
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;
        proxy_redirect off;
                        
        if (!-f $request_filename) {
            proxy_pass http://app_server;
            break;
        }
	}
}
```

```bash
sudo ln -s /etc/nginx/sites-available/frezka /etc/nginx/sites-enabled/

sudo nginx -t  # Test nginx
sudo systemctl restart nginx
```

If you get a "Bad Gateway" error:  
Change the default user from `www-data` to `root` in nginx.conf file:  
`sudo nano /etc/nginx/nginx.conf`
