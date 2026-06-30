import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'User', href: '/user' },
    { title: 'Tambah User', href: '/user/create' },
];

export default function UserCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        role: 'user',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('user.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah User" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Tambah User</h1>
                    <p className="text-sm text-muted-foreground">
                        Password akan dibuat otomatis (8 karakter). Setelah disimpan, salin password dari daftar dan kirim ke pengguna.
                    </p>
                </div>

                <Card className="max-w-xl">
                    <CardContent className="p-6">
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama</Label>
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Nama lengkap" required />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="nama@contoh.com"
                                    required
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="role">Peran</Label>
                                <Select value={data.role} onValueChange={(v) => setData('role', v)}>
                                    <SelectTrigger id="role">
                                        <SelectValue placeholder="Pilih peran" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">User</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.role} />
                                <p className="text-xs text-muted-foreground">
                                    Admin dapat mengelola akun pengguna. User hanya dapat mengelola konten.
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing || !data.name || !data.email}>
                                    Simpan
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href={route('user')}>Batal</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
