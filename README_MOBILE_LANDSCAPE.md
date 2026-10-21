# CUANTURE — Mobile Landscape Update

Versi ini menggunakan source code yang sebelumnya diunggah sebagai
`cuanture-oct-21-2026-10-47-40-am(1).zip`.

## Perilaku

- Ponsel dan tablet dalam mode portrait menampilkan peringatan "Putar HP ke Samping".
- Selama portrait, halaman game di belakang peringatan tidak bisa disentuh,
  tombol mulai tidak bisa digunakan, dan `?autostart=1` tidak melewati peringatan.
- Setelah perangkat benar-benar horizontal (landscape), peringatan hilang
  dan layar pembuka dapat digunakan.
- Bila perangkat dikembalikan ke portrait saat bermain, game dijeda dan
  peringatan muncul lagi. Setelah kembali landscape, pemain bisa melanjutkan
  melalui layar jeda.
- Layar desktop tidak diblokir saat browser dibuat memanjang.
- Kontrol sentuh yang sudah ada dipertahankan. HUD dan opening splash dibuat
  lebih sesuai dengan viewport HP landscape berukuran pendek.

Perlu diketahui: situs web biasa tidak dapat menjamin memutar layar perangkat
secara paksa. Jika rotasi layar terkunci pada HP, pengguna harus membuka kunci
rotasi terlebih dahulu.

## Cara update ke GitHub tanpa instal aplikasi

1. Pastikan file dalam ZIP memang sesuai dengan branch GitHub saat ini.
2. Unduh dan extract ZIP ini menggunakan fitur Extract All.
3. Di halaman GitHub repository, pilih **Add file > Upload files**.
4. Drag file DAN folder sumber dari folder hasil extract (bukan file ZIP).
5. Pastikan `src/App.tsx`, `src/index.css`, `src/game/deviceOrientation.ts`,
   `src/components/RotateDeviceOverlay.tsx`, `src/components/GameHUD.tsx`,
   `src/components/OpeningSplash.tsx`, `src/components/MobileTouchControls.tsx`,
   dan `index.html` berada pada path yang sama dengan kode sebelumnya.
6. Commit perubahan.

Jika repository sudah mendapat perubahan baru sejak arsip dibuat,
jangan menimpa file tersebut secara membabi buta; lakukan penggabungan kode.

## Verifikasi sebelum deploy

Di lingkungan Node yang mendukung proyek, jalankan:

```
npm install
npm run lint
npm run build
```

Lalu periksa di HP Android/iPhone: portrait, landscape, kunci rotasi,
rotasi ulang saat bermain, dan viewport desktop.
