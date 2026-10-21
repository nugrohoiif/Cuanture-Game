# Cuanture — Mobile Fullscreen & UI Landscape (v2)

## Perubahan
- Permintaan layar penuh dilakukan saat pengguna menyentuh tombol Mulai, bukan saat halaman dimuat: browser melarang fullscreen otomatis tanpa interaksi pengguna.
- Tombol fullscreen dan tombol peta baru di HUD mobile. Peta dapat dibuka/tutup agar ruang bermain tidak terhalang.
- Android Chrome dan browser yang mendukung Fullscreen API akan mencoba fullscreen. Safari iPhone/iPad dalam tab biasanya tidak mendukung fullscreen elemen halaman: pilih Bagikan → Tambah ke Layar Utama, lalu jalankan dari ikon baru (tersedia manifest dan Apple meta tags).
- Splash, panduan, dialog misi, HUD, joystick, tombol interaksi, dan tombol zoom dirapikan untuk mobile horizontal kecil; termasuk safe-area notch dan height dinamis.
- Kontrol ditata satu baris di kanan, joystick diperkecil, input direset pada perpindahan orientasi, minimap opsional.
- Rendering DPR di HP dibatasi maksimal 1.5 agar GPU mobile lebih ringan.
- Peringatan rotasi ke landscape tetap wajib; layar portrait tidak bisa memulai game.
- Desktop tidak berubah.

## Instalasi melalui GitHub web
1. Simpan cadangan branch/repository terlebih dahulu.
2. Extract ZIP PATCH dan upload file/folder isinya ke root repository melalui Add file → Upload files.
3. Jika GitHub menolak overwrite lewat Upload files, buka masing-masing file lalu Edit (ikon pensil) / gunakan github.dev di browser dengan tombol titik (`.`) dari repository.
4. Jalankan live preview melalui browser pada StackBlitz atau deployment sendiri. Bila mengubah file di StackBlitz, simpan commit ke repository GitHub.

## Batasan perangkat
- Fullscreen *tidak bisa dipaksa otomatis* saat URL baru dibuka. Memerlukan tap/click dan izin browser.
- Safari iOS dalam tab mungkin tetap memperlihatkan address bar. Standalone melalui Tambah ke Layar Utama menampilkan UI mendekati fullscreen (tergantung versi iOS/perangkat).
- Mode portrait menahan gameplay; pengguna perlu memutar perangkat fisik. CSS tidak merotasi permainan secara palsu.

## Pengujian yang direkomendasikan
- Android Chrome: 360x800 portrait -> overlay rotasi; 800x360 landscape -> Mulai dan fullscreen; buka/tutup peta, joystick, interaksi, masuk/keluar pause, dialog yang panjang bisa scroll.
- iPhone Safari: 390x844 portrait -> overlay; 844x390 landscape -> kontrol; coba Tambah ke Layar Utama; tes notch kiri/kanan.
- Desktop 1366x768: UI desktop dan keyboard tidak berubah.
