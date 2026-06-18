<?php

namespace Database\Seeders;

use App\Models\Kebaktian;
use Illuminate\Database\Seeder;

class KebaktianSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            [
                'slug' => 'umum',
                'title' => 'Kebaktian Umum',
                'description' => 'Perjumpaan mingguan seluruh jemaat dalam pujian, doa, dan pemberitaan Firman — momen kita kembali berakar pada Kristus sebelum melangkah ke pekan yang baru.',
                'schedules' => ['MINGGU - 07.30 WIB', 'MINGGU - 10.00 WIB', 'MINGGU - 17.00 WIB'],
                'location' => 'Ruang Ibadah Utama, Jl. Pregolan Bunder 36',
                'audience' => 'Seluruh Jemaat & umum',
                'youtube_url' => 'https://www.youtube.com/@gkipregolanbunder',
                'order' => 1,
            ],
            [
                'slug' => 'pemuda',
                'title' => 'Kebaktian Pemuda',
                'description' => 'Ruang bagi kaum muda untuk bertanya, bertumbuh, dan menemukan suara iman sendiri — ibadah yang jujur, hangat, dan dekat dengan pergumulan sehari-hari.',
                'schedules' => ['MINGGU - 10.00 WIB'],
                'location' => 'GSG Lantai 2, Jl. Pregolan Bunder 36',
                'audience' => 'Usia 18 – 35 tahun',
                'youtube_url' => 'https://www.youtube.com/@gkipregolanbunder',
                'order' => 2,
            ],
            [
                'slug' => 'remaja',
                'title' => 'Kebaktian Remaja',
                'description' => 'Ibadah para remaja untuk mengenal Kristus di tengah dunia yang sedang dijelajahi — penuh persahabatan, musik yang hidup, dan percakapan yang relevan.',
                'schedules' => ['MINGGU - 10.00 WIB'],
                'location' => 'Ruang Ibadah Remaja, Jl. Pregolan Bunder 23',
                'audience' => 'Usia 13 – 17 tahun',
                'youtube_url' => null,
                'order' => 3,
            ],
            [
                'slug' => 'sekolah-minggu',
                'title' => 'Sekolah Minggu',
                'description' => 'Ibadah anak-anak yang ceria untuk mengenal kasih Tuhan melalui cerita, lagu, dan permainan.',
                'schedules' => ['MINGGU - 09.00 WIB'],
                'location' => 'Ruang Sekolah Minggu, Jl. Pregolan Bunder 36',
                'audience' => 'Anak-anak',
                'youtube_url' => null,
                'order' => 4,
            ],
        ];

        foreach ($items as $item) {
            Kebaktian::updateOrCreate(['slug' => $item['slug']], $item);
        }
    }
}
