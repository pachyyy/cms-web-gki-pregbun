import InputError from '@/components/input-error';
import ImageCropperDialog from '@/components/kebaktian/image-cropper-dialog';
import SortablePersembahanList from '@/components/sortable-persembahan-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ImagePlus, Plus, Trash2 } from 'lucide-react';
import { ChangeEvent, FormEventHandler, useRef, useState } from 'react';

interface PersembahanItem {
    id: number;
    title: string;
    entity: string;
    bank: string;
    rekening: string;
    display_rekening: string;
    qr_public_id: string | null;
    qr_url: string | null;
    order: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Persembahan',
        href: '/persembahan',
    },
];

export default function PersembahanPage({ items, heroImageUrl }: { items: PersembahanItem[]; heroImageUrl: string | null }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Persembahan" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Persembahan</h1>
                    <p className="text-sm text-muted-foreground">
                        Kelola gambar hero dan daftar rekening/QRIS yang tampil di halaman Persembahan.
                    </p>
                </div>

                <HeroImageEditor heroImageUrl={heroImageUrl} />

                <ItemsManager items={items} />
            </div>
        </AppLayout>
    );
}

function HeroImageEditor({ heroImageUrl }: { heroImageUrl: string | null }) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const onPickFile = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setCropSrc(URL.createObjectURL(file));
        e.target.value = '';
    };

    const onCropped = (blob: Blob) => {
        setUploading(true);
        const file = new File([blob], 'hero.jpg', { type: 'image/jpeg' });
        router.post(
            route('persembahan.hero-image.store'),
            { image: file },
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => setCropSrc(null),
                onFinish: () => setUploading(false),
            },
        );
    };

    const removeImage = () => {
        if (confirm('Hapus gambar hero ini?')) {
            router.delete(route('persembahan.hero-image.destroy'), { preserveScroll: true });
        }
    };

    return (
        <Card>
            <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Gambar Hero</h3>
                    <span className="text-xs text-muted-foreground">Rasio 16:9 disarankan</span>
                </div>

                <div className="overflow-hidden rounded-lg border bg-muted" style={{ aspectRatio: 16 / 9 }}>
                    {heroImageUrl ? (
                        <img src={heroImageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Belum ada gambar</div>
                    )}
                </div>

                <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={() => fileInputRef.current?.click()}>
                        <ImagePlus className="h-4 w-4" /> {heroImageUrl ? 'Ubah Gambar' : 'Tambah Gambar'}
                    </Button>
                    {heroImageUrl && (
                        <Button type="button" size="sm" variant="outline" onClick={removeImage}>
                            <Trash2 className="h-4 w-4" /> Hapus
                        </Button>
                    )}
                </div>

                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />

                <ImageCropperDialog
                    open={cropSrc !== null}
                    imageSrc={cropSrc}
                    aspect={16 / 9}
                    processing={uploading}
                    onClose={() => setCropSrc(null)}
                    onCropped={onCropped}
                />
            </CardContent>
        </Card>
    );
}

function ItemsManager({ items }: { items: PersembahanItem[] }) {
    const [showCreate, setShowCreate] = useState(false);

    const reorder = (ids: number[]) => {
        router.put(route('persembahan.reorder'), { ids }, { preserveScroll: true });
    };

    return (
        <Card>
            <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold">Daftar Item ({items.length})</h2>
                    <Button type="button" size="sm" onClick={() => setShowCreate((v) => !v)}>
                        <Plus className="h-4 w-4" /> Tambah Item
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground">Seret untuk mengatur urutan tampil di halaman publik.</p>

                {showCreate && <CreatePersembahanForm onDone={() => setShowCreate(false)} />}

                {items.length > 0 ? (
                    <SortablePersembahanList items={items} onReorder={reorder} />
                ) : (
                    <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">Belum ada item.</div>
                )}
            </CardContent>
        </Card>
    );
}

