<?php

namespace App\Http\Controllers;

use App\Models\HomeSetting;
use App\Support\CloudinaryVideo;
use Illuminate\Http\Request;

class HomeVideoController extends Controller
{
    /**
     * Maps the ratio route segment to its (public_id, url) columns.
     */
    private const RATIOS = [
        '16x9' => ['video_16x9_public_id', 'video_16x9_url'],
        '4x3' => ['video_4x3_public_id', 'video_4x3_url'],
    ];

    public function store(Request $request, string $ratio)
    {
        [$publicIdColumn, $urlColumn] = self::columnsFor($ratio);

        $request->validate([
            // max is in KB: 25600 = 25 MB.
            'video' => 'required|file|mimes:mp4,mov,webm|max:25600',
        ]);

        $setting = HomeSetting::current();

        // Replace the existing video for this ratio.
        CloudinaryVideo::delete($setting->{$publicIdColumn});

        $uploaded = CloudinaryVideo::upload($request->file('video')->getRealPath(), 'home-video');

        $setting->update([
            $publicIdColumn => $uploaded['public_id'],
            $urlColumn => $uploaded['url'],
        ]);

        return redirect()->route('dashboard')->with('success', 'Video berhasil diperbarui.');
    }

    public function destroy(string $ratio)
    {
        [$publicIdColumn, $urlColumn] = self::columnsFor($ratio);

        $setting = HomeSetting::current();

        CloudinaryVideo::delete($setting->{$publicIdColumn});

        $setting->update([
            $publicIdColumn => null,
            $urlColumn => null,
        ]);

        return redirect()->route('dashboard')->with('success', 'Video berhasil dihapus.');
    }

    /**
     * @return array{0: string, 1: string}
     */
    private static function columnsFor(string $ratio): array
    {
        abort_unless(array_key_exists($ratio, self::RATIOS), 404);

        return self::RATIOS[$ratio];
    }
}
