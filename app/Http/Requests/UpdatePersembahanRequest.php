<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePersembahanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Slug is intentionally excluded: it's used as a stable key and
        // should not change after creation (e.g. nothing else references it
        // by id, the frontend keys off slug).
        return [
            'title' => ['required', 'string', 'max:255'],
            'entity' => ['required', 'string', 'max:255'],
            'bank' => ['required', 'string', 'max:255'],
            'rekening' => ['required', 'string', 'max:255'],
            'display_rekening' => ['required', 'string', 'max:255'],
        ];
    }
}