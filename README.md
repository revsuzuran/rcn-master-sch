# Cron Scheduler Rekon

modul scheduler untuk memeproses data rekon LinkQu 

## Requirement

1. NPM v6
1. Node v12

## Setting Config

1. `cp .env.prod .env` 
2. Sesuaikan `.env` apabila ada yang perlu disesuaikan
3. Pastikan config koneksi ke db mongo sudah benar

## Running on Production

1. `npm i`
2. `npm i pm2 --global`
3. `pm2 start run.yml`
4. `pm2 log` (untuk memantau logging pastikan jalan)

