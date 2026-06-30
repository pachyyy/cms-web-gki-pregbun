<?php

namespace App\Http\Controllers;

use App\Models\Pelayanan;
use App\Support\CloudinaryImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PelayananController extends Controller
{
    public function index()
    {
        return Inertia::render('pelayanan', [
            'pelayanan' => Pelayanan::with('details')->orderBy('order')->orderBy('id')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subtitle' => 'required|string|max:255',
            'description' => 'required|string',
            'image' => 'required|image|mimes:jpeg,png,jpg,webp,avif|max:20480',
        ]);

        $uploaded = CloudinaryImage::upload($request->file('image')->getRealPath(), 'pelayanan');

        Pelayanan::create([
            'title' => $validated['title'],
            'subtitle' => $validated['subtitle'],
            'description' => $validated['description'],
            'image_public_id' => $uploaded['public_id'],
            'image_url' => $uploaded['url'],
            'order' => (Pelayanan::max('order') ?? 0) + 1,
        ]);

        return redirect()->route('pelayanan')->with('success', 'Pelayanan berhasil ditambahkan.');
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

    public function updateImage(Request $request, Pelayanan $pelayanan)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,webp,avif|max:20480',
        ]);

        CloudinaryImage::delete($pelayanan->image_public_id);

        $uploaded = CloudinaryImage::upload($request->file('image')->getRealPath(), 'pelayanan');

        $pelayanan->update([
            'image_public_id' => $uploaded['public_id'],
            'image_url' => $uploaded['url'],
        ]);

        return redirect()->route('pelayanan')->with('success', 'Gambar pelayanan berhasil diperbarui.');
    }

    public function destroy(Pelayanan $pelayanan)
    {
        CloudinaryImage::delete($pelayanan->image_public_id);
        $pelayanan->delete(); // details cascade via FK

        return redirect()->route('pelayanan')->with('success', 'Pelayanan berhasil dihapus.');
    }

    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer',
        ]);

        foreach ($validated['ids'] as $index => $id) {
            Pelayanan::where('id', $id)->update(['order' => $index + 1]);
        }

        return redirect()->route('pelayanan')->with('success', 'Urutan pelayanan berhasil diperbarui.');
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
