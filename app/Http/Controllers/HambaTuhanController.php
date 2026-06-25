<?php

namespace App\Http\Controllers;

use App\Models\HambaTuhan;
use App\Support\CloudinaryImage;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HambaTuhanController extends Controller
{
    private const DESCRIPTION_MAX = 200;

    public function index()
    {
        return Inertia::render('tentangkami', [
            'hambaTuhan' => HambaTuhan::orderBy('order')->get(),
            'descriptionMax' => self::DESCRIPTION_MAX,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:'.self::DESCRIPTION_MAX,
            'image' => 'required|image|mimes:jpeg,png,jpg,webp,avif|max:20480',
        ]);

        $uploaded = CloudinaryImage::upload($request->file('image')->getRealPath(), 'hamba-tuhan');

        HambaTuhan::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'image_public_id' => $uploaded['public_id'],
            'image_url' => $uploaded['url'],
            'order' => (HambaTuhan::max('order') ?? 0) + 1,
        ]);

        return redirect()->route('tentangkami')->with('success', 'Hamba Tuhan berhasil ditambahkan.');
    }

    public function update(Request $request, HambaTuhan $hambaTuhan)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:'.self::DESCRIPTION_MAX,
        ]);

        $hambaTuhan->update($validated);

        return redirect()->route('tentangkami')->with('success', 'Hamba Tuhan berhasil diperbarui.');
    }

    public function updateImage(Request $request, HambaTuhan $hambaTuhan)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,webp,avif|max:20480',
        ]);

        CloudinaryImage::delete($hambaTuhan->image_public_id);

        $uploaded = CloudinaryImage::upload($request->file('image')->getRealPath(), 'hamba-tuhan');

        $hambaTuhan->update([
            'image_public_id' => $uploaded['public_id'],
            'image_url' => $uploaded['url'],
        ]);

        return redirect()->route('tentangkami')->with('success', 'Foto Hamba Tuhan berhasil diperbarui.');
    }

    public function destroy(HambaTuhan $hambaTuhan)
    {
        CloudinaryImage::delete($hambaTuhan->image_public_id);
        $hambaTuhan->delete();

        return redirect()->route('tentangkami')->with('success', 'Hamba Tuhan berhasil dihapus.');
    }

    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer',
        ]);

        foreach ($validated['ids'] as $index => $id) {
            HambaTuhan::where('id', $id)->update(['order' => $index + 1]);
        }

        return redirect()->route('tentangkami')->with('success', 'Urutan Hamba Tuhan berhasil diperbarui.');
    }
}
