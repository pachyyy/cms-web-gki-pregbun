<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePersembahanRequest;
use App\Http\Requests\UpdatePersembahanRequest;
use App\Models\GivePageSetting;
use App\Models\Persembahan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PersembahanController extends Controller
{
    public function index()
    {
        return Inertia::render('persembahan', [
            'items' => Persembahan::orderBy('order')->get(),
            'heroImageUrl' => GivePageSetting::current()->hero_image_url,
        ]);
    }

    public function store(StorePersembahanRequest $request)
    {
        $validated = $request->validated();
        $validated['order'] = (Persembahan::max('order') ?? 0) + 1;

        Persembahan::create($validated);

        return redirect()->route('persembahan')->with('success', 'Item persembahan berhasil ditambahkan.');
    }

    public function update(UpdatePersembahanRequest $request, Persembahan $persembahan)
    {
        $persembahan->update($request->validated());

        return redirect()->route('persembahan')->with('success', 'Item persembahan berhasil diperbarui.');
    }

    public function destroy(Persembahan $persembahan)
    {
        if ($persembahan->qr_public_id) {
            cloudinary()->uploadApi()->destroy($persembahan->qr_public_id);
        }

        $persembahan->delete();

        return redirect()->route('persembahan')->with('success', 'Item persembahan berhasil dihapus.');
    }

    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer',
        ]);

        foreach ($validated['ids'] as $index => $id) {
            Persembahan::where('id', $id)->update(['order' => $index + 1]);
        }

        return redirect()->route('persembahan')->with('success', 'Urutan item berhasil diperbarui.');
    }

    public function storeQrImage(Request $request, Persembahan $persembahan)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,webp,avif|max:20480',
        ]);

        if ($persembahan->qr_public_id) {
            cloudinary()->uploadApi()->destroy($persembahan->qr_public_id);
        }

        $uploaded = $this->uploadOptimized(
            $request->file('image')->getRealPath(),
            'persembahan/'.$persembahan->slug
        );

        $persembahan->update([
            'qr_public_id' => $uploaded['public_id'],
            'qr_url' => $uploaded['url'],
        ]);

        return redirect()->route('persembahan')->with('success', 'QR code berhasil disimpan.');
    }

    public function destroyQrImage(Persembahan $persembahan)
    {
        if ($persembahan->qr_public_id) {
            cloudinary()->uploadApi()->destroy($persembahan->qr_public_id);
        }

        $persembahan->update([
            'qr_public_id' => null,
            'qr_url' => null,
        ]);

        return redirect()->route('persembahan')->with('success', 'QR code berhasil dihapus.');
    }

    public function storeHeroImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,webp,avif|max:20480',
        ]);

        $setting = GivePageSetting::current();

        if ($setting->hero_image_public_id) {
            cloudinary()->uploadApi()->destroy($setting->hero_image_public_id);
        }

        $uploaded = $this->uploadOptimized($request->file('image')->getRealPath(), 'persembahan/hero');

        $setting->update([
            'hero_image_public_id' => $uploaded['public_id'],
            'hero_image_url' => $uploaded['url'],
        ]);

        return redirect()->route('persembahan')->with('success', 'Gambar hero berhasil disimpan.');
    }

    public function destroyHeroImage()
    {
        $setting = GivePageSetting::current();

        if ($setting->hero_image_public_id) {
            cloudinary()->uploadApi()->destroy($setting->hero_image_public_id);
        }

        $setting->update([
            'hero_image_public_id' => null,
            'hero_image_url' => null,
        ]);

        return redirect()->route('persembahan')->with('success', 'Gambar hero berhasil dihapus.');
    }

    /**
     * Upload a file to Cloudinary and return its public id plus an optimized
     * delivery URL (width-capped, auto quality + format) kept well under 2MB.
     *
     * Identical to KebaktianController::uploadOptimized — if a third
     * controller ends up needing this, it's worth pulling into a shared
     * trait or service rather than copying a third time.
     */
    private function uploadOptimized(string $path, string $folder): array
    {
        $response = cloudinary()->uploadApi()->upload($path, ['folder' => $folder]);

        return [
            'public_id' => $response['public_id'],
            'url' => str_replace(
                '/image/upload/',
                '/image/upload/c_limit,w_1920,q_auto,f_auto/',
                $response['secure_url']
            ),
        ];
    }
}