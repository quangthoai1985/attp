import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import {
    LayoutDashboard,
    Store,
    LogOut,
    User,
    Menu,
    X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function AppLayout() {
    const { user, signOut } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [sidebarOpen, setSidebarOpen] = useState(true)

    const handleLogout = async () => {
        await signOut()
        navigate("/login")
    }

    const navigation = [
        { name: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
        { name: "Cơ sở", href: "/facilities", icon: Store },
        { name: "Tài khoản", href: "/account", icon: User },
        // { name: "Cài đặt", href: "/settings", icon: Settings },
    ]

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: sidebarOpen ? 250 : 80 }}
                className="hidden md:flex flex-col border-r bg-card/50 backdrop-blur-xl h-full shadow-sm z-20 relative"
            >
                <div className="p-4 flex items-center justify-between border-b border-border/50">
                    <AnimatePresence mode="wait">
                        {sidebarOpen ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="font-bold text-xl text-primary tracking-tight whitespace-nowrap"
                            >
                                Quản lý ATTP
                            </motion.div>
                        ) : (
                            <div className="w-full text-center font-bold text-xl text-primary tracking-tight">Q</div>
                        )}
                    </AnimatePresence>
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden md:flex">
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

                <div className="p-4 border-t border-border/50">
                    <Button
                        variant="ghost"
                        className={cn("w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10", !sidebarOpen && "justify-center px-2")}
                        onClick={handleLogout}
                    >
                        <LogOut className="h-5 w-5 flex-shrink-0" />
                        {sidebarOpen && <span className="ml-2">Đăng xuất</span>}
                    </Button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full relative overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b bg-background/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-6 shadow-sm">
                    <div className="flex items-center gap-2 md:hidden">
                        {/* Mobile Sidebar Trigger placeholder - for now just logo */}
                        <div className="font-bold text-lg">ATTP</div>
                    </div>

                    <div className="flex-1"></div>

                    <div className="flex items-center gap-4">
                        <div className="text-sm text-right hidden sm:block">
                            <p className="font-medium">{user?.user_metadata?.full_name || user?.email || "User"}</p>
                            <p className="text-xs text-muted-foreground capitalize">{user?.role || "Staff"}</p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                            {user?.user_metadata?.full_name?.[0] || user?.email?.[0] || "U"}
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-auto p-6 scroll-smooth">
                    <div className="max-w-7xl mx-auto h-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}
