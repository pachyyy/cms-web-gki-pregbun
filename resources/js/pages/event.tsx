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
import { ChangeEvent, FormEventHandler, useRef, useState } from 'react';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

/**
 * Schedule is still a free-text field underneath (parsed by
 * getEventType()/nextOccurrence() on the public site). Checking "Setiap"
 * switches to picking a day from a dropdown and writes "Setiap <Hari>" as
 * the value; the text input is disabled while that's active so there's
 * only one way to edit the value at a time. Unchecking re-enables the text
 * input and clears the value back to free text.
 */
function ScheduleField({
    id,
    value,
    onChange,
    error,
}: {
    id: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
}) {
    const isRecurring = value.startsWith('Setiap ');
    const selectedDay = isRecurring ? value.replace(/^Setiap\s*/, '') : '';

    const toggleRecurring = (checked: boolean) => {
        onChange(checked ? `Setiap ${DAYS[0]}` : '');
    };

    return (
        <div className="grid gap-2">
            <div className="flex items-center gap-2">
                <input
                    id={`${id}_recurring`}
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => toggleRecurring(e.target.checked)}
                    className="h-4 w-4 rounded border-input"
                />
                <label htmlFor={`${id}_recurring`} className="text-xs text-muted-foreground">
                    Setiap (kegiatan rutin mingguan)
                </label>
            </div>

            {isRecurring && (
                <select
                    value={selectedDay}
                    onChange={(e) => onChange(`Setiap ${e.target.value}`)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
                >
                    {DAYS.map((day) => (
                        <option key={day} value={day}>
                            {day}
                        </option>
                    ))}
                </select>
            )}

            <Input
                id={id}
                placeholder="30 Maret 2026"
                value={isRecurring ? `Setiap ${selectedDay}` : value}
                onChange={(e) => onChange(e.target.value)}
                disabled={isRecurring}
            />
            <InputError message={error} />
        </div>
    );
}

interface EventItem {
    id: number;
    title: string;
    schedule: string;
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
    const [showCreate, setShowCreate] = useState(false);

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

                <Card>
                    <CardContent className="space-y-4 p-6">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold">Daftar Kegiatan ({event.length})</h2>
                            <Button type="button" size="sm" onClick={() => setShowCreate((v) => !v)}>
                                <Plus className="h-4 w-4" /> Tambah Kegiatan
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Kolom "Jadwal" menentukan apakah kegiatan dianggap rutin atau spesial: jika berisi tahun
                            (misal "30 Maret 2026"), dianggap kegiatan spesial. Jika berisi nama hari (misal "Setiap
                            Minggu"), dianggap kegiatan rutin.
                        </p>

                        {showCreate && <CreateEventForm onDone={() => setShowCreate(false)} />}

                        {event.length > 0 ? (
                            <div className="divide-y rounded-lg border">
                                {event.map((item) => (
                                    <EventRow key={item.id} item={item} />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                                Belum ada kegiatan.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function CreateEventForm({ onDone }: { onDone: () => void }) {
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

    // Same pattern as the persembahan QR upload: the event needs to exist
    // (have an id) before an image can be attached, so we stage the cropped
    // blob locally and upload it right after the create succeeds, using the
    // id the controller flashes back via with('createdId', ...).
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
                                setImageBlob(null);
                                setImagePreviewUrl(null);
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
                <Label htmlFor="title">Judul</Label>
                <Input id="title" placeholder="Kebaktian Paskah" value={data.title} onChange={(e) => setData('title', e.target.value)} />
                <InputError message={errors.title} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="schedule">Jadwal</Label>
                <ScheduleField id="schedule" value={data.schedule} onChange={(v) => setData('schedule', v)} error={errors.schedule} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="time">Jam</Label>
                <Input id="time" placeholder="07.30" value={data.time} onChange={(e) => setData('time', e.target.value)} />
                <InputError message={errors.time} />
            </div>
            <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="location">Lokasi</Label>
                <Input
                    id="location"
                    placeholder="Gedung Gereja"
                    value={data.location}
                    onChange={(e) => setData('location', e.target.value)}
                />
                <InputError message={errors.location} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="category">Kategori</Label>
                <Input
                    id="category"
                    placeholder="ibadah / persekutuan / musik / olahraga / pelayanan / khusus"
                    value={data.category}
                    onChange={(e) => setData('category', e.target.value)}
                />
                <InputError message={errors.category} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="contact">Kontak (opsional)</Label>
                <Input id="contact" value={data.contact} onChange={(e) => setData('contact', e.target.value)} />
                <InputError message={errors.contact} />
            </div>
            <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="description">Deskripsi</Label>
                <textarea
                    id="description"
                    rows={3}
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                />
                <InputError message={errors.description} />
            </div>
            <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="details">Detail tambahan (opsional)</Label>
                <textarea
                    id="details"
                    rows={3}
                    value={data.details}
                    onChange={(e) => setData('details', e.target.value)}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                />
                <InputError message={errors.details} />
            </div>

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

            <div className="flex items-center gap-3 md:col-span-2">
                <Button type="submit" size="sm" disabled={processing || uploading}>
                    {uploading ? 'Mengunggah gambar...' : 'Simpan'}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={onDone}>
                    Batal
                </Button>
            </div>

            <ImageCropperDialog
                open={cropSrc !== null}
                imageSrc={cropSrc}
                aspect={16 / 9}
                processing={false}
                onClose={() => setCropSrc(null)}
                onCropped={onCropped}
            />
        </form>
    );
}

function EventRow({ item }: { item: EventItem }) {
    const [expanded, setExpanded] = useState(false);
    const { data, setData, put, processing, errors } = useForm({
        title: item.title,
        schedule: item.schedule,
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
                        {item.schedule} · {item.time} · {item.category}
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
                        <div className="grid gap-2">
                            <Label htmlFor={`schedule_${item.id}`}>Jadwal</Label>
                            <ScheduleField
                                id={`schedule_${item.id}`}
                                value={data.schedule}
                                onChange={(v) => setData('schedule', v)}
                                error={errors.schedule}
                            />
                        </div>
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