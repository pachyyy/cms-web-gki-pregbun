<?php

namespace App\Http\Controllers;

use App\Models\PembangunanImage;
use App\Models\PembangunanUpdate;
use App\Models\PembangunanVideo;
use App\Support\CloudinaryImage;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PembangunanController extends Controller
{
    private const MAX_IMAGES = 5;

    public function index()
    {
        $history = PembangunanUpdate::query()
            ->orderByDesc('update_date')
            ->orderByDesc('id')
            ->get();

        return Inertia::render('pembangunan', [
            'latest' => $history->first(),
            'history' => $history,
            'videos' => PembangunanVideo::orderByDesc('created_at')->orderByDesc('id')->get(),
            'images' => PembangunanImage::orderBy('order')->get(),
            'maxImages' => self::MAX_IMAGES,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'update_date' => 'required|date',
            'target_persembahan' => 'required|integer|min:0',
            'persembahan_pembangunan' => 'required|integer|min:0',
            'janji_iman_terealisasi' => 'required|integer|min:0',
            'janji_iman_belum_terealisasi' => 'required|integer|min:0',
            'rincian_start_date' => 'required|date',
            'rincian_end_date' => 'required|date|after_or_equal:rincian_start_date',
        ]);

        PembangunanUpdate::create($validated);

        return redirect()->route('pembangunan')->with('success', 'Data pembangunan berhasil diperbarui.');
    }

    public function destroy(PembangunanUpdate $pembangunanUpdate)
    {
        $pembangunanUpdate->delete();

        return redirect()->route('pembangunan')->with('success', 'Update pembangunan berhasil dihapus.');
    }

    public function storeVideo(Request $request)
    {
        $validated = $request->validate([
            'youtube_url' => 'required|url|max:2048',
        ]);

        // Each save adds a new dated history row (latest by created_at = live).
        PembangunanVideo::create([
            'youtube_url' => $validated['youtube_url'],
            'youtube_embed_url' => $this->toYoutubeEmbed($validated['youtube_url']),
        ]);

        return redirect()->route('pembangunan')->with('success', 'Link YouTube berhasil diperbarui.');
    }

    public function destroyVideo(PembangunanVideo $video)
    {
        $video->delete();

        return redirect()->route('pembangunan')->with('success', 'Link YouTube berhasil dihapus.');
    }

    public function storeImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,webp,avif|max:20480',
        ]);

        if (PembangunanImage::count() >= self::MAX_IMAGES) {
            return redirect()->route('pembangunan')->withErrors([
                'image' => 'Maksimal '.self::MAX_IMAGES.' gambar.',
            ]);
        }

        $uploaded = CloudinaryImage::upload($request->file('image')->getRealPath(), 'pembangunan');

        PembangunanImage::create([
            'public_id' => $uploaded['public_id'],
            'url' => $uploaded['url'],
            'order' => (PembangunanImage::max('order') ?? 0) + 1,
        ]);

        return redirect()->route('pembangunan')->with('success', 'Gambar berhasil ditambahkan.');
    }

    public function destroyImage(PembangunanImage $image)
    {
        CloudinaryImage::delete($image->public_id);
        $image->delete();

        return redirect()->route('pembangunan')->with('success', 'Gambar berhasil dihapus.');
    }

    public function reorderImages(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer',
        ]);

        foreach ($validated['ids'] as $index => $id) {
            PembangunanImage::where('id', $id)->update(['order' => $index + 1]);
        }

        return redirect()->route('pembangunan')->with('success', 'Urutan gambar berhasil diperbarui.');
    }

    /**
     * Convert a YouTube watch/youtu.be/shorts/live link into an embeddable
     * /embed/ URL. Non-matching URLs are returned unchanged.
     */
    private function toYoutubeEmbed(string $url): string
    {
        if (preg_match('#(?:youtube\.com/(?:watch\?v=|embed/|shorts/|live/)|youtu\.be/)([a-zA-Z0-9_-]{11})#', $url, $matches)) {
            return 'https://www.youtube.com/embed/'.$matches[1];
        }

        return $url;
    }
}
