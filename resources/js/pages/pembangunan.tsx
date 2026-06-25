import { DatePicker } from '@/components/date-picker';
import ImageCropperDialog from '@/components/kebaktian/image-cropper-dialog';
import SortableImageGrid from '@/components/kebaktian/sortable-image-grid';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { ChangeEvent, FormEventHandler, useRef, useState } from 'react';

interface PembangunanUpdate {
    id: number;
    update_date: string;
    target_persembahan: number;
    persembahan_pembangunan: number;
    janji_iman_terealisasi: number;
    janji_iman_belum_terealisasi: number;
    rincian_start_date: string;
    rincian_end_date: string;
}

interface PembangunanVideo {
    id: number;
    youtube_url: string;
    youtube_embed_url: string;
    created_at: string;
}

interface PembangunanImage {
    id: number;
    public_id: string;
    url: string;
    order: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pembangunan',
        href: '/pembangunan',
    },
];

// --- helpers ---------------------------------------------------------------

const toDateInput = (iso: string) => (iso ? iso.slice(0, 10) : '');

const today = () => new Date().toISOString().slice(0, 10);

const formatNumber = (n: number) => n.toLocaleString('id-ID');

const formatRupiah = (n: number) => `Rp ${formatNumber(n)}`;

const parseDigits = (s: string) => {
    const digits = s.replace(/\D/g, '');
    return digits ? parseInt(digits, 10) : 0;
};

