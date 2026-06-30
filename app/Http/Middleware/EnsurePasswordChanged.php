<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordChanged
{
    /**
     * Routes a forced user may still reach (the password page itself + logout);
     * everything else redirects them back to the password page until they set
     * their own password.
     */
    private const ALLOWED = ['password.edit', 'password.update', 'logout'];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->must_change_password && ! in_array($request->route()?->getName(), self::ALLOWED, true)) {
            return redirect()->route('password.edit');
        }

        return $next($request);
    }
}
