<?php

namespace App\Http\Requests;

use App\Models\Event;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

abstract class EventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * `day` and `event_date` are mutually exclusive and driven by `type`. Null
     * the irrelevant one *before* validation so a payload still carrying a
     * stale field can never persist it. This is the server-side half of the
     * fix for a bug where the inline edit form used to seed day = 'Senin' for
     * spesial rows and, on save, flip them into the Mingguan list.
     */
    protected function prepareForValidation(): void
    {
        $type = $this->input('type');

        $this->merge([
            'day' => $type === Event::TYPE_MINGGUAN ? $this->input('day') : null,
            'event_date' => $type === Event::TYPE_SPESIAL ? ($this->input('event_date') ?: null) : null,
            'end_time' => $this->input('end_time') ?: null,
            'details' => $this->input('details') ?: null,
            'contact' => $this->input('contact') ?: null,
        ]);
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in([Event::TYPE_MINGGUAN, Event::TYPE_SPESIAL])],
            'day' => ['nullable', 'required_if:type,'.Event::TYPE_MINGGUAN, Rule::in(Event::DAYS)],
            'event_date' => ['nullable', 'required_if:type,'.Event::TYPE_SPESIAL, 'date_format:Y-m-d'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i', 'after:start_time'],
            'location' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'details' => ['nullable', 'string'],
            'contact' => ['nullable', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'required' => ':attribute wajib diisi.',
            'max' => ':attribute maksimal :max karakter.',
            'type.in' => 'Jenis kegiatan tidak valid.',
            'day.required_if' => 'Hari wajib dipilih untuk kegiatan rutin mingguan.',
            'day.in' => 'Hari tidak valid.',
            'event_date.required_if' => 'Tanggal wajib dipilih untuk event spesial.',
            'event_date.date_format' => 'Format tanggal tidak valid.',
            'start_time.date_format' => 'Jam mulai harus dalam format 24 jam, contoh 07:30.',
            'end_time.date_format' => 'Jam selesai harus dalam format 24 jam, contoh 09:00.',
            'end_time.after' => 'Jam selesai harus lebih besar dari jam mulai.',
        ];
    }

    public function attributes(): array
    {
        return [
            'title' => 'Judul',
            'type' => 'Jenis kegiatan',
            'day' => 'Hari',
            'event_date' => 'Tanggal',
            'start_time' => 'Jam mulai',
            'end_time' => 'Jam selesai',
            'location' => 'Lokasi',
            'description' => 'Deskripsi',
            'details' => 'Detail tambahan',
            'contact' => 'Kontak',
            'category' => 'Kategori',
        ];
    }
}
