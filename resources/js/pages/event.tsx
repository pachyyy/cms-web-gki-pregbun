import InputError from '@/components/input-error';
import ImageCropperDialog from '@/components/kebaktian/image-cropper-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ImagePlus, Plus, Trash2 } from 'lucide-react';
import { ChangeEvent, FormEventHandler, useMemo, useRef, useState } from 'react';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

const isRecurring = (item: Pick<EventItem, 'schedule' | 'day'>) =>
    Boolean(item.day) || item.schedule.trim().startsWith('Setiap ');

interface EventItem {
    id: number;
    title: string;
    schedule: string;
    day: string | null;
    time: string;
    location: string;
    description: string;
    details: string | null;
    contact: string | null;
    category: string;
    image_public_id: string | null;
    image_url: string | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Acara & Jadwal',
        href: '/event',
    },
];

export default function EventsPage({ event }: { event: EventItem[] }) {
    const [showCreateRutin, setShowCreateRutin] = useState(false);
    const [showCreateKhusus, setShowCreateKhusus] = useState(false);
    const [dayFilter, setDayFilter] = useState<string>('Semua');

    const { rutin, khusus } = useMemo(() => {
        const rutin: EventItem[] = [];
        const khusus: EventItem[] = [];
        for (const item of event) {
            (isRecurring(item) ? rutin : khusus).push(item);
        }
        return { rutin, khusus };
    }, [event]);

    const filteredRutin = useMemo(() => {
        if (dayFilter === 'Semua') return rutin;
        return rutin.filter((item) => (item.day ?? item.schedule.replace(/^Setiap\s*/, '')) === dayFilter);
    }, [rutin, dayFilter]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Acara & Jadwal" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Acara & Jadwal</h1>
                    <p className="text-sm text-muted-foreground">
                        Kelola seluruh kegiatan (rutin maupun spesial) yang tampil di halaman publik.
                    </p>
                </div>

                {/* ───────────── RUTIN MINGGUAN ───────────── */}
                <Card>
                    <CardContent className="space-y-4 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-semibold">Rutin Mingguan ({rutin.length})</h2>
                                <p className="text-sm text-muted-foreground">Kegiatan yang berulang setiap minggu pada hari tertentu.</p>
                            </div>
                            <Button type="button" size="sm" onClick={() => setShowCreateRutin((v) => !v)}>
                                <Plus className="h-4 w-4" /> Tambah Kegiatan Rutin
                            </Button>
                        </div>

                        {showCreateRutin && <CreateRutinForm onDone={() => setShowCreateRutin(false)} />}

                        <div className="flex flex-wrap gap-1.5">
                            {['Semua', ...DAYS].map((day) => (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => setDayFilter(day)}
                                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                        dayFilter === day
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-input bg-background text-foreground hover:bg-secondary'
                                    }`}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>

                        {filteredRutin.length > 0 ? (
                            <div className="divide-y rounded-lg border">
                                {filteredRutin.map((item) => (
                                    <EventRow key={item.id} item={item} variant="rutin" />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                                {rutin.length === 0
                                    ? 'Belum ada kegiatan rutin.'
                                    : `Tidak ada kegiatan pada hari ${dayFilter}.`}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ───────────── EVENT SPESIAL ───────────── */}
                <Card>
                    <CardContent className="space-y-4 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-semibold">Event Spesial ({khusus.length})</h2>
                                <p className="text-sm text-muted-foreground">Kegiatan satu kali atau musiman dengan tanggal tertentu.</p>
                            </div>
                            <Button type="button" size="sm" onClick={() => setShowCreateKhusus((v) => !v)}>
                                <Plus className="h-4 w-4" /> Tambah Event Spesial
                            </Button>
                        </div>

                        {showCreateKhusus && <CreateKhususForm onDone={() => setShowCreateKhusus(false)} />}

                        {khusus.length > 0 ? (
                            <div className="divide-y rounded-lg border">
                                {khusus.map((item) => (
                                    <EventRow key={item.id} item={item} variant="khusus" />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                                Belum ada event spesial.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

/** Shared image-picker state + handlers used by both create forms. */
function useImageStaging() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const [imageBlob, setImageBlob] = useState<Blob | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const onPickFile = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setCropSrc(URL.createObjectURL(file));
        e.target.value = '';
    };

    const onCropped = (blob: Blob) => {
        setImageBlob(blob);
        setImagePreviewUrl(URL.createObjectURL(blob));
        setCropSrc(null);
    };

    const removeImage = () => {
        setImageBlob(null);
        setImagePreviewUrl(null);
    };

    return { fileInputRef, cropSrc, setCropSrc, imageBlob, imagePreviewUrl, uploading, setUploading, onPickFile, onCropped, removeImage };
}

function ImagePickerField({ staging }: { staging: ReturnType<typeof useImageStaging> }) {
    const { fileInputRef, imagePreviewUrl, onPickFile, removeImage } = staging;
    return (
        <div className="grid gap-2 md:col-span-2">
            <Label>Gambar (opsional)</Label>
            <div className="flex items-center gap-4">
                <div className="h-20 w-32 flex-shrink-0 overflow-hidden rounded-lg border bg-muted">
                    {imagePreviewUrl ? (
                        <img src={imagePreviewUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">Belum ada</div>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <ImagePlus className="h-4 w-4" /> {imagePreviewUrl ? 'Ubah' : 'Pilih Gambar'}
                    </Button>
                    {imagePreviewUrl && (
                        <Button type="button" size="sm" variant="outline" onClick={removeImage}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
        </div>
    );
}

function CreateRutinForm({ onDone }: { onDone: () => void }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        day: DAYS[0],
        schedule: `Setiap ${DAYS[0]}`,
        time: '',
        location: '',
        description: '',
        details: '',
        contact: '',
        category: '',
    });

    const staging = useImageStaging();
    const { imageBlob, setUploading } = staging;

    const onDayChange = (day: string) => {
        setData((prev) => ({ ...prev, day, schedule: `Setiap ${day}` }));
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('event.store'), {
            preserveScroll: true,
            onSuccess: (page) => {
                const createdId = (page.props as { createdId?: number }).createdId;
                reset();

                if (imageBlob && createdId) {
                    setUploading(true);
                    const file = new File([imageBlob], 'event.jpg', { type: 'image/jpeg' });
                    router.post(
                        route('event.image.store', createdId),
                        { image: file },
                        {
                            forceFormData: true,
                            preserveScroll: true,
                            onFinish: () => {
                                setUploading(false);
                                staging.removeImage();
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
            <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="rutin_title">Judul</Label>
                <Input
                    id="rutin_title"
                    placeholder="Ibadah Umum I"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                />
                <InputError message={errors.title} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="rutin_day">Hari</Label>
                <select
                    id="rutin_day"
                    value={data.day}
                    onChange={(e) => onDayChange(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                >
                    {DAYS.map((day) => (
                        <option key={day} value={day}>
                            {day}
                        </option>
                    ))}
                </select>
                <InputError message={errors.day} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="rutin_time">Jam</Label>
                <Input id="rutin_time" placeholder="07.30" value={data.time} onChange={(e) => setData('time', e.target.value)} />
                <InputError message={errors.time} />
            </div>
            <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="rutin_location">Lokasi</Label>
                <Input
                    id="rutin_location"
                    placeholder="Gedung Gereja"
                    value={data.location}
                    onChange={(e) => setData('location', e.target.value)}
                />
                <InputError message={errors.location} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="rutin_category">Kategori</Label>
                <Input
                    id="rutin_category"
                    placeholder="ibadah / persekutuan / musik / olahraga / pelayanan"
                    value={data.category}
                    onChange={(e) => setData('category', e.target.value)}
                />
                <InputError message={errors.category} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="rutin_contact">Kontak (opsional)</Label>
                <Input id="rutin_contact" value={data.contact} onChange={(e) => setData('contact', e.target.value)} />
                <InputError message={errors.contact} />
            </div>
            <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="rutin_description">Deskripsi</Label>
                <textarea
                    id="rutin_description"
                    rows={3}
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                />
                <InputError message={errors.description} />
            </div>
            <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="rutin_details">Detail tambahan (opsional)</Label>
                <textarea
                    id="rutin_details"
                    rows={3}
                    value={data.details}
                    onChange={(e) => setData('details', e.target.value)}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                />
                <InputError message={errors.details} />
            </div>

            <ImagePickerField staging={staging} />

            <div className="flex items-center gap-3 md:col-span-2">
                <Button type="submit" size="sm" disabled={processing || staging.uploading}>
                    {staging.uploading ? 'Mengunggah gambar...' : 'Simpan'}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={onDone}>
                    Batal
                </Button>
            </div>

            <ImageCropperDialog
                open={staging.cropSrc !== null}
                imageSrc={staging.cropSrc}
                aspect={16 / 9}
                processing={false}
                onClose={() => staging.setCropSrc(null)}
                onCropped={staging.onCropped}
            />
        </form>
    );
}

function CreateKhususForm({ onDone }: { onDone: () => void }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        schedule: '',
        time: '',
        location: '',
        description: '',
        details: '',
        contact: '',
        category: '',
    });

    const staging = useImageStaging();
    const { imageBlob, setUploading } = staging;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('event.store'), {
            preserveScroll: true,
            onSuccess: (page) => {
                const createdId = (page.props as { createdId?: number }).createdId;
                reset();

                if (imageBlob && createdId) {
                    setUploading(true);
                    const file = new File([imageBlob], 'event.jpg', { type: 'image/jpeg' });
                    router.post(
                        route('event.image.store', createdId),
                        { image: file },
                        {
                            forceFormData: true,
                            preserveScroll: true,
                            onFinish: () => {
                                setUploading(false);
                                staging.removeImage();
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
            <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="khusus_title">Judul</Label>
                <Input
                    id="khusus_title"
                    placeholder="Kebaktian Paskah"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                />
                <InputError message={errors.title} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="khusus_schedule">Jadwal</Label>
                <Input
                    id="khusus_schedule"
                    placeholder="30 Maret 2026"
                    value={data.schedule}
                    onChange={(e) => setData('schedule', e.target.value)}
                />
                <InputError message={errors.schedule} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="khusus_time">Jam</Label>
                <Input id="khusus_time" placeholder="07.30" value={data.time} onChange={(e) => setData('time', e.target.value)} />
                <InputError message={errors.time} />
            </div>
            <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="khusus_location">Lokasi</Label>
                <Input
                    id="khusus_location"
                    placeholder="Gedung Gereja"
                    value={data.location}
                    onChange={(e) => setData('location', e.target.value)}
                />
                <InputError message={errors.location} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="khusus_category">Kategori</Label>
                <Input
                    id="khusus_category"
                    placeholder="khusus"
                    value={data.category}
                    onChange={(e) => setData('category', e.target.value)}
                />
                <InputError message={errors.category} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="khusus_contact">Kontak (opsional)</Label>
                <Input id="khusus_contact" value={data.contact} onChange={(e) => setData('contact', e.target.value)} />
                <InputError message={errors.contact} />
            </div>
            <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="khusus_description">Deskripsi</Label>
                <textarea
                    id="khusus_description"
                    rows={3}
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                />
                <InputError message={errors.description} />
            </div>
            <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="khusus_details">Detail tambahan (opsional)</Label>
                <textarea
                    id="khusus_details"
                    rows={3}
                    value={data.details}
                    onChange={(e) => setData('details', e.target.value)}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                />
                <InputError message={errors.details} />
            </div>

            <ImagePickerField staging={staging} />

            <div className="flex items-center gap-3 md:col-span-2">
                <Button type="submit" size="sm" disabled={processing || staging.uploading}>
                    {staging.uploading ? 'Mengunggah gambar...' : 'Simpan'}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={onDone}>
                    Batal
                </Button>
            </div>

            <ImageCropperDialog
                open={staging.cropSrc !== null}
                imageSrc={staging.cropSrc}
                aspect={16 / 9}
                processing={false}
                onClose={() => staging.setCropSrc(null)}
                onCropped={staging.onCropped}
            />
        </form>
    );
}

function EventRow({ item, variant }: { item: EventItem; variant: 'rutin' | 'khusus' }) {
    const [expanded, setExpanded] = useState(false);
    const { data, setData, put, processing, errors } = useForm({
        title: item.title,
        schedule: item.schedule,
        day: item.day ?? DAYS[0],
        time: item.time,
        location: item.location,
        description: item.description,
        details: item.details ?? '',
        contact: item.contact ?? '',
        category: item.category,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const onDayChange = (day: string) => {
        setData((prev) => ({ ...prev, day, schedule: `Setiap ${day}` }));
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('event.update', item.id), { preserveScroll: true });
    };

    const remove = () => {
        if (confirm(`Hapus kegiatan "${item.title}"?`)) {
            router.delete(route('event.destroy', item.id), { preserveScroll: true });
        }
    };

    const onPickFile = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setCropSrc(URL.createObjectURL(file));
        e.target.value = '';
    };

    const onCropped = (blob: Blob) => {
        setUploading(true);
        const file = new File([blob], 'event.jpg', { type: 'image/jpeg' });
        router.post(
            route('event.image.store', item.id),
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
        if (confirm('Hapus gambar kegiatan ini?')) {
            router.delete(route('event.image.destroy', item.id), { preserveScroll: true });
        }
    };

    return (
        <div className="px-4 py-3">
            <div className="flex items-center gap-3">
                {item.image_url ? (
                    <img src={item.image_url} alt="" className="h-10 w-14 flex-shrink-0 rounded object-cover" />
                ) : (
                    <div className="h-10 w-14 flex-shrink-0 rounded bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                        {variant === 'rutin' ? item.day ?? item.schedule : item.schedule} · {item.time} · {item.category}
                    </p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => setExpanded((v) => !v)}>
                    {expanded ? 'Tutup' : 'Edit'}
                </Button>
            </div>

            {expanded && (
                <div className="mt-3 grid gap-6 border-t pt-3 md:grid-cols-3">
                    <form onSubmit={submit} className="grid gap-3 md:col-span-2">
                        <div className="grid gap-2">
                            <Label htmlFor={`title_${item.id}`}>Judul</Label>
                            <Input id={`title_${item.id}`} value={data.title} onChange={(e) => setData('title', e.target.value)} />
                            <InputError message={errors.title} />
                        </div>

                        {variant === 'rutin' ? (
                            <div className="grid gap-2">
                                <Label htmlFor={`day_${item.id}`}>Hari</Label>
                                <select
                                    id={`day_${item.id}`}
                                    value={data.day}
                                    onChange={(e) => onDayChange(e.target.value)}
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                                >
                                    {DAYS.map((day) => (
                                        <option key={day} value={day}>
                                            {day}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.day} />
                            </div>
                        ) : (
                            <div className="grid gap-2">
                                <Label htmlFor={`schedule_${item.id}`}>Jadwal</Label>
                                <Input
                                    id={`schedule_${item.id}`}
                                    placeholder="30 Maret 2026"
                                    value={data.schedule}
                                    onChange={(e) => setData('schedule', e.target.value)}
                                />
                                <InputError message={errors.schedule} />
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor={`time_${item.id}`}>Jam</Label>
                            <Input id={`time_${item.id}`} value={data.time} onChange={(e) => setData('time', e.target.value)} />
                            <InputError message={errors.time} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`location_${item.id}`}>Lokasi</Label>
                            <Input
                                id={`location_${item.id}`}
                                value={data.location}
                                onChange={(e) => setData('location', e.target.value)}
                            />
                            <InputError message={errors.location} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label htmlFor={`category_${item.id}`}>Kategori</Label>
                                <Input
                                    id={`category_${item.id}`}
                                    value={data.category}
                                    onChange={(e) => setData('category', e.target.value)}
                                />
                                <InputError message={errors.category} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor={`contact_${item.id}`}>Kontak</Label>
                                <Input
                                    id={`contact_${item.id}`}
                                    value={data.contact}
                                    onChange={(e) => setData('contact', e.target.value)}
                                />
                                <InputError message={errors.contact} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`description_${item.id}`}>Deskripsi</Label>
                            <textarea
                                id={`description_${item.id}`}
                                rows={3}
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                            />
                            <InputError message={errors.description} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`details_${item.id}`}>Detail tambahan</Label>
                            <textarea
                                id={`details_${item.id}`}
                                rows={3}
                                value={data.details}
                                onChange={(e) => setData('details', e.target.value)}
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                            />
                            <InputError message={errors.details} />
                        </div>

                        <div className="flex items-center gap-3">
                            <Button type="submit" size="sm" disabled={processing}>
                                Simpan
                            </Button>
                            <Button type="button" size="sm" variant="destructive" onClick={remove} className="ml-auto">
                                <Trash2 className="h-4 w-4" /> Hapus
                            </Button>
                        </div>
                    </form>

                    <div className="space-y-3">
                        <Label>Gambar</Label>
                        <div className="overflow-hidden rounded-lg border bg-muted" style={{ aspectRatio: 16 / 9 }}>
                            {item.image_url ? (
                                <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                    Belum ada gambar
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button type="button" size="sm" onClick={() => fileInputRef.current?.click()}>
                                <ImagePlus className="h-4 w-4" /> {item.image_url ? 'Ubah' : 'Tambah'}
                            </Button>
                            {item.image_url && (
                                <Button type="button" size="sm" variant="outline" onClick={removeImage}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
                    </div>
                </div>
            )}

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