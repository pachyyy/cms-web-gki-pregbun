import DetailCardsEditor, { type DetailItem, type DetailPayload } from '@/components/pelayanan/detail-cards-editor';
import SortablePelayananList from '@/components/pelayanan/sortable-pelayanan-list';
import ImageCropperDialog from '@/components/kebaktian/image-cropper-dialog';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ImagePlus, Plus, Trash2 } from 'lucide-react';
import { ChangeEvent, FormEventHandler, useRef, useState } from 'react';

interface PelayananItem {
    id: number;
    title: string;
    subtitle: string;
    description: string;
    image_public_id: string;
    image_url: string;
    order: number;
    details: DetailItem[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pelayanan',
        href: '/pelayanan',
    },
];

const ASPECT = 4 / 3;

export default function PelayananPage({ pelayanan }: { pelayanan: PelayananItem[] }) {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [adding, setAdding] = useState(false);

    const selected = adding ? null : (pelayanan.find((p) => p.id === selectedId) ?? null);

    const reorder = (ids: number[]) => {
        router.put(route('pelayanan.reorder'), { ids }, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pelayanan" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Pelayanan</h1>
                    <p className="text-sm text-muted-foreground">Kelola daftar pelayanan yang tampil di halaman Pelayanan.</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
                    <Card>
                        <CardContent className="space-y-4 p-4">
                            <Button
                                className="w-full"
                                onClick={() => {
                                    setAdding(true);
                                    setSelectedId(null);
                                }}
                            >
                                <Plus className="h-4 w-4" /> Tambah Pelayanan
                            </Button>

                            {pelayanan.length > 0 ? (
                                <SortablePelayananList
                                    items={pelayanan}
                                    selectedId={selectedId}
                                    onSelect={(id) => {
                                        setAdding(false);
                                        setSelectedId(id);
                                    }}
                                    onReorder={reorder}
                                />
                            ) : (
                                <p className="py-6 text-center text-sm text-muted-foreground">Belum ada pelayanan.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            {adding ? (
                                <PelayananNewForm onDone={() => setAdding(false)} />
                            ) : selected ? (
                                <PelayananEditForm key={selected.id} item={selected} onDeleted={() => setSelectedId(null)} />
                            ) : (
                                <div className="flex h-full min-h-48 items-center justify-center text-center text-sm text-muted-foreground">
                                    Pilih pelayanan di sebelah kiri untuk mengubah, atau klik “Tambah Pelayanan”.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

function PelayananNewForm({ onDone }: { onDone: () => void }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        subtitle: '',
        description: '',
        image: null as File | null,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const onPickFile = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setCropSrc(URL.createObjectURL(file));
        e.target.value = '';
    };

    const onCropped = (blob: Blob) => {
        setData('image', new File([blob], 'pelayanan.jpg', { type: 'image/jpeg' }));
        setPreview(URL.createObjectURL(blob));
        setCropSrc(null);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('pelayanan.store'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setPreview(null);
                onDone();
            },
        });
    };

    const canSubmit = !processing && data.title && data.subtitle && data.description && data.image;

    return (
        <form onSubmit={submit} className="space-y-4">
            <h2 className="font-semibold">Tambah Pelayanan</h2>

            <ImageField preview={preview} onPick={() => fileInputRef.current?.click()} />
            <InputError message={errors.image} />

            <CoreFields data={data} setData={setData} errors={errors} />

            <p className="text-xs text-muted-foreground">Kartu detail (Konselor, Jadwal, dll.) dapat ditambahkan setelah pelayanan disimpan.</p>

            <div className="flex gap-2">
                <Button type="submit" disabled={!canSubmit}>
                    Simpan
                </Button>
                <Button type="button" variant="outline" onClick={onDone}>
                    Batal
                </Button>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
            <ImageCropperDialog open={cropSrc !== null} imageSrc={cropSrc} aspect={ASPECT} onClose={() => setCropSrc(null)} onCropped={onCropped} />
        </form>
    );
}

function PelayananEditForm({ item, onDeleted }: { item: PelayananItem; onDeleted: () => void }) {
    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        title: item.title,
        subtitle: item.subtitle,
        description: item.description,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [savingDetails, setSavingDetails] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('pelayanan.update', item.id), { preserveScroll: true });
    };

    const onPickFile = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setCropSrc(URL.createObjectURL(file));
        e.target.value = '';
    };

    const onCropped = (blob: Blob) => {
        setUploading(true);
        router.post(
            route('pelayanan.image.update', item.id),
            { image: new File([blob], 'pelayanan.jpg', { type: 'image/jpeg' }) },
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => setCropSrc(null),
                onFinish: () => setUploading(false),
            },
        );
    };

    const saveDetails = (payload: DetailPayload[]) => {
        setSavingDetails(true);
        router.put(
            route('pelayanan.details.sync', item.id),
            { details: payload },
            { preserveScroll: true, onFinish: () => setSavingDetails(false) },
        );
    };

    const remove = () => {
        if (confirm(`Hapus pelayanan “${item.title}”?`)) {
            router.delete(route('pelayanan.destroy', item.id), { preserveScroll: true, onSuccess: onDeleted });
        }
    };

    return (
        <div className="space-y-6">
            <form onSubmit={submit} className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold">Ubah Pelayanan</h2>
                    <Button type="button" variant="outline" size="sm" onClick={remove}>
                        <Trash2 className="h-4 w-4 text-destructive" /> Hapus
                    </Button>
                </div>

                <ImageField preview={item.image_url} onPick={() => fileInputRef.current?.click()} uploading={uploading} />

                <CoreFields data={data} setData={setData} errors={errors} />

                <div className="flex items-center gap-3">
                    <Button type="submit" disabled={processing || !data.title || !data.subtitle || !data.description}>
                        Simpan
                    </Button>
                    {recentlySuccessful && <span className="text-sm text-muted-foreground">Tersimpan</span>}
                </div>

                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
                <ImageCropperDialog
                    open={cropSrc !== null}
                    imageSrc={cropSrc}
                    aspect={ASPECT}
                    processing={uploading}
                    onClose={() => setCropSrc(null)}
                    onCropped={onCropped}
                />
            </form>

            <div className="space-y-3 border-t pt-4">
                <div>
                    <h3 className="font-semibold">Kartu Detail</h3>
                    <p className="text-sm text-muted-foreground">Label tebal + isi (mis. KONSELOR, JADWAL, LOKASI). Seret untuk mengatur urutan.</p>
                </div>
                <DetailCardsEditor details={item.details} onSave={saveDetails} saving={savingDetails} />
            </div>
        </div>
    );
}

