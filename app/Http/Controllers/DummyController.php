<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\Dummy;

class DummyController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
            'content' => 'required',
            'thumbnail' => 'required|image|mimes:jpeg,png,jpg,webp,avif|max:1024',
        ]);

        // 1. Upload file directly to Supabase storage bucket
        $path = $request->file('thumbnail')->store('thumbnails', 'supabase');

        // 2. Get the fully qualified public URL
        $fileUrl = Storage::disk('supabase')->url($path);

        // 3. Save everything to the database
        Dummy::create([
            'title' => $request->title,
            'content' => $request->content,
            'thumbnail_url' => $fileUrl, // Store this URL string
        ]);

        return redirect()->route('dummy')->with('success', 'File Uploaded!');
    }
}
