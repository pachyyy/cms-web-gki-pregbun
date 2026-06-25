import ImageCropperDialog from '@/components/kebaktian/image-cropper-dialog';
import SortablePastorList from '@/components/hamba-tuhan/sortable-pastor-list';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ImagePlus, Trash2, UserPlus } from 'lucide-react';
import { ChangeEvent, FormEventHandler, useRef, useState } from 'react';

interface HambaTuhan {
    id: number;
    name: string;
    description: string | null;
    image_public_id: string;
    image_url: string;
    order: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tentang Kami',
        href: '/tentangkami',
    },
];

const ASPECT = 4 / 5;

export default function TentangKami({ hambaTuhan, descriptionMax }: { hambaTuhan: HambaTuhan[]; descriptionMax: number }) {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [adding, setAdding] = useState(false);

    const selected = adding ? null : (hambaTuhan.find((p) => p.id === selectedId) ?? null);

    const select = (id: number) => {
        setAdding(false);
        setSelectedId(id);
    };

    const startAdd = () => {
        setAdding(true);
        setSelectedId(null);
    };

    const reorder = (ids: number[]) => {
        router.put(route('hamba-tuhan.reorder'), { ids }, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tentang Kami" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Hamba Tuhan</h1>
                    <p className="text-sm text-muted-foreground">Kelola daftar hamba Tuhan yang tampil di halaman Tentang Kami.</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
                    {/* Left: sortable list */}
                    <Card>
                        <CardContent className="space-y-4 p-4">
                            <Button className="w-full" onClick={startAdd}>
                                <UserPlus className="h-4 w-4" /> Tambah Hamba Tuhan
                            </Button>

                            {hambaTuhan.length > 0 ? (
                                <SortablePastorList items={hambaTuhan} selectedId={selectedId} onSelect={select} onReorder={reorder} />
                            ) : (
                                <p className="py-6 text-center text-sm text-muted-foreground">Belum ada data.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Right: editor */}
                    <Card>
                        <CardContent className="p-6">
                            {adding ? (
                                <PastorNewForm descriptionMax={descriptionMax} onDone={() => setAdding(false)} />
                            ) : selected ? (
                                <PastorEditForm
                                    key={selected.id}
                                    pastor={selected}
                                    descriptionMax={descriptionMax}
                                    onDeleted={() => setSelectedId(null)}
                                />
                            ) : (
                                <div className="flex h-full min-h-48 items-center justify-center text-center text-sm text-muted-foreground">
                                    Pilih hamba Tuhan di sebelah kiri untuk mengubah, atau klik &ldquo;Tambah Hamba Tuhan&rdquo;.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

function PastorNewForm({ descriptionMax, onDone }: { descriptionMax: number; onDone: () => void }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
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
        setData('image', new File([blob], 'hamba.jpg', { type: 'image/jpeg' }));
        setPreview(URL.createObjectURL(blob));
        setCropSrc(null);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('hamba-tuhan.store'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setPreview(null);
                onDone();
            },
        });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <h2 className="font-semibold">Tambah Hamba Tuhan</h2>

            <ImageField aspectLabel="4:5" preview={preview} onPick={() => fileInputRef.current?.click()} />
            <InputError message={errors.image} />

            <NameDescriptionFields
                name={data.name}
                description={data.description}
                descriptionMax={descriptionMax}
                onName={(v) => setData('name', v)}
                onDescription={(v) => setData('description', v)}
                errors={errors}
            />

            <div className="flex gap-2">
                <Button type="submit" disabled={processing || !data.name || !data.image}>
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

function PastorEditForm({ pastor, descriptionMax, onDeleted }: { pastor: HambaTuhan; descriptionMax: number; onDeleted: () => void }) {
    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        name: pastor.name,
        description: pastor.description ?? '',
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('hamba-tuhan.update', pastor.id), { preserveScroll: true });
    };

    const onPickFile = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setCropSrc(URL.createObjectURL(file));
        e.target.value = '';
    };

    const onCropped = (blob: Blob) => {
        setUploading(true);
        router.post(
            route('hamba-tuhan.image.update', pastor.id),
            { image: new File([blob], 'hamba.jpg', { type: 'image/jpeg' }) },
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => setCropSrc(null),
                onFinish: () => setUploading(false),
            },
        );
    };

    const remove = () => {
        if (confirm(`Hapus ${pastor.name}?`)) {
            router.delete(route('hamba-tuhan.destroy', pastor.id), { preserveScroll: true, onSuccess: onDeleted });
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="font-semibold">Ubah Hamba Tuhan</h2>
                <Button type="button" variant="outline" size="sm" onClick={remove}>
                    <Trash2 className="h-4 w-4 text-destructive" /> Hapus
                </Button>
            </div>

            <ImageField aspectLabel="4:5" preview={pastor.image_url} onPick={() => fileInputRef.current?.click()} uploading={uploading} />

            <NameDescriptionFields
                name={data.name}
                description={data.description}
                descriptionMax={descriptionMax}
                onName={(v) => setData('name', v)}
                onDescription={(v) => setData('description', v)}
                errors={errors}
            />

            <div className="flex items-center gap-3">
                <Button type="submit" disabled={processing || !data.name}>
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
    );
}

function ImageField({
    preview,
    aspectLabel,
    uploading,
    onPick,
}: {
    preview: string | null;
    aspectLabel: string;
    uploading?: boolean;
    onPick: () => void;
}) {
    return (
        <div className="flex items-end gap-4">
            <div className="aspect-[4/5] w-32 shrink-0 overflow-hidden rounded-lg border bg-muted">
                {preview ? (
                    <img src={preview} alt="" className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Rasio {aspectLabel}</div>
                )}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={onPick} disabled={uploading}>
                <ImagePlus className="h-4 w-4" /> {uploading ? 'Mengunggah...' : preview ? 'Ubah Gambar' : 'Pilih Gambar'}
            </Button>
        </div>
    );
}

function NameDescriptionFields({
    name,
    description,
    descriptionMax,
    onName,
    onDescription,
    errors,
}: {
    name: string;
    description: string;
    descriptionMax: number;
    onName: (v: string) => void;
    onDescription: (v: string) => void;
    errors: Partial<Record<'name' | 'description', string>>;
}) {
    return (
        <>
            <div className="grid gap-2">
                <Label htmlFor="name">Nama</Label>
                <Input id="name" value={name} onChange={(e) => onName(e.target.value)} placeholder="Pdt. ..." required />
                <InputError message={errors.name} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">Deskripsi (opsional)</Label>
                <textarea
                    id="description"
                    rows={3}
                    maxLength={descriptionMax}
                    value={description}
                    onChange={(e) => onDescription(e.target.value)}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                />
                <div className="flex justify-between">
                    <InputError message={errors.description} />
                    <span className="text-xs text-muted-foreground">
                        {description.length}/{descriptionMax}
                    </span>
                </div>
            </div>
        </>
    );
}
