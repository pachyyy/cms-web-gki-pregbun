<?php

namespace Database\Seeders;

use App\Models\Pelayanan;
use Illuminate\Database\Seeder;

class PelayananSeeder extends Seeder
{
    public function run(): void
    {
        // Fixed set of ministries shown as tabs on the Pelayanan page. Slugs are
        // the permanent identity; title/subtitle/description/image are editable
        // in the CMS. updateOrCreate keeps existing edits when reseeded.
        $items = [
            [
                'slug' => 'konseling-anugerah',
                'title' => 'Konseling Anugerah',
                'subtitle' => 'Pendampingan pastoral & psikologis',
                'description' => 'Ruang aman untuk berbagi pergumulan hidup dan menemukan pemulihan bersama pendamping yang siap mendengar.',
                'order' => 1,
            ],
            [
                'slug' => 'poliklinik',
                'title' => 'Poliklinik',
                'subtitle' => 'Pelayanan kesehatan bagi jemaat & masyarakat',
                'description' => 'Layanan kesehatan dasar yang terjangkau sebagai wujud kasih dan kepedulian gereja kepada sesama.',
                'order' => 2,
            ],
            [
                'slug' => 'beasiswa',
                'title' => 'Beasiswa',
                'subtitle' => 'Dukungan pendidikan bagi yang membutuhkan',
                'description' => 'Bantuan pendidikan agar setiap anak dan generasi muda dapat terus bertumbuh dan meraih masa depan.',
                'order' => 3,
            ],
            [
                'slug' => 'rumah-singgah-mawari',
                'title' => 'Rumah Singgah Mawari',
                'subtitle' => 'Tempat singgah & pemulihan',
                'description' => 'Tempat berteduh dan pemulihan bagi mereka yang membutuhkan penginapan sementara dan pendampingan.',
                'order' => 4,
            ],
        ];

        foreach ($items as $item) {
            // Prefer an already-slugged row; otherwise adopt a legacy row created
            // via the old add-flow (matched by title) so its image/subtitle/
            // description/detail cards are preserved — only backfill the slug.
            $existing = Pelayanan::where('slug', $item['slug'])->first()
                ?? Pelayanan::whereNull('slug')->where('title', $item['title'])->first();

            if ($existing) {
                $existing->update(['slug' => $item['slug']]);

                continue;
            }

            Pelayanan::create($item);
        }
    }
}
