import { cn } from '@/lib/utils';
import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon({ className, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
    return <img src="/images/logo-white.svg" alt="GKI Pregbun" className={cn('invert dark:invert-0', className)} {...props} />;
}
