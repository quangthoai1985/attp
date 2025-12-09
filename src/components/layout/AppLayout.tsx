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
    ChevronDown
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
        { name: "Tài khoản", href: "/account", icon: User },
        { name: "Cấu hình", href: "/settings", icon: Settings },
    ]

    return (
        <div className="flex h-screen bg-background overflow-hidden">
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
                        className="fixed left-0 top-0 bottom-0 w-[280px] bg-card border-r shadow-2xl z-50 flex flex-col md:hidden"
                    >
                        {/* Mobile Sidebar Header */}
                        <div className="p-4 flex items-center justify-between border-b border-border/50">
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
                                className="hover:bg-destructive/10 hover:text-destructive"
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
                                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                                                    : "hover:bg-accent text-muted-foreground hover:text-foreground"
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
                        <div className="p-4 border-t border-border/50 space-y-3">
                            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-muted/50">
                                <Avatar className="h-10 w-10 border border-primary/20">
                                    <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.full_name || "User"} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                        {user?.user_metadata?.full_name?.[0] || user?.email?.[0] || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">
                                        {user?.user_metadata?.full_name || user?.email || "User"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {getRoleLabel(profile?.role)}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
                                onClick={handleLogout}
                            >
                                <LogOut className="h-5 w-5 mr-2" />
                                Đăng xuất
                            </Button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: sidebarOpen ? 250 : 80 }}
                className="hidden md:flex flex-col border-r bg-card/50 backdrop-blur-xl h-full shadow-sm z-20 relative"
            >
                <div className="relative p-2 border-b border-border/50 min-h-[60px] flex flex-col justify-center">
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
                                    className="h-10 w-10 rounded-lg object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://placehold.co/40x40/6366f1/white?text=A'
                                    }}
                                />
                            </div>
                        )}
                    </AnimatePresence>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className={cn("absolute top-2 right-2 text-muted-foreground hover:text-foreground", !sidebarOpen && "static mx-auto mt-2")}
                    >
                        {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                    </Button>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navigation.map((item) => {
                        const isActive = location.pathname.startsWith(item.href)
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-md"
                                        : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                                )}
                            >
                                <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-primary-foreground" : "")} />
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

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full relative overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b border-primary-foreground/10 bg-primary sticky top-0 z-10 flex items-center justify-between px-4 md:px-6 shadow-lg">
                    {/* Mobile Menu Button */}
                    <div className="flex items-center gap-3 md:hidden">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMobileMenuOpen(true)}
                            className="relative text-white hover:bg-white/10"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                        <img
                            src={config.logoUrl}
                            alt="Logo"
                            className="h-8 w-8 rounded-lg object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/32x32/ffffff/6366f1?text=A'
                            }}
                        />
                    </div>

                    {/* Header Title - Left aligned */}
                    <div className="flex-1 hidden sm:block">
                        <h1 className="text-sm md:text-base font-display font-bold text-white tracking-wide">
                            QUẢN LÝ AN TOÀN THỰC PHẨM
                        </h1>
                        <p className="text-xs md:text-sm text-white/80 font-medium">
                            TRUNG TÂM Y TẾ CHÂU ĐỐC
                        </p>
                    </div>

                    {/* User Profile Pill Dropdown */}
                    <div className="relative" ref={userMenuRef}>
                        <button
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className={cn(
                                "flex items-center gap-3 px-3 py-1.5 rounded-full transition-all duration-300",
                                "bg-white/10 border border-white/20",
                                "hover:bg-white/20 hover:border-white/40 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]",
                                "active:scale-95",
                                userMenuOpen && "bg-white/25 shadow-[0_0_25px_rgba(255,255,255,0.4)]"
                            )}
                        >
                            <div className="text-sm text-right hidden sm:block">
                                <p className="font-medium text-white">{user?.user_metadata?.full_name || user?.email || "User"}</p>
                                <p className="text-xs text-white/70">{getRoleLabel(profile?.role)}</p>
                            </div>
                            <Avatar className="h-8 w-8 border border-white/40">
                                <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.full_name || "User"} />
                                <AvatarFallback className="bg-white/30 text-white font-bold text-sm backdrop-blur-sm">
                                    {user?.user_metadata?.full_name?.[0] || user?.email?.[0] || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <ChevronDown className={cn(
                                "h-4 w-4 text-white/80 transition-transform duration-200 hidden sm:block",
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
                                    className="absolute right-0 mt-2 w-56 rounded-xl bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl overflow-hidden z-50"
                                >
                                    {/* User Info Header */}
                                    <div className="p-4 border-b border-border/50 bg-muted/30">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border border-primary/20">
                                                <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.full_name || "User"} />
                                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                    {user?.user_metadata?.full_name?.[0] || user?.email?.[0] || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">
                                                    {user?.user_metadata?.full_name || user?.email || "User"}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
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
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors"
                                        >
                                            <Settings className="h-4 w-4 text-muted-foreground" />
                                            Cài đặt tài khoản
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setUserMenuOpen(false)
                                                handleLogout()
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
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

                {/* Content Area */}
                <main className="flex-1 overflow-auto p-4 md:p-6 scroll-smooth">
                    <div className="max-w-7xl mx-auto h-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}
