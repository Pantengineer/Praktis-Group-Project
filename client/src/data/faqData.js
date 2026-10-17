// client/src/data/faqData.js

export const FAQ_CATEGORIES = [
  { id: 'all', label: 'Semua Pertanyaan', icon: 'bi-grid-fill' },
  { id: 'akun', label: 'Akun & Login', icon: 'bi-person-badge-fill' },
  { id: 'praktikum', label: 'Praktikum & Jadwal', icon: 'bi-mortarboard-fill' },
  { id: 'tugas', label: 'Materi & Tugas', icon: 'bi-file-earmark-arrow-up-fill' },
  { id: 'presensi', label: 'Presensi & Kehadiran', icon: 'bi-calendar-check-fill' },
  { id: 'teknis', label: 'Bantuan & Kendala Teknis', icon: 'bi-headset' },
];

export const FAQ_ITEMS = [
  {
    id: 1,
    category: 'akun',
    question: 'Bagaimana cara masuk (login) ke sistem PRAKTIS?',
    answer: 'Gunakan alamat email universitas/resmi yang telah didaftarkan oleh administrator dan kata sandi Anda. Jika Anda baru pertama kali login, gunakan kata sandi standar yang diberikan oleh pengelola laboratorium.',
  },
  {
    id: 2,
    category: 'akun',
    question: 'Apa yang harus saya lakukan jika lupa kata sandi akun saya?',
    answer: 'Klik tautan "Lupa Password?" pada halaman login. Masukkan email terdaftar Anda, dan sistem akan mengirimkan tautan reset kata sandi yang berlaku selama 15 menit. Ikuti instruksi di dalam email untuk membuat kata sandi baru.',
  },
  {
    id: 3,
    category: 'akun',
    question: 'Mengapa saya tidak menerima email reset kata sandi?',
    answer: 'Pastikan email yang Anda masukkan sudah benar dan terdaftar di sistem PRAKTIS. Periksa juga folder "Spam" atau "Junk" di email Anda. Jika email tetap tidak masuk setelah beberapa menit, hubungi administrator laboratorium melalui tombol kontak yang tersedia.',
  },
  {
    id: 4,
    category: 'praktikum',
    question: 'Bagaimana cara melihat jadwal dan ruangan kelas praktikum saya?',
    answer: 'Setelah login sebagai mahasiswa atau asisten dosen, buka menu "Jadwal" atau pilih mata praktikum di dashboard. Setiap praktikum memiliki 10 sesi pertemuan terstruktur lengkap dengan tanggal, jam mulai-selesai, dan nomor lab komputer.',
  },
  {
    id: 5,
    category: 'praktikum',
    question: 'Saya terdaftar di praktikum tetapi mata kuliah belum muncul di dashboard, mengapa?',
    answer: 'Pendaftaran kelas (enrollment) dilakukan oleh administrator laboratorium pada awal semester. Jika nama Anda belum tercantum dalam kelas praktikum yang seharusnya Anda ikuti, segera konfirmasikan ke Asisten Dosen atau Administrator Lab.',
  },
  {
    id: 6,
    category: 'tugas',
    question: 'Bagaimana cara mengunduh materi dan modul praktikum?',
    answer: 'Buka menu "Materi" pada kelas praktikum yang Anda ikuti, lalu klik pada pertemuan yang sesuai. Anda dapat langsung mengunduh berkas modul/slide presentasi yang telah diunggah oleh Asdos atau Dosen pengampu.',
  },
  {
    id: 7,
    category: 'tugas',
    question: 'Bagaimana ketentuan dan format pengumpulan tugas/laporan?',
    answer: 'Masuk ke menu "Tugas" pada sesi pertemuan yang memiliki tugas aktif. Perhatikan tenggat waktu (deadline). Unggah berkas tugas Anda (ZIP/PDF sesuai petunjuk asdos) sebelum waktu berakhir. Batas maksimal ukuran per berkas adalah 10 MB.',
  },
  {
    id: 8,
    category: 'tugas',
    question: 'Apakah saya bisa merevisi tugas yang sudah dikumpulkan?',
    answer: 'Anda dapat mengunggah ulang revisi tugas selama batas waktu pengumpulan (deadline) belum berakhir. Berkas yang baru akan menggantikan pengumpulan sebelumnya secara otomatis.',
  },
  {
    id: 9,
    category: 'presensi',
    question: 'Bagaimana sistem pencatatan kehadiran (presensi) mahasiswa?',
    answer: 'Presensi dicatat oleh Asisten Dosen pada setiap sesi pertemuan dengan status: Hadir, Izin, Sakit, atau Alfa. Anda dapat memantau rekap kehadiran Anda secara real-time melalui halaman profil dan timeline kelas.',
  },
  {
    id: 10,
    category: 'teknis',
    question: 'Apa yang harus dilakukan jika mengalami kendala sistem atau gagal unggah berkas?',
    answer: 'Pastikan koneksi internet stabil dan ukuran berkas tidak melebihi 10 MB. Jika masih terjadi error (misal kapasitas penuh atau gagal simpan), Anda dapat menghubungi nomor WhatsApp Helpdesk Laboratorium yang tercantum di bagian bawah halaman ini.',
  },
];
