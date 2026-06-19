FROM php:8.2-fpm

# Ambil argumen dari compose.yml
ARG USER_ID
ARG GROUP_ID

# Install dependensi sistem dan ekstensi PHP yang diperlukan
RUN apt-get update && apt-get install -y \
    libpng-dev libjpeg-dev libfreetype6-dev libzip-dev zip git unzip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd pdo pdo_mysql zip \
    && rm -rf /var/lib/apt/lists/*s

# Buat user sistem untuk menjalankan Composer dan PHP Command
# Ini mencegah file dimiliki oleh 'root' di Linux/WSL
RUN addgroup --gid ${GROUP_ID} usergroup || true
RUN adduser --disabled-password --gecos "" --uid ${USER_ID} --gid ${GROUP_ID} devuser || true

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www
COPY . .

# Pastikan folder dimiliki oleh user baru
RUN chown -R ${USER_ID}:${GROUP_ID} /var/www

# Install dependensi Laravel (opsional saat build)
# RUN composer install

EXPOSE 9000
CMD ["php-fpm"]

USER devuser