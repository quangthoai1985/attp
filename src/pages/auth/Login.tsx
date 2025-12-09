import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { useSiteConfig } from "@/contexts/SiteConfigContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function Login() {
    const navigate = useNavigate()
    const { config } = useSiteConfig()
    const [loginId, setLoginId] = useState("") // Can be email or username
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        let email = loginId

        // If not an email format, try to lookup username
        if (!loginId.includes("@")) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: profile, error: lookupError } = await (supabase
                    .from("profiles") as any)
                    .select("id, email")
                    .eq("username", loginId)
                    .single()

                if (lookupError || !profile) {
                    setError("Không tìm thấy tài khoản với tên đăng nhập này")
                    setLoading(false)
                    return
                }

                // Use email from profile if available, otherwise fallback to pattern
                if (profile.email) {
                    email = profile.email
                } else {
                    // Fallback for accounts without email in profile
                    email = `${loginId.toLowerCase()}@attp.local`
                }
            } catch {
                // If lookup fails, try using the input directly
                email = loginId
            }
        }

        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (authError) {
            // If the generated email failed, show friendly error
            if (!loginId.includes("@")) {
                setError("Tên đăng nhập hoặc mật khẩu không đúng")
            } else {
                setError(authError.message)
            }
            setLoading(false)
        } else {
            navigate("/dashboard")
        }
    }

    return (
        <div
            className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/90 via-purple-600/80 to-primary/90"
            style={config.loginBackgroundUrl ? {
                backgroundImage: `url(${config.loginBackgroundUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            } : {}}
        >
            {/* Overlay for better readability */}
            <div className="absolute inset-0 bg-black/20" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-md relative z-10 mx-4"
            >
                <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
                    <CardHeader className="space-y-4 text-center pb-2">
                        {/* Logo */}
                        <div className="flex justify-center">
                            <img
                                src={config.logoUrl}
                                alt="Logo"
                                className="h-24 w-auto object-contain drop-shadow-sm" // Increased from h-16
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/140x40/6366f1/white?text=ATTP+Logo'
                                }}
                            />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-display uppercase font-bold text-red-600 leading-tight drop-shadow-sm">
                                Hệ thống Quản lý<br />An toàn thực phẩm
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <form onSubmit={handleLogin}>
                        <CardContent className="grid gap-4 mt-2">
                            <div className="grid gap-2">
                                <Label htmlFor="loginId">Tên đăng nhập hoặc Email</Label>
                                <Input
                                    id="loginId"
                                    type="text"
                                    placeholder="username hoặc email@example.com"
                                    value={loginId}
                                    onChange={(e) => setLoginId(e.target.value)}
                                    required
                                    className="h-11"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Mật khẩu</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-11"
                                />
                            </div>
                            {error && (
                                <div className="text-sm text-destructive font-medium text-center p-2 bg-destructive/10 rounded-lg">
                                    {error}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex-col gap-4 pt-2">
                            <Button className="w-full h-11 text-base font-bold uppercase transition-all hover:scale-[1.02]" type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? "Đang xử lý..." : "Đăng nhập"}
                            </Button>
                            <div className="bg-slate-50 w-[calc(100%+32px)] text-center py-4 border-t mt-2 -mb-6 rounded-b-xl">
                                <p className="text-sm font-bold text-primary uppercase">
                                    Trung tâm Y tế Châu Đốc
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    Copyright © 2025. All rights reserved.
                                </p>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </motion.div>
        </div>
    )
}
