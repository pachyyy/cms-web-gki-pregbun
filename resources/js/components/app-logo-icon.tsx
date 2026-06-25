import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return <img src="/images/logo-white.svg" className='invert dark:invert-0' alt="GKI Pregbun" {...props} />;
}
