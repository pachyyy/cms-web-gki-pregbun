import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Check, Copy, Eye, EyeOff, KeyRound, Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';

interface UserRow {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'user';
    generated_password: string | null;
    created_at: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User',
        href: '/user',
    },
];

export default function UserIndex({ users }: { users: UserRow[] }) {
    const currentUserId = usePage<SharedData>().props.auth.user.id;
    const [revealed, setRevealed] = useState<Set<number>>(new Set());
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const toggleReveal = (id: number) =>
        setRevealed((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });

    const copyPassword = async (id: number, password: string) => {
        await navigator.clipboard.writeText(password);
        setCopiedId(id);
        setTimeout(() => setCopiedId((curr) => (curr === id ? null : curr)), 1500);
    };

    const regenerate = (u: UserRow) => {
        if (confirm(`Buat password baru untuk ${u.name}? Password lama tidak akan berlaku lagi.`)) {
            router.post(route('user.regenerate', u.id), {}, { preserveScroll: true });
        }
    };

    const remove = (u: UserRow) => {
        if (confirm(`Hapus akun ${u.name} (${u.email})? Tindakan ini tidak dapat dibatalkan.`)) {
            router.delete(route('user.destroy', u.id), { preserveScroll: true });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">User</h1>
                        <p className="text-sm text-muted-foreground">Kelola akun pengguna. Kirim password yang dibuat ke pengguna terkait.</p>
                    </div>
                    <Button asChild>
                        <Link href={route('user.create')}>
                            <UserPlus className="h-4 w-4" /> Tambah User
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b text-left text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Nama</th>
                                        <th className="px-4 py-3 font-medium">Email</th>
                                        <th className="px-4 py-3 font-medium">Peran</th>
                                        <th className="px-4 py-3 font-medium">Password</th>
                                        <th className="px-4 py-3 font-medium">Dibuat</th>
                                        <th className="px-4 py-3 text-right font-medium">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => {
                                        const isSelf = u.id === currentUserId;
                                        const isRevealed = revealed.has(u.id);
                                        return (
                                            <tr key={u.id} className="border-b last:border-0">
                                                <td className="px-4 py-3 font-medium">
                                                    {u.name}
                                                    {isSelf && <span className="ml-2 text-xs text-muted-foreground">(Anda)</span>}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                                                        {u.role === 'admin' ? 'Admin' : 'User'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {u.generated_password ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-mono ${isRevealed ? '' : 'blur-sm select-none'}`}>
                                                                {u.generated_password}
                                                            </span>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7"
                                                                onClick={() => toggleReveal(u.id)}
                                                                aria-label={isRevealed ? 'Sembunyikan password' : 'Tampilkan password'}
                                                            >
                                                                {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7"
                                                                onClick={() => copyPassword(u.id, u.generated_password!)}
                                                                aria-label="Salin password"
                                                            >
                                                                {copiedId === u.id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {format(new Date(u.created_at), 'd MMM yyyy', { locale: localeId })}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end gap-2">
                                                        <Button type="button" variant="outline" size="sm" onClick={() => regenerate(u)}>
                                                            <KeyRound className="h-4 w-4" /> Password Baru
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => remove(u)}
                                                            disabled={isSelf}
                                                            title={isSelf ? 'Tidak dapat menghapus akun sendiri' : undefined}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {users.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                                                Belum ada pengguna.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
