<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'schedule' => ['required', 'string', 'max:255'],
            'time' => ['required', 'string', 'max:255'],
            'location' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'details' => ['nullable', 'string'],
            'contact' => ['nullable', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
        ];
    }
}