import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutDashboard, UsersRound, CalendarArrowUp, HandHeart, List, Ban, Hammer, UserRoundPen, Church, HandCoins } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'User',
        url: '/user',
        icon: UserRoundPen,
    },
    {
        title: 'Tentang Kami',
        url: '/tentangkami',
        icon: UsersRound,
    },
    {
        title: 'Kebaktian',
        url: '/kebaktian',
        icon: Church,
    },
    {
        title: 'Event',
        url: '/event',
        icon: CalendarArrowUp,
    },
    {
        title: 'Pelayanan',
        url: '/pelayanan',
        icon: HandHeart,
    },
    {
        title: 'Komisi',
        url: '/komisi',
        icon: List,
    },
    {
        title: 'Pembangunan',
        url: '/pembangunan',
        icon: Hammer,
    },
    {
        title: 'Persembahan',
        url: '/persembahan',
        icon: HandCoins,
    },
    {
        title: 'Dummy',
        url: '/dummy',
        icon: Ban,
    },
];

// const footerNavItems: NavItem[] = [
//     {
//         title: 'Repository',
//         url: 'https://github.com/laravel/react-starter-kit',
//         icon: Folder,
//     },
//     {
//         title: 'Documentation',
//         url: 'https://laravel.com/docs/starter-kits',
//         icon: BookOpen,
//     },
// ];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                {/* <NavFooter items={footerNavItems} className="mt-auto" /> */}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
