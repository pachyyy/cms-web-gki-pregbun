<?php

namespace App\Http\Controllers;

use App\Models\Kebaktian;
use App\Models\KebaktianImage;
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

        $response = cloudinary()->uploadApi()->upload(
            $request->file('image')->getRealPath(),
            ['folder' => 'kebaktian/'.$kebaktian->slug]
        );

        // Store an optimized delivery URL: cap width at 1920px and let Cloudinary
        // pick the best quality + format (WebP/AVIF). This keeps the delivered
        // image well under 2MB regardless of how large the upload was.
        $optimizedUrl = str_replace(
            '/image/upload/',
            '/image/upload/c_limit,w_1920,q_auto,f_auto/',
            $response['secure_url']
        );

        $kebaktian->images()->create([
            'public_id' => $response['public_id'],
            'url' => $optimizedUrl,
            'order' => ($kebaktian->images()->max('order') ?? 0) + 1,
        ]);

        return redirect()->route('kebaktian')->with('success', 'Gambar berhasil ditambahkan.');
    }

    public function destroyImage(KebaktianImage $image)
    {
        cloudinary()->uploadApi()->destroy($image->public_id);
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
}
