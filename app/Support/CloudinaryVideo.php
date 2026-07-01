<?php

namespace App\Support;

class CloudinaryVideo
{
    /**
     * Upload a local video file to Cloudinary and return its public id plus an
     * auto-quality delivery URL. Videos require resource_type => 'video'.
     *
     * @return array{public_id: string, url: string}
     */
    public static function upload(string $path, string $folder): array
    {
        $response = cloudinary()->uploadApi()->upload($path, [
            'folder' => $folder,
            'resource_type' => 'video',
        ]);

        return [
            'public_id' => $response['public_id'],
            'url' => str_replace(
                '/video/upload/',
                '/video/upload/q_auto/',
                $response['secure_url']
            ),
        ];
    }

    /**
     * Delete a video asset from Cloudinary by public id.
     */
    public static function delete(?string $publicId): void
    {
        if ($publicId) {
            cloudinary()->uploadApi()->destroy($publicId, ['resource_type' => 'video']);
        }
    }
}