const formatPercent = (n: number) => `${n.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

const formatTanggal = (iso: string) => {
    if (!iso) return '-';
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso)).toUpperCase();
};

const formatDateTime = (iso: string) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));

// Derived figures shared by the display card and the modal preview.
const derive = (target: number, pembangunan: number, terealisasi: number, belum: number) => {
    const terkumpul = pembangunan + terealisasi + belum;
    const pctTerkumpul = target > 0 ? Math.min(100, (terkumpul / target) * 100) : 0;
    return {
        terkumpul,
        masihDibutuhkan: Math.max(0, target - terkumpul),
        pctTerkumpul,
        pctSisa: 100 - pctTerkumpul,
    };
};

// --- page ------------------------------------------------------------------

export default function Pembangunan({
    latest,
    history,
    videos,
    images,
    maxImages,
}: {
    latest: PembangunanUpdate | null;
    history: PembangunanUpdate[];
    videos: PembangunanVideo[];
    images: PembangunanImage[];
    maxImages: number;
}) {
    const [tab, setTab] = useState<'update' | 'dana'>('update');

    const tabs = [
        { key: 'update' as const, label: 'Update' },
        { key: 'dana' as const, label: 'Dana Pembangunan' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pembangunan" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap gap-1 border-b">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={cn(
                                'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
                                tab === t.key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {tab === 'update' ? (
                    <UpdateTab videos={videos} images={images} maxImages={maxImages} />
                ) : (
                    <DanaPembangunanTab latest={latest} history={history} />
                )}
            </div>
        </AppLayout>
    );
}

// --- Update tab: YouTube link history + image gallery ----------------------

function UpdateTab({ videos, images, maxImages }: { videos: PembangunanVideo[]; images: PembangunanImage[]; maxImages: number }) {
    const current = videos[0] ?? null;

    const { data, setData, post, processing, errors, reset } = useForm({ youtube_url: '' });

    const submitVideo: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('pembangunan.video.store'), { preserveScroll: true, onSuccess: () => reset() });
    };

    const deleteVideo = (id: number) => {
        if (confirm('Hapus link YouTube ini?')) {
            router.delete(route('pembangunan.video.destroy', id), { preserveScroll: true });
        }
    };

    // Images
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const atMax = images.length >= maxImages;

    const onPickFile = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setCropSrc(URL.createObjectURL(file));
        e.target.value = '';
    };

    const onCropped = (blob: Blob) => {
        setUploading(true);
        router.post(
            route('pembangunan.image.store'),
            { image: new File([blob], 'pembangunan.jpg', { type: 'image/jpeg' }) },
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => setCropSrc(null),
                onFinish: () => setUploading(false),
            },
        );
    };

    const reorder = (ids: number[]) => {
        router.put(route('pembangunan.images.reorder'), { ids }, { preserveScroll: true });
    };

    const deleteImage = (id: number) => {
        if (confirm('Hapus gambar ini?')) {
            router.delete(route('pembangunan.image.destroy', id), { preserveScroll: true });
        }
    };

    return (
        <div className="space-y-6">
            {/* YouTube section */}
            <Card>
                <CardContent className="space-y-4 p-6">
                    <h2 className="font-semibold">Video YouTube</h2>

                    {current ? (
                        <div className="space-y-2">
                            <div className="aspect-video w-full max-w-xl overflow-hidden rounded-lg border bg-muted">
                                <iframe
                                    src={current.youtube_embed_url}
                                    title="Video pembangunan"
                                    className="h-full w-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                            <p className="text-sm text-muted-foreground">Link aktif diperbarui {formatDateTime(current.created_at)}.</p>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">Belum ada video.</p>
                    )}

                    <form onSubmit={submitVideo} className="space-y-2">
                        <Label htmlFor="youtube_url">Perbarui Link YouTube</Label>
                        <div className="flex gap-2">
                            <Input
                                id="youtube_url"
                                type="url"
                                placeholder="https://www.youtube.com/watch?v=..."
                                value={data.youtube_url}
                                onChange={(e) => setData('youtube_url', e.target.value)}
                            />
                            <Button type="submit" disabled={processing || !data.youtube_url}>
                                Simpan
                            </Button>
                        </div>
                        <InputError message={errors.youtube_url} />
                    </form>

                    {videos.length > 0 && (
                        <div>
                            <p className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground">RIWAYAT LINK</p>
                            <ul className="divide-y">
                                {videos.map((v, index) => (
                                    <li key={v.id} className="flex items-center justify-between gap-4 py-2">
                                        <div className="min-w-0">
                                            <a
                                                href={v.youtube_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block max-w-md truncate text-sm underline-offset-2 hover:underline"
                                            >
                                                {v.youtube_url}
                                            </a>
                                            <p className="text-xs text-muted-foreground">{formatDateTime(v.created_at)}</p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                            {index === 0 && (
                                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Aktif</span>
                                            )}
                                            <Button variant="ghost" size="icon" onClick={() => deleteVideo(v.id)} aria-label="Hapus">
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Image gallery section */}
            <Card>
                <CardContent className="space-y-4 p-6">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold">
                            Gambar Pembangunan ({images.length}/{maxImages})
                        </h2>
                        <Button type="button" size="sm" disabled={atMax} onClick={() => fileInputRef.current?.click()}>
                            <Plus className="h-4 w-4" /> Tambah Gambar
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">Seret untuk mengatur urutan. {atMax && 'Batas gambar tercapai.'}</p>

                    {images.length > 0 ? (
                        <SortableImageGrid images={images} onReorder={reorder} onDelete={deleteImage} aspect="16 / 9" />
                    ) : (
                        <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">Belum ada gambar.</div>
                    )}

                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
                </CardContent>
            </Card>

            <ImageCropperDialog
                open={cropSrc !== null}
                imageSrc={cropSrc}
                aspect={16 / 9}
                processing={uploading}
                onClose={() => setCropSrc(null)}
                onCropped={onCropped}
            />
        </div>
    );
}

// --- Dana Pembangunan tab: financial snapshots (unchanged behavior) --------

function DanaPembangunanTab({ latest, history }: { latest: PembangunanUpdate | null; history: PembangunanUpdate[] }) {
    const [open, setOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        update_date: latest ? toDateInput(latest.update_date) : today(),
        target_persembahan: latest?.target_persembahan ?? 0,
        persembahan_pembangunan: latest?.persembahan_pembangunan ?? 0,
        janji_iman_terealisasi: latest?.janji_iman_terealisasi ?? 0,
        janji_iman_belum_terealisasi: latest?.janji_iman_belum_terealisasi ?? 0,
        rincian_start_date: latest ? toDateInput(latest.rincian_start_date) : today(),
        rincian_end_date: latest ? toDateInput(latest.rincian_end_date) : today(),
    });

    const openModal = () => {
        // Pre-fill from the current latest snapshot each time the modal opens.
        reset();
        setData({
            update_date: latest ? toDateInput(latest.update_date) : today(),
            target_persembahan: latest?.target_persembahan ?? 0,
            persembahan_pembangunan: latest?.persembahan_pembangunan ?? 0,
            janji_iman_terealisasi: latest?.janji_iman_terealisasi ?? 0,
            janji_iman_belum_terealisasi: latest?.janji_iman_belum_terealisasi ?? 0,
            rincian_start_date: latest ? toDateInput(latest.rincian_start_date) : today(),
            rincian_end_date: latest ? toDateInput(latest.rincian_end_date) : today(),
        });
        setOpen(true);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('pembangunan.store'), {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        });
    };

    const remove = (id: number) => {
        if (confirm('Hapus update pembangunan ini?')) {
            router.delete(route('pembangunan.destroy', id), { preserveScroll: true });
        }
    };

    const preview = derive(data.target_persembahan, data.persembahan_pembangunan, data.janji_iman_terealisasi, data.janji_iman_belum_terealisasi);

    const moneyFields: { key: keyof typeof data; label: string }[] = [
        { key: 'target_persembahan', label: 'Target Persembahan' },
        { key: 'persembahan_pembangunan', label: 'Persembahan Pembangunan' },
        { key: 'janji_iman_terealisasi', label: 'Janji Iman Sudah Terealisasi' },
        { key: 'janji_iman_belum_terealisasi', label: 'Janji Iman Belum Terealisasi' },
    ];

    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold tracking-widest text-muted-foreground">
                        {latest ? `PER ${formatTanggal(latest.update_date)}` : 'BELUM ADA DATA'}
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight uppercase">Update Pembangunan GSG II</h1>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openModal}>
                            <Pencil className="h-4 w-4" />
                            {latest ? 'Edit Data' : 'Tambah Data'}
                        </Button>
                    </DialogTrigger>

                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Update Data Pembangunan</DialogTitle>
                            <DialogDescription>
                                Menyimpan akan membuat snapshot baru bertanggal. Data lama tetap tersimpan sebagai riwayat.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="update_date">Tanggal Update (PER ...)</Label>
                                <DatePicker id="update_date" value={data.update_date} onChange={(value) => setData('update_date', value)} />
                                <InputError message={errors.update_date} />
                            </div>

                            {moneyFields.map(({ key, label }) => (
                                <div className="grid gap-2" key={key}>
                                    <Label htmlFor={key}>{label}</Label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">Rp</span>
                                        <Input
                                            id={key}
                                            inputMode="numeric"
                                            value={formatNumber(data[key] as number)}
                                            onChange={(e) => setData(key, parseDigits(e.target.value))}
                                            required
                                        />
                                    </div>
                                    <InputError message={errors[key]} />
                                </div>
                            ))}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="rincian_start_date">Rincian Mulai</Label>
                                    <DatePicker
                                        id="rincian_start_date"
                                        value={data.rincian_start_date}
                                        onChange={(value) => setData('rincian_start_date', value)}
                                    />
                                    <InputError message={errors.rincian_start_date} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="rincian_end_date">Rincian Selesai</Label>
                                    <DatePicker
                                        id="rincian_end_date"
                                        value={data.rincian_end_date}
                                        onChange={(value) => setData('rincian_end_date', value)}
                                    />
                                    <InputError message={errors.rincian_end_date} />
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-md bg-muted px-4 py-3 text-sm">
                                <span className="text-muted-foreground">Masih dibutuhkan (otomatis)</span>
                                <span className="font-semibold">{formatRupiah(preview.masihDibutuhkan)}</span>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    Simpan
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {latest ? (
                <>
                    <DisplayCard record={latest} />
                    {history.length > 1 && <HistoryList history={history} latestId={latest.id} onDelete={remove} />}
                </>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
                        <p className="text-lg font-medium">Belum ada data pembangunan</p>
                        <p className="text-sm text-muted-foreground">
                            Klik <span className="font-medium">Tambah Data</span> untuk membuat update pertama.
                        </p>
                    </CardContent>
                </Card>
            )}
        </>
    );
}

// --- subcomponents ---------------------------------------------------------

function DisplayCard({ record }: { record: PembangunanUpdate }) {
    const { terkumpul, masihDibutuhkan, pctTerkumpul, pctSisa } = derive(
        record.target_persembahan,
        record.persembahan_pembangunan,
        record.janji_iman_terealisasi,
        record.janji_iman_belum_terealisasi,
    );

    const rows = [
        { label: 'Persembahan pembangunan', value: record.persembahan_pembangunan },
        { label: 'Janji iman sudah terealisasi', value: record.janji_iman_terealisasi },
        { label: 'Janji iman belum terealisasi', value: record.janji_iman_belum_terealisasi },
    ];

    return (
        <Card>
            <CardContent className="space-y-6 p-6">
                <p className="text-sm font-semibold tracking-widest text-muted-foreground">UPDATE PERSEMBAHAN</p>

                <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                        <p className="text-4xl font-bold tracking-tight">{formatPercent(pctTerkumpul)}</p>
                        <p className="mt-1 text-xs font-semibold tracking-widest text-muted-foreground">TERKUMPUL</p>
                        <p className="mt-1 font-semibold">{formatRupiah(terkumpul)}</p>
                    </div>
                    <div>
                        <p className="text-4xl font-bold tracking-tight">{formatPercent(pctSisa)}</p>
                        <p className="mt-1 text-xs font-semibold tracking-widest text-muted-foreground">MASIH DIBUTUHKAN</p>
                        <p className="mt-1 font-semibold">{formatRupiah(masihDibutuhkan)}</p>
                    </div>
                </div>

                <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pctTerkumpul}%` }} />
                </div>

                <div>
                    <p className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground">
                        RINCIAN PERSEMBAHAN ({formatTanggal(record.rincian_start_date)} – {formatTanggal(record.rincian_end_date)})
                    </p>
                    <dl className="divide-y">
                        {rows.map((row) => (
                            <div key={row.label} className="flex items-center justify-between py-3">
                                <dt className="text-muted-foreground">{row.label}</dt>
                                <dd className="font-medium">{formatRupiah(row.value)}</dd>
                            </div>
                        ))}
                        <div className="flex items-center justify-between py-3">
                            <dt className="font-semibold">Target persembahan</dt>
                            <dd className="font-semibold">{formatRupiah(record.target_persembahan)}</dd>
                        </div>
                    </dl>
                </div>
            </CardContent>
        </Card>
    );
}

function HistoryList({ history, latestId, onDelete }: { history: PembangunanUpdate[]; latestId: number; onDelete: (id: number) => void }) {
    return (
        <Card>
            <CardContent className="p-6">
                <p className="mb-3 text-xs font-semibold tracking-widest text-muted-foreground">RIWAYAT UPDATE</p>
                <ul className="divide-y">
                    {history.map((item) => {
                        const { terkumpul } = derive(
                            item.target_persembahan,
                            item.persembahan_pembangunan,
                            item.janji_iman_terealisasi,
                            item.janji_iman_belum_terealisasi,
                        );
                        return (
                            <li key={item.id} className="flex items-center justify-between py-3">
                                <div>
                                    <p className="font-medium">{formatTanggal(item.update_date)}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Terkumpul {formatRupiah(terkumpul)} dari {formatRupiah(item.target_persembahan)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {item.id === latestId && (
                                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Terbaru</span>
                                    )}
                                    <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} aria-label="Hapus">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </CardContent>
        </Card>
    );
}
