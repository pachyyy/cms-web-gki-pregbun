import { DatePicker } from '@/components/date-picker';
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
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Trash2 } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

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

const formatPercent = (n: number) =>
    `${n.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

const formatTanggal = (iso: string) => {
    if (!iso) return '-';
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        .format(new Date(iso))
        .toUpperCase();
};

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

export default function Pembangunan({ latest, history }: { latest: PembangunanUpdate | null; history: PembangunanUpdate[] }) {
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

    const preview = derive(
        data.target_persembahan,
        data.persembahan_pembangunan,
        data.janji_iman_terealisasi,
        data.janji_iman_belum_terealisasi,
    );

    const moneyFields: { key: keyof typeof data; label: string }[] = [
        { key: 'target_persembahan', label: 'Target Persembahan' },
        { key: 'persembahan_pembangunan', label: 'Persembahan Pembangunan' },
        { key: 'janji_iman_terealisasi', label: 'Janji Iman Sudah Terealisasi' },
        { key: 'janji_iman_belum_terealisasi', label: 'Janji Iman Belum Terealisasi' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pembangunan" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
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
                                    <DatePicker
                                        id="update_date"
                                        value={data.update_date}
                                        onChange={(value) => setData('update_date', value)}
                                    />
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
            </div>
        </AppLayout>
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

function HistoryList({
    history,
    latestId,
    onDelete,
}: {
    history: PembangunanUpdate[];
    latestId: number;
    onDelete: (id: number) => void;
}) {
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
                                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                            Terbaru
                                        </span>
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