function CreatePersembahanForm({ onDone }: { onDone: () => void }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        entity: '',
        bank: '',
        rekening: '',
        display_rekening: '',
    });

    // QR upload is handled separately from the rest of the form: the item
    // must exist (have an id) before an image can be attached to it via
    // persembahan.qr-image.store. So we create the item first, then — if a
    // QR file was selected — immediately upload it using the id the backend
    // flashes back to us for the row it just created.
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const [qrBlob, setQrBlob] = useState<Blob | null>(null);
    const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const onPickFile = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setCropSrc(URL.createObjectURL(file));
        e.target.value = '';
    };

    const onCropped = (blob: Blob) => {
        setQrBlob(blob);
        setQrPreviewUrl(URL.createObjectURL(blob));
        setCropSrc(null);
    };

    const removeQr = () => {
        setQrBlob(null);
        setQrPreviewUrl(null);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('persembahan.store'), {
            preserveScroll: true,
            onSuccess: (page) => {
                // The controller flashes the new row's id via with('createdId', ...).
                // Adjust this if your shared Inertia props expose flash data under
                // a different key (e.g. page.props.flash.createdId).
                const createdId = (page.props as { createdId?: number }).createdId;

                reset();

                if (qrBlob && createdId) {
                    setUploading(true);
                    const file = new File([qrBlob], 'qr.jpg', { type: 'image/jpeg' });
                    router.post(
                        route('persembahan.qr-image.store', createdId),
                        { image: file },
                        {
                            forceFormData: true,
                            preserveScroll: true,
                            onFinish: () => {
                                setUploading(false);
                                setQrBlob(null);
                                setQrPreviewUrl(null);
                                onDone();
                            },
                        },
                    );
                } else {
                    onDone();
                }
            },
        });
    };

    return (
        <form onSubmit={submit} className="grid gap-3 rounded-lg border p-4 md:grid-cols-2">
            <div className="grid gap-2">
                <Label htmlFor="title">Judul</Label>
                <Input id="title" value={data.title} onChange={(e) => setData('title', e.target.value)} />
                <InputError message={errors.title} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="entity">Atas Nama</Label>
                <Input
                    id="entity"
                    value={data.entity}
                    onChange={(e) => setData('entity', e.target.value)}
                />
                <InputError message={errors.entity} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="bank">Bank</Label>
                <Input id="bank" value={data.bank} onChange={(e) => setData('bank', e.target.value)} />
                <InputError message={errors.bank} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="rekening">No. Rekening (tanpa titik)</Label>
                <Input
                    id="rekening"
                    value={data.rekening}
                    onChange={(e) => setData('rekening', e.target.value)}
                />
                <InputError message={errors.rekening} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="display_rekening">No. Rekening (tampilan)</Label>
                <Input
                    id="display_rekening"
                    value={data.display_rekening}
                    onChange={(e) => setData('display_rekening', e.target.value)}
                />
                <InputError message={errors.display_rekening} />
            </div>

            <div className="grid gap-2 md:col-span-2">
                <Label>QR Code (opsional)</Label>
                <div className="flex items-center gap-4">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border bg-muted">
                        {qrPreviewUrl ? (
                            <img src={qrPreviewUrl} alt="" className="h-full w-full object-contain" />
                        ) : (
                            <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">Belum ada</div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                            <ImagePlus className="h-4 w-4" /> {qrPreviewUrl ? 'Ubah' : 'Pilih QR'}
                        </Button>
                        {qrPreviewUrl && (
                            <Button type="button" size="sm" variant="outline" onClick={removeQr}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">Bisa juga ditambahkan nanti setelah item dibuat.</p>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
            </div>

            <div className="flex items-center gap-3 md:col-span-2">
                <Button type="submit" size="sm" disabled={processing || uploading}>
                    {uploading ? 'Mengunggah QR...' : 'Simpan'}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={onDone}>
                    Batal
                </Button>
            </div>

            <ImageCropperDialog
                open={cropSrc !== null}
                imageSrc={cropSrc}
                aspect={1}
                processing={false}
                onClose={() => setCropSrc(null)}
                onCropped={onCropped}
            />
        </form>
    );
}