type CoreData = {
    title: string;
    subtitle: string;
    description: string;
};

function CoreFields({
    data,
    setData,
    errors,
}: {
    data: CoreData;
    setData: (key: keyof CoreData, value: string) => void;
    errors: Partial<Record<string, string>>;
}) {
    return (
        <>
            <div className="grid gap-2">
                <Label htmlFor="title">Judul</Label>
                <Input id="title" value={data.title} onChange={(e) => setData('title', e.target.value)} placeholder="Konseling Anugrah" required />
                <InputError message={errors.title} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="subtitle">Subjudul</Label>
                <Input
                    id="subtitle"
                    value={data.subtitle}
                    onChange={(e) => setData('subtitle', e.target.value)}
                    placeholder="Pendampingan pastoral & psikologis"
                    required
                />
                <InputError message={errors.subtitle} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">Deskripsi</Label>
                <textarea
                    id="description"
                    rows={6}
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    placeholder="Tekan Enter untuk paragraf baru."
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                />
                <InputError message={errors.description} />
            </div>
        </>
    );
}

function ImageField({ preview, uploading, onPick }: { preview: string | null; uploading?: boolean; onPick: () => void }) {
    return (
        <div className="flex items-end gap-4">
            <div className="aspect-[4/3] w-44 shrink-0 overflow-hidden rounded-lg border bg-muted">
                {preview ? (
                    <img src={preview} alt="" className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Rasio 4:3</div>
                )}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={onPick} disabled={uploading}>
                <ImagePlus className="h-4 w-4" /> {uploading ? 'Mengunggah...' : preview ? 'Ubah Gambar' : 'Pilih Gambar'}
            </Button>
        </div>
    );
}
