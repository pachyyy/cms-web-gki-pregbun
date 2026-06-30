import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DndContext, type DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface PelayananListItem {
    id: number;
    title: string;
    subtitle: string;
    image_url: string;
}

function SortableRow({ item, selected, onSelect }: { item: PelayananListItem; selected: boolean; onSelect: (id: number) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'flex items-center gap-2 rounded-lg border p-2 transition-colors',
                selected ? 'border-primary bg-primary/5' : 'bg-card hover:bg-accent',
            )}
        >
            <button
                {...attributes}
                {...listeners}
                type="button"
                className="cursor-grab text-muted-foreground active:cursor-grabbing"
                aria-label="Geser untuk mengatur urutan"
            >
                <GripVertical className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => onSelect(item.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <div className="aspect-[4/3] w-14 shrink-0 overflow-hidden rounded bg-muted">
                    <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                </div>
            </button>
        </div>
    );
}

export default function SortablePelayananList({
    items,
    selectedId,
    onSelect,
    onReorder,
}: {
    items: PelayananListItem[];
    selectedId: number | null;
    onSelect: (id: number) => void;
    onReorder: (ids: number[]) => void;
}) {
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
    const serverSignature = items.map((i) => i.id).join(',');
    const [order, setOrder] = useState(items);

    // Resync only when the server set/order actually changes; keep unsaved local drags otherwise.
    useEffect(() => {
        setOrder(items);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serverSignature]);

    const dirty = order.map((i) => i.id).join(',') !== serverSignature;

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = order.findIndex((i) => i.id === active.id);
            const newIndex = order.findIndex((i) => i.id === over.id);
            setOrder(arrayMove(order, oldIndex, newIndex));
        }
    };

    return (
        <div className="space-y-3">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={order.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                        {order.map((item) => (
                            <SortableRow key={item.id} item={item} selected={item.id === selectedId} onSelect={onSelect} />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {dirty && (
                <div className="flex items-center gap-3">
                    <Button type="button" size="sm" onClick={() => onReorder(order.map((i) => i.id))}>
                        Simpan Urutan
                    </Button>
                    <span className="text-sm text-muted-foreground">Belum disimpan</span>
                </div>
            )}
        </div>
    );
}
