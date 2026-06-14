# 1. Gunakan image Node.js versi ringan (Alpine) sebagai base
# Anda bisa mengubah angka 20 sesuai dengan versi Node.js yang Anda gunakan
FROM node:20-alpine

# 2. Tentukan direktori kerja di dalam container
WORKDIR /usr/src/app

# 3. Salin file package.json dan package-lock.json terlebih dahulu
# Ini memanfaatkan fitur cache Docker agar proses build lebih cepat
COPY package*.json ./

# 4. Install dependencies aplikasi
# Gunakan 'npm ci' jika untuk production, atau 'npm install' untuk development
RUN npm install

# 5. Salin seluruh kode source code aplikasi dari lokal ke dalam container
COPY . .

# 6. Ekspos port sesuai dengan konfigurasi di .env Anda
EXPOSE 3000

# 7. Perintah utama untuk menjalankan aplikasi saat container menyala
# Sesuaikan "start" dengan script yang ada di package.json Anda (misal: "node index.js")
CMD ["npm", "start"]