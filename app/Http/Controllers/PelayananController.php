<?php

namespace App\Http\Controllers;

use App\Models\Pelayanan;
use App\Models\PelayananImage;
use App\Support\CloudinaryImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PelayananController extends Controller
{
    private const MAX_IMAGES = 5;

    /**
     * The fixed set of ministries rendered as tabs. Seeded by PelayananSeeder;
     * not addable/removable from the CMS — only their content is editable.
     */
    private const SLUGS = ['konseling-anugerah', 'poliklinik', 'beasiswa', 'rumah-singgah-mawari'];

    public function index()
    {
        return Inertia::render('pelayanan', [
            'pelayanan' => Pelayanan::with(['images', 'details'])
                ->whereIn('slug', self::SLUGS)
                ->orderBy('order')
                ->orderBy('id')
                ->get(),
            'maxImages' => self::MAX_IMAGES,
        ]);
    }

    public function update(Request $request, Pelayanan $pelayanan)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subtitle' => 'required|string|max:255',
            'description' => 'required|string',
        ]);

        $pelayanan->update($validated);

        return redirect()->route('pelayanan')->with('success', 'Pelayanan berhasil diperbarui.');
    }

    public function storeImage(Request $request, Pelayanan $pelayanan)
    {
        $request->validate([
            // Accept large originals; Cloudinary compresses on delivery so the
            // user never has to shrink the file themselves.
            'image' => 'required|image|mimes:jpeg,png,jpg,webp,avif|max:20480',
        ]);

        if ($pelayanan->images()->count() >= self::MAX_IMAGES) {
            return redirect()->route('pelayanan')->withErrors([
                'image' => 'Maksimal '.self::MAX_IMAGES.' gambar per pelayanan.',
            ]);
        }

        $uploaded = CloudinaryImage::upload($request->file('image')->getRealPath(), 'pelayanan/'.$pelayanan->slug);

        $pelayanan->images()->create([
            'public_id' => $uploaded['public_id'],
            'url' => $uploaded['url'],
            'order' => ($pelayanan->images()->max('order') ?? 0) + 1,
        ]);

        return redirect()->route('pelayanan')->with('success', 'Gambar berhasil ditambahkan.');
    }

    public function reorderImages(Request $request, Pelayanan $pelayanan)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer',
        ]);

        foreach ($validated['ids'] as $index => $id) {
            $pelayanan->images()->where('id', $id)->update(['order' => $index + 1]);
        }

        return redirect()->route('pelayanan')->with('success', 'Urutan gambar berhasil diperbarui.');
    }

    public function destroyImage(PelayananImage $image)
    {
        CloudinaryImage::delete($image->public_id);
        $image->delete();

        return redirect()->route('pelayanan')->with('success', 'Gambar berhasil dihapus.');
    }

    /**
     * Replace a pelayanan's detail cards with the submitted set in one shot:
     * rows with an id are updated, rows without are created, and any existing
     * row not present is deleted. Array order becomes the stored order.
     */
    public function syncDetails(Request $request, Pelayanan $pelayanan)
    {
        $validated = $request->validate([
            'details' => 'present|array',
            'details.*.id' => 'nullable|integer',
            'details.*.label' => 'required|string|max:255',
            'details.*.value' => 'required|string|max:2000',
        ]);

        DB::transaction(function () use ($pelayanan, $validated) {
            $keepIds = collect($validated['details'])->pluck('id')->filter()->all();

            $pelayanan->details()->whereNotIn('id', $keepIds)->delete();

            foreach ($validated['details'] as $index => $detail) {
                $pelayanan->details()->updateOrCreate(
                    ['id' => $detail['id'] ?? null],
                    [
                        'label' => $detail['label'],
                        'value' => $detail['value'],
                        'order' => $index + 1,
                    ],
                );
            }
        });

        return redirect()->route('pelayanan')->with('success', 'Detail pelayanan berhasil disimpan.');
    }
}
