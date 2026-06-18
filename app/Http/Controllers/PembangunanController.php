<?php

namespace App\Http\Controllers;

use App\Models\PembangunanUpdate;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PembangunanController extends Controller
{
    public function index()
    {
        $history = PembangunanUpdate::query()
            ->orderByDesc('update_date')
            ->orderByDesc('id')
            ->get();

        return Inertia::render('pembangunan', [
            'latest' => $history->first(),
            'history' => $history,
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
}
