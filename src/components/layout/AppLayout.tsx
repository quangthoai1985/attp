import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useSiteConfig } from "@/contexts/SiteConfigContext"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    LayoutDashboard,
    Store,
    LogOut,
    User,
    Menu,
    X,
    Settings,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    FolderOpen,
    ClipboardCheck,
    Award
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

// Helper to display role in Vietnamese
const getRoleLabel = (role?: string | null) => {
    switch (role) {
        case 'admin': return 'Quản trị viên'
        case 'staff': return 'Cán bộ TYT'
        default: return 'Người dùng'
    }
}

export default function AppLayout() {
    const { user, profile, signOut } = useAuth()
    const { config } = useSiteConfig()
    const navigate = useNavigate()
    const location = useLocation()
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const userMenuRef = useRef<HTMLDivElement>(null)

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false)
    }, [location.pathname])

    // Close mobile menu on window resize to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setMobileMenuOpen(false)
            }
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const handleLogout = async () => {
        await signOut()
        navigate("/login")
    }

    const navigation = [
        { name: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
        { name: "Cơ sở", href: "/facilities", icon: Store },
        { name: "Loại hình", href: "/facility-types", icon: FolderOpen },
        { name: "Thanh kiểm tra", href: "/inspections", icon: ClipboardCheck },
        { name: "Giấy CN", href: "/certificates", icon: Award },
        { name: "Tài khoản", href: "/account", icon: User },
        { name: "Cấu hình", href: "/settings", icon: Settings },
    ]

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-100 via-blue-50/50 to-indigo-100/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30 overflow-hidden p-3 gap-3">
            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.aside
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed left-3 top-3 bottom-3 w-[280px] bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl rounded-2xl shadow-[0_8px_32px_rgba(99,102,241,0.15)] dark:shadow-[0_8px_32px_rgba(99,102,241,0.3)] border border-white/50 dark:border-slate-700/50 z-50 flex flex-col md:hidden overflow-hidden"
                    >
                        {/* Mobile Sidebar Header */}
                        <div className="p-4 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-700/50">
                            <div className="flex items-center gap-3">
                                <img
                                    src={config.logoUrl}
                                    alt="Logo"
                                    className="h-10 w-auto object-contain max-w-[160px]"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://placehold.co/140x40/6366f1/white?text=ATTP'
                                    }}
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setMobileMenuOpen(false)}
                                className="hover:bg-destructive/10 hover:text-destructive rounded-xl"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Mobile Navigation */}
                        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                            {navigation.map((item, index) => {
                                const isActive = location.pathname.startsWith(item.href)
                                return (
                                    <motion.div
                                        key={item.name}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 + 0.1 }}
                                    >
                                        <Link
                                            to={item.href}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                                                isActive
                                                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30"
                                                    : "hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                                            )}
                                        >
                                            <item.icon className="h-5 w-5" />
                                            <span className="font-medium">{item.name}</span>
                                        </Link>
                                    </motion.div>
                                )
                            })}
                        </nav>

                        {/* Mobile User Info & Logout */}
                        <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50 space-y-3">
                            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/50">
                                <Avatar className="h-10 w-10 border-2 border-indigo-200 dark:border-indigo-800 shadow-md">
                                    <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.full_name || "User"} />
                                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold">
                                        {user?.user_metadata?.full_name?.[0] || user?.email?.[0] || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate text-slate-900 dark:text-slate-100">
                                        {user?.user_metadata?.full_name || user?.email || "User"}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {getRoleLabel(profile?.role)}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl"
                                onClick={handleLogout}
                            >
                                <LogOut className="h-5 w-5 mr-2" />
                                Đăng xuất
                            </Button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar - Separated with rounded corners and colored shadow */}
            <motion.aside
                initial={false}
                animate={{ width: sidebarOpen ? 250 : 80 }}
                className="hidden md:flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-2xl shadow-[0_8px_32px_rgba(99,102,241,0.12)] dark:shadow-[0_8px_32px_rgba(99,102,241,0.25)] border border-white/60 dark:border-slate-700/50 z-20 relative"
            >
                {/* Sidebar Toggle Button - Floating on the right edge */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className={cn(
                        "absolute -right-3 top-6 z-30 h-6 w-6 rounded-full",
                        "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
                        "shadow-[0_2px_8px_rgba(99,102,241,0.2)] hover:shadow-[0_4px_12px_rgba(99,102,241,0.3)]",
                        "text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400",
                        "transition-all duration-300 hover:scale-110"
                    )}
                >
                    {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>

                <div className="relative p-3 border-b border-slate-200/50 dark:border-slate-700/50 min-h-[60px] flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        {sidebarOpen ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex justify-center w-full py-2"
                            >
                                <img
                                    src={config.logoUrl}
                                    alt="Logo"
                                    style={{ maxHeight: `${config.logoHeight}px` }}
                                    className="w-auto max-w-full object-contain transition-all duration-300"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://placehold.co/140x40/6366f1/white?text=ATTP'
                                    }}
                                />
                            </motion.div>
                        ) : (
                            <div className="w-full flex justify-center py-1">
                                <img
                                    src={config.logoUrl}
                                    alt="Logo"
                                    className="h-10 w-10 rounded-xl object-cover shadow-md"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://placehold.co/40x40/6366f1/white?text=A'
                                    }}
                                />
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
                    {navigation.map((item) => {
                        const isActive = location.pathname.startsWith(item.href)
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                                    isActive
                                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25"
                                        : "hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                                )}
                            >
                                <item.icon className={cn("h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110", isActive ? "text-white" : "")} />
                                {sidebarOpen && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="font-medium whitespace-nowrap"
                                    >
                                        {item.name}
                                    </motion.span>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* Desktop Sidebar User Section - Removed, moved to header */}
            </motion.aside>

            {/* Main Content Area - Separated with rounded corners and colored shadow */}
            <div className="flex-1 flex flex-col h-full relative overflow-hidden">
                {/* Header - Separated with rounded corners and colored shadow */}
                <header className="h-16 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-500 rounded-t-2xl shadow-[0_4px_20px_rgba(99,102,241,0.3)] flex items-center justify-between px-4 md:px-6 flex-shrink-0 relative z-10">
                    {/* Mobile Menu Button */}
                    <div className="flex items-center gap-3 md:hidden">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMobileMenuOpen(true)}
                            className="relative text-white hover:bg-white/15 rounded-xl"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                        <img
                            src={config.logoUrl}
                            alt="Logo"
                            className="h-8 w-8 rounded-lg object-cover shadow-md"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/32x32/ffffff/6366f1?text=A'
                            }}
                        />
                    </div>

                    {/* Header Title - Left aligned */}
                    <div className="flex-1 hidden sm:block">
                        <h1 className="text-sm md:text-base font-display font-bold text-white tracking-wide drop-shadow-sm">
                            QUẢN LÝ AN TOÀN THỰC PHẨM
                        </h1>
                        <p className="text-xs md:text-sm text-white/85 font-medium">
                            TRUNG TÂM Y TẾ CHÂU ĐỐC
                        </p>
                    </div>

                    {/* User Profile Pill Dropdown */}
                    <div className="relative" ref={userMenuRef}>
                        <button
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className={cn(
                                "flex items-center gap-3 px-3 py-1.5 rounded-full transition-all duration-300",
                                "bg-white/15 border border-white/25 backdrop-blur-sm",
                                "hover:bg-white/25 hover:border-white/40 hover:shadow-[0_0_20px_rgba(255,255,255,0.25)]",
                                "active:scale-95",
                                userMenuOpen && "bg-white/30 shadow-[0_0_25px_rgba(255,255,255,0.35)]"
                            )}
                        >
                            <div className="text-sm text-right hidden sm:block">
                                <p className="font-medium text-white drop-shadow-sm">{user?.user_metadata?.full_name || user?.email || "User"}</p>
                                <p className="text-xs text-white/75">{getRoleLabel(profile?.role)}</p>
                            </div>
                            <Avatar className="h-8 w-8 border-2 border-white/50 shadow-md">
                                <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.full_name || "User"} />
                                <AvatarFallback className="bg-white/30 text-white font-bold text-sm backdrop-blur-sm">
                                    {user?.user_metadata?.full_name?.[0] || user?.email?.[0] || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <ChevronDown className={cn(
                                "h-4 w-4 text-white/85 transition-transform duration-200 hidden sm:block",
                                userMenuOpen && "rotate-180"
                            )} />
                        </button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {userMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-[0_12px_40px_rgba(99,102,241,0.2)] overflow-hidden z-50"
                                >
                                    {/* User Info Header */}
                                    <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border-2 border-indigo-200 dark:border-indigo-800 shadow-md">
                                                <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.full_name || "User"} />
                                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold">
                                                    {user?.user_metadata?.full_name?.[0] || user?.email?.[0] || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate text-slate-900 dark:text-slate-100">
                                                    {user?.user_metadata?.full_name || user?.email || "User"}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {getRoleLabel(profile?.role)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="p-2">
                                        <Link
                                            to="/account"
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                                        >
                                            <Settings className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                            Cài đặt tài khoản
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setUserMenuOpen(false)
                                                handleLogout()
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Đăng xuất
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </header>

                {/* Content Area - Enhanced prominence, connected to header */}
                <main className="flex-1 overflow-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-b-2xl shadow-[0_8px_40px_rgba(99,102,241,0.12),0_0_0_1px_rgba(255,255,255,0.8)] dark:shadow-[0_8px_40px_rgba(99,102,241,0.2)] border-x border-b border-white/80 dark:border-slate-700/50 p-4 md:p-6 scroll-smooth -mt-1">
                    <div className="max-w-7xl mx-auto h-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}
