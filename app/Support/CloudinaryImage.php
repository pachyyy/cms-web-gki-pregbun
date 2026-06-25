<?php

namespace App\Support;

class CloudinaryImage
{
    /**
     * Upload a local file to Cloudinary and return its public id plus an
     * optimized delivery URL (width-capped at 1920px, auto quality + format),
     * which keeps the delivered image well under 2MB.
     *
     * @return array{public_id: string, url: string}
     */
    public static function upload(string $path, string $folder): array
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

    /**
     * Delete an asset from Cloudinary by public id.
     */
    public static function delete(?string $publicId): void
    {
        if ($publicId) {
            cloudinary()->uploadApi()->destroy($publicId);
        }
    }
}
