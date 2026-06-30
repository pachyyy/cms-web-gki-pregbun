import InputError from '@/components/input-error';
import ImageCropperDialog from '@/components/kebaktian/image-cropper-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, router } from '@inertiajs/react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ImagePlus, Trash2 } from 'lucide-react';
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

export default function SortablePersembahanList({
    items,
    onReorder,
}: {
    items: PersembahanItem[];
    onReorder: (ids: number[]) => void;
}) {
    const [localItems, setLocalItems] = useState(items);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

    // Keep local order in sync if the server-provided list changes (e.g.
    // after a create/delete causes Inertia to refresh props).
    if (items !== localItems && items.map((i) => i.id).join(',') !== localItems.map((i) => i.id).join(',')) {
        // Only resync when the underlying id set actually differs, to avoid
        // clobbering an in-flight drag with a stale prop reference.
        const sameSet = items.length === localItems.length && items.every((i) => localItems.some((l) => l.id === i.id));
        if (!sameSet) setLocalItems(items);
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = localItems.findIndex((i) => i.id === active.id);
        const newIndex = localItems.findIndex((i) => i.id === over.id);
        const reordered = arrayMove(localItems, oldIndex, newIndex);

        setLocalItems(reordered);
        onReorder(reordered.map((i) => i.id));
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={localItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                    {localItems.map((item) => (
                        <SortableItem key={item.id} item={item} />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}

function SortableItem({ item }: { item: PersembahanItem }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
    const [expanded, setExpanded] = useState(false);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="rounded-lg border bg-card">
            <div className="flex items-center gap-3 p-3">
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
                    aria-label="Seret untuk urutkan"
                >
                    <GripVertical className="h-4 w-4" />
                </button>

                {item.qr_url ? (
                    <img src={item.qr_url} alt="" className="h-10 w-10 rounded object-contain" />
                ) : (
                    <div className="h-10 w-10 rounded bg-muted" />
                )}

                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                        {item.bank} {item.display_rekening}
                    </p>
                </div>

                <Button type="button" size="sm" variant="outline" onClick={() => setExpanded((v) => !v)}>
                    {expanded ? 'Tutup' : 'Edit'}
                </Button>
            </div>

            {expanded && <ItemEditor item={item} onClose={() => setExpanded(false)} />}
        </div>
    );
}

function ItemEditor({ item, onClose }: { item: PersembahanItem; onClose: () => void }) {
    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        title: item.title,
        entity: item.entity,
        bank: item.bank,
        rekening: item.rekening,
        display_rekening: item.display_rekening,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('persembahan.update', item.id), { preserveScroll: true });
    };

    const onPickFile = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setCropSrc(URL.createObjectURL(file));
        e.target.value = '';
    };

    const onCropped = (blob: Blob) => {
        setUploading(true);
        const file = new File([blob], 'qr.jpg', { type: 'image/jpeg' });
        router.post(
            route('persembahan.qr-image.store', item.id),
            { image: file },
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => setCropSrc(null),
                onFinish: () => setUploading(false),
            },
        );
    };

    const removeQr = () => {
        if (confirm('Hapus QR code ini?')) {
            router.delete(route('persembahan.qr-image.destroy', item.id), { preserveScroll: true });
        }
    };

    const removeItem = () => {
        if (confirm(`Hapus item "${item.title}"? Tindakan ini tidak dapat dibatalkan.`)) {
            router.delete(route('persembahan.destroy', item.id), { preserveScroll: true });
        }
    };

    return (
        <div className="border-t p-4">
            <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-3 md:col-span-2">
                    <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor={`title_${item.id}`}>Judul</Label>
                            <Input id={`title_${item.id}`} value={data.title} onChange={(e) => setData('title', e.target.value)} />
                            <InputError message={errors.title} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`entity_${item.id}`}>Atas Nama</Label>
                            <Input id={`entity_${item.id}`} value={data.entity} onChange={(e) => setData('entity', e.target.value)} />
                            <InputError message={errors.entity} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`bank_${item.id}`}>Bank</Label>
                            <Input id={`bank_${item.id}`} value={data.bank} onChange={(e) => setData('bank', e.target.value)} />
                            <InputError message={errors.bank} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`rekening_${item.id}`}>No. Rekening (tanpa titik)</Label>
                            <Input id={`rekening_${item.id}`} value={data.rekening} onChange={(e) => setData('rekening', e.target.value)} />
                            <InputError message={errors.rekening} />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor={`display_rekening_${item.id}`}>No. Rekening (tampilan)</Label>
                            <Input
                                id={`display_rekening_${item.id}`}
                                value={data.display_rekening}
                                onChange={(e) => setData('display_rekening', e.target.value)}
                            />
                            <InputError message={errors.display_rekening} />
                        </div>

                        <div className="flex items-center gap-3 md:col-span-2">
                            <Button type="submit" size="sm" disabled={processing}>
                                Simpan
                            </Button>
                            {recentlySuccessful && <span className="text-sm text-muted-foreground">Tersimpan</span>}
                            <Button type="button" size="sm" variant="outline" onClick={onClose} className="ml-auto">
                                Tutup
                            </Button>
                            <Button type="button" size="sm" variant="destructive" onClick={removeItem}>
                                <Trash2 className="h-4 w-4" /> Hapus Item
                            </Button>
                        </div>
                    </form>
                </div>

                <div className="space-y-3">
                    <Label>QR Code</Label>
                    <div className="overflow-hidden rounded-lg border bg-muted" style={{ aspectRatio: 1 }}>
                        {item.qr_url ? (
                            <img src={item.qr_url} alt="" className="h-full w-full object-contain" />
                        ) : (
                            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Belum ada QR</div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" size="sm" onClick={() => fileInputRef.current?.click()}>
                            <ImagePlus className="h-4 w-4" /> {item.qr_url ? 'Ubah' : 'Tambah'}
                        </Button>
                        {item.qr_url && (
                            <Button type="button" size="sm" variant="outline" onClick={removeQr}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
                </div>
            </div>

            <ImageCropperDialog
                open={cropSrc !== null}
                imageSrc={cropSrc}
                aspect={1}
                processing={uploading}
                onClose={() => setCropSrc(null)}
                onCropped={onCropped}
            />
        </div>
    );
}