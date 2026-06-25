import { Button } from '@/components/ui/button';
import { DndContext, type DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface GridImage {
    id: number;
    url: string;
}

function SortableThumb({ image, onDelete }: { image: GridImage; onDelete: (id: number) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
            <img src={image.url} alt="" className="h-full w-full object-cover" />
            <button
                {...attributes}
                {...listeners}
                type="button"
                className="absolute top-2 left-2 cursor-grab rounded bg-black/50 p-1.5 text-white active:cursor-grabbing"
                aria-label="Geser untuk mengatur urutan"
            >
                <GripVertical className="h-5 w-5" />
            </button>
            <button
                type="button"
                onClick={() => onDelete(image.id)}
                className="absolute top-2 right-2 rounded bg-destructive p-1.5 text-white"
                aria-label="Hapus gambar"
            >
                <X className="h-5 w-5" />
            </button>
        </div>
    );
}

export default function SortableImageGrid({
    images,
    onReorder,
    onDelete,
}: {
    images: GridImage[];
    onReorder: (ids: number[]) => void;
    onDelete: (id: number) => void;
}) {
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    // Local ordering: drag updates this only. Persisted to the server on "Simpan".
    const serverSignature = images.map((i) => i.id).join(',');
    const [items, setItems] = useState(images);

    // Resync when the server data actually changes (add/delete/saved reorder),
    // but ignore re-renders that keep the same image set/order so unsaved
    // local arrangements aren't lost.
    useEffect(() => {
        setItems(images);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serverSignature]);

    const dirty = items.map((i) => i.id).join(',') !== serverSignature;

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((i) => i.id === active.id);
            const newIndex = items.findIndex((i) => i.id === over.id);
            setItems(arrayMove(items, oldIndex, newIndex));
        }
    };

    return (
        <div className="space-y-4">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {items.map((image) => (
                            <SortableThumb key={image.id} image={image} onDelete={onDelete} />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {dirty && (
                <div className="flex items-center gap-3">
                    <Button type="button" onClick={() => onReorder(items.map((i) => i.id))}>
                        Simpan
                    </Button>
                    <span className="text-sm text-muted-foreground">Urutan belum disimpan</span>
                </div>
            )}
        </div>
    );
}
