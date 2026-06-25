import { DatePicker } from '@/components/date-picker';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { format, parse } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface Warta {
    id: number;
    service_date: string;
    title: string | null;
    source_url: string | null;
    url: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

const formatLabel = (iso: string) => `Warta — ${format(parse(iso.slice(0, 10), 'yyyy-MM-dd', new Date()), 'EEEE, d MMMM yyyy', { locale: localeId })}`;

// Upcoming Sunday (or today if it is Sunday) as yyyy-MM-dd in local time.
function nextSunday(): string {
    const d = new Date();
    const day = d.getDay();
    d.setDate(d.getDate() + (day === 0 ? 0 : 7 - day));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function Dashboard({ warta }: { warta: Warta[] }) {
    const [dialog, setDialog] = useState<{ open: boolean; record: Warta | null }>({ open: false, record: null });

    const close = () => setDialog({ open: false, record: null });

    const remove = (id: number) => {
        if (confirm('Hapus warta ini?')) {
            router.delete(route('warta.destroy', id), { preserveScroll: true });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardContent className="space-y-4 p-6">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold">Warta Jemaat</h2>
                                <p className="text-sm text-muted-foreground">
                                    Tautan warta (PDF Google Drive). Dua warta terbaru otomatis tampil di website.
                                </p>
                            </div>
                            <Button onClick={() => setDialog({ open: true, record: null })}>
                                <Plus className="h-4 w-4" /> Tambah Warta
                            </Button>
                        </div>

                        {warta.length > 0 ? (
                            <ul className="divide-y">
                                {warta.map((w, index) => (
                                    <li key={w.id} className="flex items-center justify-between gap-4 py-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{w.title || formatLabel(w.service_date)}</p>
                                                {index < 2 && (
                                                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                                        Tampil di web
                                                    </span>
                                                )}
                                            </div>
                                            <a
                                                href={w.source_url ?? w.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block max-w-md truncate text-sm text-muted-foreground underline-offset-2 hover:underline"
                                            >
                                                {w.source_url ?? w.url}
                                            </a>
                                        </div>
                                        <div className="flex shrink-0 gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => setDialog({ open: true, record: w })} aria-label="Edit">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => remove(w.id)} aria-label="Hapus">
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                                Belum ada warta. Klik &ldquo;Tambah Warta&rdquo; untuk menambahkan.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <WartaDialog key={dialog.open ? (dialog.record?.id ?? 'new') : 'closed'} open={dialog.open} record={dialog.record} onClose={close} />
        </AppLayout>
    );
}

function WartaDialog({ open, record, onClose }: { open: boolean; record: Warta | null; onClose: () => void }) {
    const { data, setData, post, put, processing, errors } = useForm({
        service_date: record ? record.service_date.slice(0, 10) : nextSunday(),
        title: record?.title ?? '',
        source_url: record?.source_url ?? record?.url ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (record) {
            put(route('warta.update', record.id), { preserveScroll: true, onSuccess: onClose });
        } else {
            post(route('warta.store'), { preserveScroll: true, onSuccess: onClose });
        }
    };

    return (
        <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{record ? 'Edit Warta' : 'Tambah Warta'}</DialogTitle>
                    <DialogDescription>Pilih tanggal Minggu dan tempel tautan PDF dari Google Drive.</DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="service_date">Tanggal Ibadah (Minggu)</Label>
                        <DatePicker id="service_date" value={data.service_date} onChange={(value) => setData('service_date', value)} />
                        <InputError message={errors.service_date} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="source_url">Tautan Google Drive</Label>
                        <Input
                            id="source_url"
                            type="url"
                            placeholder="https://drive.google.com/file/d/.../view"
                            value={data.source_url}
                            onChange={(e) => setData('source_url', e.target.value)}
                        />
                        <InputError message={errors.source_url} />
                        <p className="text-xs text-muted-foreground">
                            Pastikan file di Google Drive disetel &ldquo;Siapa saja yang memiliki link&rdquo; agar dapat dilihat pengunjung.
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="title">Judul (opsional)</Label>
                        <Input
                            id="title"
                            placeholder="Otomatis dari tanggal bila dikosongkan"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                        />
                        <InputError message={errors.title} />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Simpan
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
