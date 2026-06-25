import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { getCroppedBlob } from '@/lib/crop-image';
import { useCallback, useEffect, useState } from 'react';
import Cropper, { type Area, type MediaSize } from 'react-easy-crop';

// Lowest the zoom slider can go. Not 0 — at 0 the image scales to nothing and
// the crop math breaks; 0.1 already lets the user shrink the image far past the
// frame so anything can be fully fit.
const MIN_ZOOM = 1;

interface Props {
    open: boolean;
    imageSrc: string | null;
    processing?: boolean;
    aspect?: number;
    onClose: () => void;
    onCropped: (blob: Blob) => void;
}

export default function ImageCropperDialog({ open, imageSrc, processing, aspect = 4 / 3, onClose, onCropped }: Props) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [area, setArea] = useState<Area | null>(null);

    // Reset the framing whenever a new image is chosen.
    useEffect(() => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setArea(null);
    }, [imageSrc]);

    // Once the image is known, start at the "fit" zoom so the whole image is
    // visible (letterboxed) with nothing shaved — fit = 1 when the image already
    // matches the target aspect. The slider can still go down to MIN_ZOOM, so the
    // user can always pull the entire image in even if it's slightly off-aspect.
    const handleMediaLoaded = useCallback(
        ({ naturalWidth, naturalHeight }: MediaSize) => {
            const mediaAspect = naturalWidth / naturalHeight;
            const fit = Math.min(aspect, mediaAspect) / Math.max(aspect, mediaAspect);
            setZoom(Math.max(fit, MIN_ZOOM));
            setCrop({ x: 0, y: 0 });
        },
        [aspect],
    );

    const handleSave = async () => {
        if (!imageSrc || !area) return;
        const blob = await getCroppedBlob(imageSrc, area);
        onCropped(blob);
    };

    return (
        <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Sesuaikan Gambar</DialogTitle>
                    <DialogDescription>Geser dan perbesar untuk menentukan bagian gambar yang ditampilkan.</DialogDescription>
                </DialogHeader>

                <div className="relative h-72 w-full overflow-hidden rounded-md bg-muted">
                    {imageSrc && (
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            minZoom={MIN_ZOOM}
                            aspect={aspect}
                            objectFit="contain"
                            restrictPosition={false}
                            onMediaLoaded={handleMediaLoaded}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={(_, areaPixels) => setArea(areaPixels)}
                        />
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="zoom">Zoom</Label>
                    <input
                        id="zoom"
                        type="range"
                        min={MIN_ZOOM}
                        max={3}
                        step={0.01}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                    />
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                        Batal
                    </Button>
                    <Button type="button" onClick={handleSave} disabled={processing || !area}>
                        {processing ? 'Mengunggah...' : 'Simpan Gambar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
