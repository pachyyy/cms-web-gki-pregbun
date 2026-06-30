<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        $users = User::orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'generated_password', 'created_at'])
            ->makeVisible('generated_password');

        return Inertia::render('user', [
            'users' => $users,
        ]);
    }

    public function create()
    {
        return Inertia::render('user/create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'role' => ['required', Rule::in(['admin', 'user'])],
        ]);

        $password = $this->generatePassword();

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'password' => $password,            // hashed via cast (login credential)
            'generated_password' => $password,  // encrypted via cast (admin can re-view/send)
            'must_change_password' => true,     // forced to set their own on first login
            'email_verified_at' => now(),       // admin-provisioned, no verification email
        ]);

        return redirect()->route('user')->with('success', 'Akun pengguna berhasil dibuat.');
    }

    public function regeneratePassword(User $user)
    {
        $password = $this->generatePassword();

        $user->update([
            'password' => $password,
            'generated_password' => $password,
            'must_change_password' => true,
        ]);

        return back()->with('success', 'Password baru berhasil dibuat.');
    }

    public function destroy(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return back()->withErrors(['user' => 'Anda tidak dapat menghapus akun Anda sendiri.']);
        }

        $user->delete();

        return redirect()->route('user')->with('success', 'Akun pengguna berhasil dihapus.');
    }

    /**
     * 8-char alphanumeric password excluding look-alike characters (0/O, 1/l/I)
     * so it's easy for the admin to read and pass on.
     */
    private function generatePassword(int $length = 8): string
    {
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
        $max = strlen($alphabet) - 1;

        $password = '';
        for ($i = 0; $i < $length; $i++) {
            $password .= $alphabet[random_int(0, $max)];
        }

        return $password;
    }
}
