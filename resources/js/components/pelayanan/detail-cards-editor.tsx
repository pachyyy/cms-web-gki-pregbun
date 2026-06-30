import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DndContext, type DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export interface DetailItem {
    id: number;
    label: string;
    value: string;
}

interface Row {
    key: string;
    id: number | null;
    label: string;
    value: string;
}

export interface DetailPayload {
    id: number | null;
    label: string;
    value: string;
    // Index signature so the array is assignable to Inertia's FormDataConvertible.
    [key: string]: string | number | null;
}

let tempCounter = 0;
const nextKey = () => `new-${tempCounter++}`;

const toRows = (details: DetailItem[]): Row[] => details.map((d) => ({ key: `e-${d.id}`, id: d.id, label: d.label, value: d.value }));

const signature = (rows: { id: number | null; label: string; value: string }[]) => JSON.stringify(rows.map((r) => [r.id, r.label, r.value]));

function SortableCard({ row, onChange, onRemove }: { row: Row; onChange: (key: string, field: 'label' | 'value', v: string) => void; onRemove: (key: string) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.key });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

    return (
        <div ref={setNodeRef} style={style} className="flex items-start gap-2 rounded-lg border bg-card p-2">
            <button
                {...attributes}
                {...listeners}
                type="button"
                className="mt-2 cursor-grab text-muted-foreground active:cursor-grabbing"
                aria-label="Geser untuk mengatur urutan"
            >
                <GripVertical className="h-5 w-5" />
            </button>
            <div className="grid flex-1 items-start gap-2 sm:grid-cols-[10rem_1fr]">
                <Input placeholder="LABEL (mis. KONSELOR)" value={row.label} onChange={(e) => onChange(row.key, 'label', e.target.value)} />
                <textarea
                    placeholder="Isi (mis. Ibu Enny Dewi...)"
                    rows={2}
                    value={row.value}
                    onChange={(e) => onChange(row.key, 'value', e.target.value)}
                    className="flex min-h-10 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                />
            </div>
            <Button type="button" variant="ghost" size="icon" className="mt-0.5 shrink-0" onClick={() => onRemove(row.key)} aria-label="Hapus kartu">
                <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
        </div>
    );
}

export default function DetailCardsEditor({
    details,
    onSave,
    saving,
}: {
    details: DetailItem[];
    onSave: (payload: DetailPayload[]) => void;
    saving?: boolean;
}) {
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const serverRows = useMemo(() => toRows(details), [details]);
    const serverSignature = signature(serverRows);
    const [rows, setRows] = useState<Row[]>(serverRows);

    // Resync when the server set actually changes (saved/selected another pelayanan).
    useEffect(() => {
        setRows(toRows(details));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serverSignature]);

    const dirty = signature(rows) !== serverSignature;
    const hasEmpty = rows.some((r) => !r.label.trim() || !r.value.trim());

    const change = (key: string, field: 'label' | 'value', v: string) =>
        setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: v } : r)));

    const remove = (key: string) => setRows((prev) => prev.filter((r) => r.key !== key));

    const add = () => setRows((prev) => [...prev, { key: nextKey(), id: null, label: '', value: '' }]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = rows.findIndex((r) => r.key === active.id);
            const newIndex = rows.findIndex((r) => r.key === over.id);
            setRows(arrayMove(rows, oldIndex, newIndex));
        }
    };

    const save = () => onSave(rows.map((r) => ({ id: r.id, label: r.label.trim(), value: r.value.trim() })));

    return (
        <div className="space-y-3">
            {rows.length > 0 ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={rows.map((r) => r.key)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                            {rows.map((row) => (
                                <SortableCard key={row.key} row={row} onChange={change} onRemove={remove} />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            ) : (
                <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">Belum ada kartu detail.</p>
            )}

            <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="outline" size="sm" onClick={add}>
                    <Plus className="h-4 w-4" /> Tambah Kartu
                </Button>
                <Button type="button" size="sm" onClick={save} disabled={!dirty || hasEmpty || saving}>
                    {saving ? 'Menyimpan...' : 'Simpan Detail'}
                </Button>
                {dirty && !hasEmpty && <span className="text-sm text-muted-foreground">Belum disimpan</span>}
                {hasEmpty && <span className="text-sm text-destructive">Label dan isi tidak boleh kosong</span>}
            </div>
        </div>
    );
}
