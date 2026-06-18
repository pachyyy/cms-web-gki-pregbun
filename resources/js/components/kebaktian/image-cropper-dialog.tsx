import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { getCroppedBlob } from '@/lib/crop-image';
import { useEffect, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';

interface Props {
    open: boolean;
    imageSrc: string | null;
    processing?: boolean;
    onClose: () => void;
    onCropped: (blob: Blob) => void;
}

export default function ImageCropperDialog({ open, imageSrc, processing, onClose, onCropped }: Props) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [area, setArea] = useState<Area | null>(null);

    // Reset the framing whenever a new image is chosen.
    useEffect(() => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setArea(null);
    }, [imageSrc]);

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
                    <DialogDescription>Geser dan perbesar untuk menentukan bagian gambar yang ditampilkan (rasio 4:3).</DialogDescription>
                </DialogHeader>

                <div className="relative h-72 w-full overflow-hidden rounded-md bg-muted">
                    {imageSrc && (
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={4 / 3}
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
                        min={1}
                        max={3}
                        step={0.1}
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
