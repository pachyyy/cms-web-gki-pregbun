<?php

namespace App\Http\Controllers;

use App\Models\Kebaktian;
use App\Models\KebaktianImage;
use App\Support\CloudinaryImage;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KebaktianController extends Controller
{
    private const MAX_IMAGES = 5;

    public function index()
    {
        return Inertia::render('kebaktian', [
            'kebaktians' => Kebaktian::with('images')->orderBy('order')->get(),
            'maxImages' => self::MAX_IMAGES,
        ]);
    }

    public function update(Request $request, Kebaktian $kebaktian)
    {
        $validated = $request->validate([
            'description' => 'nullable|string',
            'schedules' => 'nullable|array',
            'schedules.*' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'audience' => 'nullable|string|max:255',
            'youtube_url' => 'nullable|url|max:255',
        ]);

        $kebaktian->update($validated);

        return redirect()->route('kebaktian')->with('success', 'Informasi kebaktian berhasil diperbarui.');
    }

    public function storeImage(Request $request, Kebaktian $kebaktian)
    {
        $request->validate([
            // Accept large originals; Cloudinary compresses on delivery so the
            // user never has to shrink the file themselves.
            'image' => 'required|image|mimes:jpeg,png,jpg,webp,avif|max:20480',
        ]);

        if ($kebaktian->images()->count() >= self::MAX_IMAGES) {
            return redirect()->route('kebaktian')->withErrors([
                'image' => 'Maksimal '.self::MAX_IMAGES.' gambar per kebaktian.',
            ]);
        }

        $uploaded = CloudinaryImage::upload($request->file('image')->getRealPath(), 'kebaktian/'.$kebaktian->slug);

        $kebaktian->images()->create([
            'public_id' => $uploaded['public_id'],
            'url' => $uploaded['url'],
            'order' => ($kebaktian->images()->max('order') ?? 0) + 1,
        ]);

        return redirect()->route('kebaktian')->with('success', 'Gambar berhasil ditambahkan.');
    }

    public function destroyImage(KebaktianImage $image)
    {
        CloudinaryImage::delete($image->public_id);
        $image->delete();

        return redirect()->route('kebaktian')->with('success', 'Gambar berhasil dihapus.');
    }

    public function reorderImages(Request $request, Kebaktian $kebaktian)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer',
        ]);

        foreach ($validated['ids'] as $index => $id) {
            $kebaktian->images()->where('id', $id)->update(['order' => $index + 1]);
        }

        return redirect()->route('kebaktian')->with('success', 'Urutan gambar berhasil diperbarui.');
    }

    public function updateHome(Request $request, Kebaktian $kebaktian)
    {
        $validated = $request->validate([
            'home_subtitle' => 'nullable|string|max:255',
        ]);

        $kebaktian->update($validated);

        return redirect()->route('kebaktian')->with('success', 'Keterangan tampilan home berhasil diperbarui.');
    }

    public function storeHomeImage(Request $request, Kebaktian $kebaktian)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,webp,avif|max:20480',
        ]);

        // Only one home image per kebaktian: remove the previous one first.
        CloudinaryImage::delete($kebaktian->home_image_public_id);

        $uploaded = CloudinaryImage::upload($request->file('image')->getRealPath(), 'kebaktian/'.$kebaktian->slug.'/home');

        $kebaktian->update([
            'home_image_public_id' => $uploaded['public_id'],
            'home_image_url' => $uploaded['url'],
        ]);

        return redirect()->route('kebaktian')->with('success', 'Gambar tampilan home berhasil disimpan.');
    }

    public function destroyHomeImage(Kebaktian $kebaktian)
    {
        CloudinaryImage::delete($kebaktian->home_image_public_id);

        $kebaktian->update([
            'home_image_public_id' => null,
            'home_image_url' => null,
        ]);

        return redirect()->route('kebaktian')->with('success', 'Gambar tampilan home berhasil dihapus.');
    }
}
