# Stage 1: Build dependencies safely
FROM composer:latest AS build
WORKDIR /app
COPY . /app
RUN composer install --no-dev --optimize-autoloader

# Stage 2: Setup the Apache Web Server
FROM php:8.3-apache

# Install the MySQL extension to connect to Aiven
RUN docker-php-ext-install pdo_mysql

# Enable Laravel routing
RUN a2enmod rewrite

# Change Apache listening port to 10000 for Render
RUN sed -i 's/80/10000/g' /etc/apache2/ports.conf /etc/apache2/sites-available/000-default.conf

# Copy the prepared files from Stage 1
COPY --from=build /app /var/www/html

# Point the server to Laravel's public folder and allow Symlinks
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Allow Apache to follow symbolic links for storage
RUN sed -i '/<Directory \/var\/www\/html\/public>/,/<\/Directory>/ s/Options Indexes FollowSymLinks/Options Indexes FollowSymLinks MultiViews/' /etc/apache2/apache2.conf || \
    echo "<Directory /var/www/html/public>\nOptions FollowSymLinks\nAllowOverride All\nRequire all granted\n</Directory>" >> /etc/apache2/apache2.conf

# Fix folder permissions for Laravel
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Explicitly expose port 10000 for Render
EXPOSE 10000

# Run migrations, create storage symlink, and start Apache on boot
CMD php artisan migrate --force && php artisan storage:link --force && apache2-foreground
