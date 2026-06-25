<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePersembahanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'slug' => ['required', 'string', 'max:255', 'alpha_dash', 'unique:persembahans,slug'],
            'title' => ['required', 'string', 'max:255'],
            'entity' => ['required', 'string', 'max:255'],
            'bank' => ['required', 'string', 'max:255'],
            'rekening' => ['required', 'string', 'max:255'],
            'display_rekening' => ['required', 'string', 'max:255'],
        ];
    }
}