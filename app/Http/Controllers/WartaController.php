<?php

namespace App\Http\Controllers;

use App\Models\Warta;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class WartaController extends Controller
{
    public function index()
    {
        return Inertia::render('dashboard', [
            'warta' => Warta::orderByDesc('service_date')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'service_date' => 'required|date|unique:warta,service_date',
            'title' => 'nullable|string|max:255',
            'source_url' => 'required|url|max:2048',
        ]);

        Warta::create([
            'service_date' => $validated['service_date'],
            'title' => $validated['title'] ?? null,
            'source_url' => $validated['source_url'],
            'url' => $this->toEmbedUrl($validated['source_url']),
        ]);

        return redirect()->route('dashboard')->with('success', 'Warta berhasil ditambahkan.');
    }

    public function update(Request $request, Warta $warta)
    {
        $validated = $request->validate([
            'service_date' => ['required', 'date', Rule::unique('warta', 'service_date')->ignore($warta->id)],
            'title' => 'nullable|string|max:255',
            'source_url' => 'required|url|max:2048',
        ]);

        $warta->update([
            'service_date' => $validated['service_date'],
            'title' => $validated['title'] ?? null,
            'source_url' => $validated['source_url'],
            'url' => $this->toEmbedUrl($validated['source_url']),
        ]);

        return redirect()->route('dashboard')->with('success', 'Warta berhasil diperbarui.');
    }

    public function destroy(Warta $warta)
    {
        $warta->delete();

        return redirect()->route('dashboard')->with('success', 'Warta berhasil dihapus.');
    }

    /**
     * Convert a Google Drive share link into an embeddable /preview URL so the
     * frontend can drop it straight into an iframe. Non-Drive URLs are returned
     * unchanged (assumed to already be embeddable / a direct PDF link).
     */
    private function toEmbedUrl(string $url): string
    {
        // Matches .../file/d/<id>/view, .../open?id=<id>, .../uc?id=<id>, etc.
        if (preg_match('#/file/d/([a-zA-Z0-9_-]+)#', $url, $matches)
            || preg_match('#[?&]id=([a-zA-Z0-9_-]+)#', $url, $matches)) {
            return "https://drive.google.com/file/d/{$matches[1]}/preview";
        }

        return $url;
    }
}
