export interface CropArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.src = url;
    });
}

/**
 * Renders the selected crop area of an image onto a canvas and returns it as a
 * JPEG blob, ready to be uploaded via FormData.
 *
 * The output is downscaled so its width never exceeds `maxWidth` (Cloudinary
 * delivers at 1920px anyway), which keeps the upload payload small — typically
 * a few hundred KB — so it stays under server body-size limits.
 */
export async function getCroppedBlob(imageSrc: string, crop: CropArea, maxWidth = 1920): Promise<Blob> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Could not get canvas context');
    }

    const scale = crop.width > maxWidth ? maxWidth / crop.width : 1;
    canvas.width = Math.round(crop.width * scale);
    canvas.height = Math.round(crop.height * scale);

    // When the user zooms out to fit the whole image, the crop rectangle extends
    // past the image bounds. JPEG has no transparency, so paint a white backdrop
    // first to keep those letterbox margins clean instead of black.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('Canvas is empty'))),
            'image/jpeg',
            0.82,
        );
    });
}
