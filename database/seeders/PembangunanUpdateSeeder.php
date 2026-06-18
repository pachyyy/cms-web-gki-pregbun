<?php

namespace Database\Seeders;

use App\Models\PembangunanUpdate;
use Illuminate\Database\Seeder;

class PembangunanUpdateSeeder extends Seeder
{
    public function run(): void
    {
        PembangunanUpdate::create([
            'update_date' => '2026-05-07',
            'target_persembahan' => 6_900_000_000,
            'persembahan_pembangunan' => 4_654_134_105,
            'janji_iman_terealisasi' => 830_802_256,
            'janji_iman_belum_terealisasi' => 332_400_000,
            'rincian_start_date' => '2024-07-01',
            'rincian_end_date' => '2026-05-07',
        ]);
    }
}
