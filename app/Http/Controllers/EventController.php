<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEventRequest;
use App\Http\Requests\UpdateEventRequest;
use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EventController extends Controller
{
    public function index()
    {
        return Inertia::render('event', [
            'event' => Event::orderBy('created_at')->get(),
        ]);
    }

    public function store(StoreEventRequest $request)
    {
        $event = Event::create($request->validated());

        return redirect()->route('event')
            ->with('success', 'Kegiatan berhasil ditambahkan.')
            ->with('createdId', $event->id);
    }

    public function update(UpdateEventRequest $request, Event $event)
    {
        $event->update($request->validated());

        return redirect()->route('event')->with('success', 'Kegiatan berhasil diperbarui.');
    }

    public function destroy(Event $event)
    {
        if ($event->image_public_id) {
            cloudinary()->uploadApi()->destroy($event->image_public_id);
        }

        $event->delete();

        return redirect()->route('event')->with('success', 'Kegiatan berhasil dihapus.');
    }

    public function storeImage(Request $request, Event $event)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,webp,avif|max:20480',
        ]);

        if ($event->image_public_id) {
            cloudinary()->uploadApi()->destroy($event->image_public_id);
        }

        $uploaded = $this->uploadOptimized($request->file('image')->getRealPath(), 'event/'.$event->id);

        $event->update([
            'image_public_id' => $uploaded['public_id'],
            'image_url' => $uploaded['url'],
        ]);

        return redirect()->route('event')->with('success', 'Gambar berhasil disimpan.');
    }

    public function destroyImage(Event $event)
    {
        if ($event->image_public_id) {
            cloudinary()->uploadApi()->destroy($event->image_public_id);
        }

        $event->update([
            'image_public_id' => null,
            'image_url' => null,
        ]);

        return redirect()->route('event')->with('success', 'Gambar berhasil dihapus.');
    }

    /**
     * Upload a file to Cloudinary and return its public id plus an optimized
     * delivery URL. Identical to the helper in PersembahanController /
     * KebaktianController — worth extracting to a shared trait if a fourth
     * controller ends up needing this.
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