@echo off
php -d extension_dir=ext -d extension=openssl -d extension=mbstring -d extension=curl -d extension=fileinfo -d extension=pdo_sqlite -d extension=zip -d extension=fileinfo %*
