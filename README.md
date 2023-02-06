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

## DATABASE MONGO

1. Create Mongo Database dengan nama `rekondb`
2. Buat collection dengan nama `user_data`
3. import data berikut untuk kebutuhan administrasi agar bisa login

username = admin
password = md5(admin)

{
    "username" : "admin",
    "password" : "21232f297a57a5a743894a0e4a801fc3",
    "name" : "Admin Masters"
}
