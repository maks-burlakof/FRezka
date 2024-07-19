#!/bin/bash

frezka_dir=$(pwd)
frezka_user="$USER"
domain_name=""

print_info_text() {
    echo -e "\n\e[0;35m$1\e[0m\n"
}

print_error_text() {
    echo -e "\n\e[31m$1\e[0m\n"
}

# Display help message
help() {
    local help="
FRezka application installer.

Usage: $0 [options]
Options:
  -h                Show help message.
  test              Test the application.
  -p <path name>    Specify an installation path. Default is the current directory.
  -u <user name>    Specify a user. Default is the current user.
  -d <domain name>  Specify a domain name.
    "
    echo "$help"
}

# Install frezka
install () {
    local logo="
███████╗██████╗ ███████╗███████╗██╗  ██╗ █████╗ 
██╔════╝██╔══██╗██╔════╝╚══███╔╝██║ ██╔╝██╔══██╗
█████╗  ██████╔╝█████╗    ███╔╝ █████╔╝ ███████║
██╔══╝  ██╔══██╗██╔══╝   ███╔╝  ██╔═██╗ ██╔══██║
██║     ██║  ██║███████╗███████╗██║  ██╗██║  ██║
╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝
                                                
    "
    echo -e "\n\e[1;93m${logo}\e[0m\n"

    local db_password=$(openssl rand -base64 32)

    cat <<EOL > "$frezka_dir/.env"
DATABASE_HOSTNAME=localhost
DATABASE_PORT=5432
DATABASE_PASSWORD=$db_password
DATABASE_NAME=frezka
DATABASE_USERNAME=frezka
SECRET_KEY=
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=525600
REZKA_URL="http://hdrezka.ag/"
EOL

    print_info_text "The configuration file .env has been created. Please fill in the required fields."
    print_info_text "!> frezka database password: $db_password"

    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    pip install gunicorn

    print_info_text "The virtual environment has been created and the required packages have been installed."

    cat <<EOL > "$frezka_dir/gunicorn_start.sh"
#!/bin/bash

NAME=frezka
DIR=$frezka_dir
USER=$frezka_user
GROUP=$frezka_user
WORKERS=2
WORKER_CLASS=uvicorn.workers.UvicornWorker
VENV=\$DIR/venv/bin/activate
BIND=unix:\$DIR/run/gunicorn.sock
LOG_LEVEL=error

cd \$DIR
source \$VENV

exec gunicorn app.main:app \
  --name \$NAME \
  --workers \$WORKERS \
  --worker-class \$WORKER_CLASS \
  --user=\$USER \
  --group=\$GROUP \
  --bind=\$BIND \
  --log-level=\$LOG_LEVEL \
  --log-file=-
EOL

    chmod u+x gunicorn_start.sh
    mkdir run
    mkdir logs

    print_info_text "The gunicorn_start.sh script has been created. You can start the application by running the script."

    cat <<EOL > "/etc/supervisor/conf.d/frezka.conf"
[program:frezka]
command=$frezka_dir/gunicorn_start.sh
user=$frezka_user
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=$frezka_dir/logs/gunicorn-error.log
EOL

    sudo supervisorctl reread
    sudo supervisorctl update
    sudo supervisorctl status frezka

    cat <<EOL > "/etc/nginx/sites-available/frezka"
upstream frezka_app_server {
    server unix:$frezka_dir/run/gunicorn.sock fail_timeout=0;
}

server {
    listen 80;

    server_name $domain_name;

    keepalive_timeout 5;
    client_max_body_size 4G;

    access_log $frezka_dir/logs/nginx-access.log;
    error_log $frezka_dir/logs/nginx-error.log;

    location / {
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header Host \$http_host;
        proxy_redirect off;
                        
        if (!-f \$request_filename) {
            proxy_pass http://frezka_app_server;
            break;
        }
	}
}
EOL
    sudo ln -s /etc/nginx/sites-available/frezka /etc/nginx/sites-enabled/

    print_info_text "Nginx configuration file 'frezka' created. Testing nginx: "
    sudo nginx -t
    sudo systemctl restart nginx

    print_info_text "The installation has been completed successfully."

    print_info_text " Note: \n If you get a 'Bad Gateway' error: \n Change the default user from 'www-data' to 'root' in nginx.conf file: \n sudo nano /etc/nginx/nginx.conf"
}

# Test frezka application
test () {
    echo " > supervisor status: "
    sudo systemctl status supervisor
    sudo supervisorctl status frezka
    echo -e "\n > curl request: "
    curl --unix-socket $frezka_dir/run/gunicorn.sock localhost
    echo -e "\n > nginx status: "
    sudo nginx -t
    sudo systemctl status nginx
}

while [[ $# -gt 0 ]]; do
    key="$1"

    case $key in
        -h)
            help
            exit 0
            ;;
        test)
            test
            exit 0
            ;;
        -p)
            if [[ -n "$2" && ! "$2" =~ ^- ]]; then
                frezka_dir="$2"
                shift # past argument
            else
                echo "Option -p requires an argument." >&2
                help
                exit 1
            fi
            ;;
        -u)
            if [[ -n "$2" && ! "$2" =~ ^- ]]; then
                frezka_user="$2"
                shift # past argument
            else
                echo "Option -u requires an argument." >&2
                help
                exit 1
            fi
            ;;
        -d)
            if [[ -n "$2" && ! "$2" =~ ^- ]]; then
                domain_name="$2"
                shift # past argument
            else
                echo "Option -d requires an argument." >&2
                help
                exit 1
            fi
            ;;
        *)
            echo "Unknown option: $key" >&2
            help
            exit 1
            ;;
    esac
    shift # past key
done

print_info_text "Welcome to the FRezka application installer.\nThis script will guide you through the installation process."
print_info_text " > Installation directory: $frezka_dir \n > User: $frezka_user"

read -p "Enter 'yes' to install and configure FRezka: " user_input
if [[ "$user_input" != "yes" && "$user_input" != "y" ]]; then
    print_error_text "The installation cancelled by you.\nExiting installer..."
    exit 1
fi

terminal_width=$(tput cols)
hash_count=$(printf "%-${terminal_width}s" "#" | tr ' ' '#')
echo "$hash_count"

if [[ -z "$domain_name" ]]; then
    read -p "Enter the domain name (ex. example.com): " domain_name
fi

print_info_text " > Domain name: $domain_name"

install
