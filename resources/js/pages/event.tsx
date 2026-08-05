import { DateTimePicker } from '@/components/datetime-picker';
import InputError from '@/components/input-error';
import ImageCropperDialog from '@/components/kebaktian/image-cropper-dialog';
import { TimePicker } from '@/components/time-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { DAYS, formatEventSchedule, formatEventTime, type EventItem, type EventType } from '@/lib/event';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ImagePlus, Plus, Trash2 } from 'lucide-react';
import { ChangeEvent, FormEventHandler, useMemo, useRef, useState } from 'react';

/** Shared shape behind all three forms (two create forms + the inline edit form). */
interface EventFormData {
    title: string;
    type: EventType;
    day: string;
    event_date: string;
    start_time: string;
    end_time: string;
    location: string;
    description: string;
    details: string;
    contact: string;
    category: string;
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
            (item.type === 'mingguan' ? rutin : khusus).push(item);
        }
        return { rutin, khusus };
    }, [event]);

    const filteredRutin = useMemo(() => (dayFilter === 'Semua' ? rutin : rutin.filter((item) => item.day === dayFilter)), [rutin, dayFilter]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Acara & Jadwal" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Acara & Jadwal</h1>
                    <p className="text-muted-foreground text-sm">Kelola seluruh kegiatan (rutin maupun spesial) yang tampil di halaman publik.</p>
                </div>

                {/* ───────────── RUTIN MINGGUAN ───────────── */}
                <Card>
                    <CardContent className="space-y-4 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-semibold">Rutin Mingguan ({rutin.length})</h2>
                                <p className="text-muted-foreground text-sm">Kegiatan yang berulang setiap minggu pada hari tertentu.</p>
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
                                    <EventRow key={item.id} item={item} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-muted-foreground rounded-lg border border-dashed py-10 text-center text-sm">
                                {rutin.length === 0 ? 'Belum ada kegiatan rutin.' : `Tidak ada kegiatan pada hari ${dayFilter}.`}
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
                                <p className="text-muted-foreground text-sm">Kegiatan satu kali atau musiman dengan tanggal tertentu.</p>
                            </div>
                            <Button type="button" size="sm" onClick={() => setShowCreateKhusus((v) => !v)}>
                                <Plus className="h-4 w-4" /> Tambah Event Spesial
                            </Button>
                        </div>

                        {showCreateKhusus && <CreateKhususForm onDone={() => setShowCreateKhusus(false)} />}

                        {khusus.length > 0 ? (
                            <div className="divide-y rounded-lg border">
                                {khusus.map((item) => (
                                    <EventRow key={item.id} item={item} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-muted-foreground rounded-lg border border-dashed py-10 text-center text-sm">
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
                <div className="bg-muted h-20 w-32 flex-shrink-0 overflow-hidden rounded-lg border">
                    {imagePreviewUrl ? (
                        <img src={imagePreviewUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <div className="text-muted-foreground flex h-full items-center justify-center text-[10px]">Belum ada</div>
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

/**
 * The "when" half of an event: for `mingguan` a day Select + start/end time;
 * for `spesial` a combined date+time picker + an optional end time. Shared
 * by all three forms so the day/date field can never be submitted by the
 * wrong variant — the class of bug that previously let editing a Spesial
 * event silently stamp `day = 'Senin'` on it.
 */
interface EventWhenFieldsValue {
    day: string;
    event_date: string;
    start_time: string;
    end_time: string;
}

function EventWhenFields({
    idPrefix,
    type,
    value,
    onChange,
    errors,
}: {
    idPrefix: string;
    type: EventType;
    value: EventWhenFieldsValue;
    onChange: (patch: Partial<EventWhenFieldsValue>) => void;
    errors: { day?: string; event_date?: string; start_time?: string; end_time?: string };
}) {
    if (type === 'mingguan') {
        return (
            <>
                <div className="grid gap-2">
                    <Label htmlFor={`${idPrefix}_day`}>Hari</Label>
                    <Select value={value.day} onValueChange={(day) => onChange({ day })}>
                        <SelectTrigger id={`${idPrefix}_day`}>
                            <SelectValue placeholder="Pilih hari" />
                        </SelectTrigger>
                        <SelectContent>
                            {DAYS.map((day) => (
                                <SelectItem key={day} value={day}>
                                    {day}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={errors.day} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor={`${idPrefix}_start_time`}>Jam Mulai</Label>
                    <TimePicker id={`${idPrefix}_start_time`} value={value.start_time} onChange={(start_time) => onChange({ start_time })} />
                    <InputError message={errors.start_time} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor={`${idPrefix}_end_time`}>Jam Selesai (opsional)</Label>
                    <TimePicker id={`${idPrefix}_end_time`} value={value.end_time} onChange={(end_time) => onChange({ end_time })} />
                    <InputError message={errors.end_time} />
                </div>
            </>
        );
    }

    return (
        <>
            <div className="grid gap-2 md:col-span-2">
                <Label htmlFor={`${idPrefix}_event_date`}>Tanggal & Jam Mulai</Label>
                <DateTimePicker
                    id={`${idPrefix}_event_date`}
                    value={{ date: value.event_date, time: value.start_time }}
                    onChange={({ date, time }) => onChange({ event_date: date, start_time: time })}
                />
                <InputError message={errors.event_date} />
                <InputError message={errors.start_time} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}_end_time`}>Jam Selesai (opsional)</Label>
                <TimePicker id={`${idPrefix}_end_time`} value={value.end_time} onChange={(end_time) => onChange({ end_time })} />
                <InputError message={errors.end_time} />
            </div>
        </>
    );
}

/** The fields identical across every event, regardless of type. */
interface EventCommonFieldsValue {
    location: string;
    category: string;
    contact: string;
    description: string;
    details: string;
}

function EventCommonFields({
    idPrefix,
    value,
    onChange,
    errors,
}: {
    idPrefix: string;
    value: EventCommonFieldsValue;
    onChange: (patch: Partial<EventCommonFieldsValue>) => void;
    errors: Partial<Record<keyof EventCommonFieldsValue, string>>;
}) {
    return (
        <>
            <div className="grid gap-2 md:col-span-2">
                <Label htmlFor={`${idPrefix}_location`}>Lokasi</Label>
                <Input
                    id={`${idPrefix}_location`}
                    placeholder="Gedung Gereja"
                    value={value.location}
                    onChange={(e) => onChange({ location: e.target.value })}
                />
                <InputError message={errors.location} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}_category`}>Kategori</Label>
                <Input
                    id={`${idPrefix}_category`}
                    placeholder="ibadah / persekutuan / musik / olahraga / khusus"
                    value={value.category}
                    onChange={(e) => onChange({ category: e.target.value })}
                />
                <InputError message={errors.category} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}_contact`}>Kontak (opsional)</Label>
                <Input id={`${idPrefix}_contact`} value={value.contact} onChange={(e) => onChange({ contact: e.target.value })} />
                <InputError message={errors.contact} />
            </div>
            <div className="grid gap-2 md:col-span-2">
                <Label htmlFor={`${idPrefix}_description`}>Deskripsi</Label>
                <textarea
                    id={`${idPrefix}_description`}
                    rows={3}
                    value={value.description}
                    onChange={(e) => onChange({ description: e.target.value })}
                    className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm shadow-xs focus-visible:ring-2 focus-visible:outline-hidden"
                />
                <InputError message={errors.description} />
            </div>
            <div className="grid gap-2 md:col-span-2">
                <Label htmlFor={`${idPrefix}_details`}>Detail tambahan (opsional)</Label>
                <textarea
                    id={`${idPrefix}_details`}
                    rows={3}
                    value={value.details}
                    onChange={(e) => onChange({ details: e.target.value })}
                    className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm shadow-xs focus-visible:ring-2 focus-visible:outline-hidden"
                />
                <InputError message={errors.details} />
            </div>
        </>
    );
}

function CreateRutinForm({ onDone }: { onDone: () => void }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        type: 'mingguan' as EventType,
        day: DAYS[0] as string,
        event_date: '',
        start_time: '',
        end_time: '',
        location: '',
        description: '',
        details: '',
        contact: '',
        category: '',
    });

    const staging = useImageStaging();
    const { imageBlob, setUploading } = staging;
    const patch = (p: Partial<EventFormData>) => setData((prev) => ({ ...prev, ...p }));

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
                <Input id="rutin_title" placeholder="Ibadah Umum I" value={data.title} onChange={(e) => setData('title', e.target.value)} />
                <InputError message={errors.title} />
            </div>

            <EventWhenFields idPrefix="rutin" type="mingguan" value={data} onChange={patch} errors={errors} />
            <EventCommonFields idPrefix="rutin" value={data} onChange={patch} errors={errors} />

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
        type: 'spesial' as EventType,
        day: '',
        event_date: '',
        start_time: '',
        end_time: '',
        location: '',
        description: '',
        details: '',
        contact: '',
        category: '',
    });

    const staging = useImageStaging();
    const { imageBlob, setUploading } = staging;
    const patch = (p: Partial<EventFormData>) => setData((prev) => ({ ...prev, ...p }));

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
                <Input id="khusus_title" placeholder="Kebaktian Paskah" value={data.title} onChange={(e) => setData('title', e.target.value)} />
                <InputError message={errors.title} />
            </div>

            <EventWhenFields idPrefix="khusus" type="spesial" value={data} onChange={patch} errors={errors} />
            <EventCommonFields idPrefix="khusus" value={data} onChange={patch} errors={errors} />

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

function EventRow({ item }: { item: EventItem }) {
    const [expanded, setExpanded] = useState(false);
    const { data, setData, put, processing, errors } = useForm({
        title: item.title,
        type: item.type,
        // Only seed the field that matches this event's type — the fix for
        // the bug where the old form seeded `day` unconditionally and
        // submitted it even for spesial rows, silently flipping them into
        // the Mingguan list on save. The server independently guards against
        // this too (EventRequest::prepareForValidation).
        day: item.type === 'mingguan' ? (item.day ?? DAYS[0]) : '',
        event_date: item.type === 'spesial' ? (item.event_date ?? '') : '',
        start_time: item.start_time,
        end_time: item.end_time ?? '',
        location: item.location,
        description: item.description,
        details: item.details ?? '',
        contact: item.contact ?? '',
        category: item.category,
    });
    const patch = (p: Partial<EventFormData>) => setData((prev) => ({ ...prev, ...p }));

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
                    <div className="bg-muted h-10 w-14 flex-shrink-0 rounded" />
                )}
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-muted-foreground truncate text-xs">
                        {formatEventSchedule(item)} · {formatEventTime(item)} · {item.category}
                    </p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => setExpanded((v) => !v)}>
                    {expanded ? 'Tutup' : 'Edit'}
                </Button>
            </div>

            {expanded && (
                <div className="mt-3 grid gap-6 border-t pt-3 md:grid-cols-3">
                    <form onSubmit={submit} className="grid gap-3 md:col-span-2 md:grid-cols-2">
                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor={`title_${item.id}`}>Judul</Label>
                            <Input id={`title_${item.id}`} value={data.title} onChange={(e) => setData('title', e.target.value)} />
                            <InputError message={errors.title} />
                        </div>

                        <EventWhenFields idPrefix={`edit_${item.id}`} type={item.type} value={data} onChange={patch} errors={errors} />
                        <EventCommonFields idPrefix={`edit_${item.id}`} value={data} onChange={patch} errors={errors} />

                        <div className="flex items-center gap-3 md:col-span-2">
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
                        <div className="bg-muted overflow-hidden rounded-lg border" style={{ aspectRatio: 16 / 9 }}>
                            {item.image_url ? (
                                <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                                <div className="text-muted-foreground flex h-full items-center justify-center text-xs">Belum ada gambar</div>
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
