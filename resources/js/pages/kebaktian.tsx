import InputError from '@/components/input-error';
import ImageCropperDialog from '@/components/kebaktian/image-cropper-dialog';
import SortableImageGrid from '@/components/kebaktian/sortable-image-grid';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ImagePlus, Plus, Trash2 } from 'lucide-react';
import { ChangeEvent, FormEventHandler, useRef, useState } from 'react';

interface KebaktianImage {
    id: number;
    url: string;
    public_id: string;
    order: number;
}

interface Kebaktian {
    id: number;
    slug: string;
    title: string;
    description: string | null;
    schedules: string[] | null;
    location: string | null;
    audience: string | null;
    youtube_url: string | null;
    home_image_public_id: string | null;
    home_image_url: string | null;
    home_subtitle: string | null;
    images: KebaktianImage[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Kebaktian',
        href: '/kebaktian',
    },
];

const HOME_TAB = 'home';

export default function KebaktianPage({ kebaktians, maxImages }: { kebaktians: Kebaktian[]; maxImages: number }) {
    const [activeSlug, setActiveSlug] = useState<string>(HOME_TAB);
    const tabs = [{ slug: HOME_TAB, title: 'Tampilan Home' }, ...kebaktians.map((k) => ({ slug: k.slug, title: k.title }))];
    const activeKebaktian = kebaktians.find((k) => k.slug === activeSlug);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kebaktian" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Kebaktian</h1>
                    <p className="text-sm text-muted-foreground">Kelola gambar dan informasi untuk tiap jenis kebaktian.</p>
                </div>

                <div className="flex flex-wrap gap-1 border-b">
                    {tabs.map((t) => (
                        <button
                            key={t.slug}
                            onClick={() => setActiveSlug(t.slug)}
                            className={cn(
                                'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
                                activeSlug === t.slug
                                    ? 'border-primary text-foreground'
                                    : 'border-transparent text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {t.title}
                        </button>
                    ))}
                </div>

                {activeSlug === HOME_TAB ? (
                    <HomeViewEditor kebaktians={kebaktians} />
                ) : (
                    activeKebaktian && <KebaktianEditor key={activeKebaktian.id} kebaktian={activeKebaktian} maxImages={maxImages} />
                )}
            </div>
        </AppLayout>
    );
}

function HomeViewEditor({ kebaktians }: { kebaktians: Kebaktian[] }) {
    const umum = kebaktians.find((k) => k.slug === 'umum');
    const others = kebaktians.filter((k) => k.slug !== 'umum');

    return (
        <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
                Kelola gambar dan keterangan waktu yang tampil di halaman utama (Jadwal Ibadah). Judul kartu sudah tetap.
            </p>

            {umum && <HomeCardEditor key={umum.id} kebaktian={umum} aspect={16 / 9} aspectLabel="16:9" />}

            <div className="grid gap-6 md:grid-cols-3">
                {others.map((k) => (
                    <HomeCardEditor key={k.id} kebaktian={k} aspect={4 / 3} aspectLabel="4:3" />
                ))}
            </div>
        </div>
    );
}

function HomeCardEditor({ kebaktian, aspect, aspectLabel }: { kebaktian: Kebaktian; aspect: number; aspectLabel: string }) {
    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        home_subtitle: kebaktian.home_subtitle ?? '',
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('kebaktian.home.update', kebaktian.id), { preserveScroll: true });
    };

    const onPickFile = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setCropSrc(URL.createObjectURL(file));
        e.target.value = '';
    };

    const onCropped = (blob: Blob) => {
        setUploading(true);
        const file = new File([blob], 'home.jpg', { type: 'image/jpeg' });
        router.post(
            route('kebaktian.home-image.store', kebaktian.id),
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
        if (confirm('Hapus gambar tampilan home ini?')) {
            router.delete(route('kebaktian.home-image.destroy', kebaktian.id), { preserveScroll: true });
        }
    };

    return (
        <Card>
            <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{kebaktian.title}</h3>
                    <span className="text-xs text-muted-foreground">Rasio {aspectLabel}</span>
                </div>

                <div className="overflow-hidden rounded-lg border bg-muted" style={{ aspectRatio: aspect }}>
                    {kebaktian.home_image_url ? (
                        <img src={kebaktian.home_image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Belum ada gambar</div>
                    )}
                </div>

                <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={() => fileInputRef.current?.click()}>
                        <ImagePlus className="h-4 w-4" /> {kebaktian.home_image_url ? 'Ubah Gambar' : 'Tambah Gambar'}
                    </Button>
                    {kebaktian.home_image_url && (
                        <Button type="button" size="sm" variant="outline" onClick={removeImage}>
                            <Trash2 className="h-4 w-4" /> Hapus
                        </Button>
                    )}
                </div>

                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />

                <form onSubmit={submit} className="space-y-2">
                    <Label htmlFor={`home_subtitle_${kebaktian.id}`}>Keterangan Waktu</Label>
                    <Input
                        id={`home_subtitle_${kebaktian.id}`}
                        value={data.home_subtitle}
                        placeholder="07.30 · 10.00 · 17.00 WIB"
                        onChange={(e) => setData('home_subtitle', e.target.value)}
                    />
                    <InputError message={errors.home_subtitle} />
                    <div className="flex items-center gap-3 pt-1">
                        <Button type="submit" size="sm" disabled={processing}>
                            Simpan
                        </Button>
                        {recentlySuccessful && <span className="text-sm text-muted-foreground">Tersimpan</span>}
                    </div>
                </form>

                <ImageCropperDialog
                    open={cropSrc !== null}
                    imageSrc={cropSrc}
                    aspect={aspect}
                    processing={uploading}
                    onClose={() => setCropSrc(null)}
                    onCropped={onCropped}
                />
            </CardContent>
        </Card>
    );
}

function KebaktianEditor({ kebaktian, maxImages }: { kebaktian: Kebaktian; maxImages: number }) {
    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        description: kebaktian.description ?? '',
        schedules: kebaktian.schedules ?? [],
        location: kebaktian.location ?? '',
        audience: kebaktian.audience ?? '',
        youtube_url: kebaktian.youtube_url ?? '',
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('kebaktian.update', kebaktian.id), { preserveScroll: true });
    };

    const onPickFile = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setCropSrc(URL.createObjectURL(file));
        e.target.value = ''; // allow picking the same file again
    };

    const onCropped = (blob: Blob) => {
        setUploading(true);
        const file = new File([blob], 'kebaktian.jpg', { type: 'image/jpeg' });
        router.post(
            route('kebaktian.images.store', kebaktian.id),
            { image: file },
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => setCropSrc(null),
                onFinish: () => setUploading(false),
            },
        );
    };

    const reorder = (ids: number[]) => {
        router.put(route('kebaktian.images.reorder', kebaktian.id), { ids }, { preserveScroll: true });
    };

    const deleteImage = (id: number) => {
        if (confirm('Hapus gambar ini?')) {
            router.delete(route('kebaktian.images.destroy', id), { preserveScroll: true });
        }
    };

    const atMax = kebaktian.images.length >= maxImages;

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
                <CardContent className="space-y-4 p-6">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold">
                            Galeri Foto ({kebaktian.images.length}/{maxImages})
                        </h2>
                        <Button type="button" size="sm" disabled={atMax} onClick={() => fileInputRef.current?.click()}>
                            <Plus className="h-4 w-4" /> Tambah Gambar
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Seret untuk mengatur urutan. Gambar pertama menjadi foto utama. {atMax && 'Batas gambar tercapai.'}
                    </p>

                    {kebaktian.images.length > 0 ? (
                        <SortableImageGrid images={kebaktian.images} onReorder={reorder} onDelete={deleteImage} />
                    ) : (
                        <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                            Belum ada gambar.
                        </div>
                    )}

                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="description">Deskripsi</Label>
                            <textarea
                                id="description"
                                rows={4}
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                            />
                            <InputError message={errors.description} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Jadwal</Label>
                            {data.schedules.map((schedule, index) => (
                                <div key={index} className="flex gap-2">
                                    <Input
                                        value={schedule}
                                        placeholder="MINGGU - 10.00 WIB"
                                        onChange={(e) => {
                                            const next = [...data.schedules];
                                            next[index] = e.target.value;
                                            setData('schedules', next);
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        aria-label="Hapus jadwal"
                                        onClick={() => setData('schedules', data.schedules.filter((_, i) => i !== index))}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-fit"
                                onClick={() => setData('schedules', [...data.schedules, ''])}
                            >
                                <Plus className="h-4 w-4" /> Tambah Jadwal
                            </Button>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="location">Lokasi</Label>
                            <Input id="location" value={data.location} onChange={(e) => setData('location', e.target.value)} />
                            <InputError message={errors.location} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="audience">Sasaran</Label>
                            <Input id="audience" value={data.audience} onChange={(e) => setData('audience', e.target.value)} />
                            <InputError message={errors.audience} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="youtube_url">Link YouTube (opsional)</Label>
                            <Input
                                id="youtube_url"
                                type="url"
                                placeholder="https://youtube.com/..."
                                value={data.youtube_url}
                                onChange={(e) => setData('youtube_url', e.target.value)}
                            />
                            <InputError message={errors.youtube_url} />
                            <p className="text-xs text-muted-foreground">
                                Ditampilkan di situs publik hanya bila diisi (mis. Kebaktian Umum & Pemuda).
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button type="submit" disabled={processing}>
                                Simpan Informasi
                            </Button>
                            {recentlySuccessful && <span className="text-sm text-muted-foreground">Tersimpan</span>}
                        </div>
                    </form>
                </CardContent>
            </Card>

            <ImageCropperDialog
                open={cropSrc !== null}
                imageSrc={cropSrc}
                processing={uploading}
                onClose={() => setCropSrc(null)}
                onCropped={onCropped}
            />
        </div>
    );
}
