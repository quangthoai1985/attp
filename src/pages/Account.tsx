import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { createUserAccount, updateUserPassword, getAllUsers, deleteUserAccount, type CreateUserData } from "@/lib/adminApi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { PageTransition } from "@/components/layout/PageTransition"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    User,
    Shield,
    Key,
    Users,
    Plus,
    Loader2,
    Check,
    X,
    Trash2,
    Edit,
    Eye,
    EyeOff,
    AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SubAccount {
    id: string
    username: string | null
    full_name: string | null
    role: 'admin' | 'staff'
    managed_area: string | null
    created_at: string
}

export default function AccountPage() {
    const { user, profile, isAdmin } = useAuth()

    // Profile state
    const [fullName, setFullName] = useState(profile?.full_name || "")
    const [username, setUsername] = useState(profile?.username || "")
    const [profileSaving, setProfileSaving] = useState(false)
    const [profileStatus, setProfileStatus] = useState<'idle' | 'saved' | 'error'>('idle')

    // Password state
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [passwordSaving, setPasswordSaving] = useState(false)
    const [passwordStatus, setPasswordStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [passwordError, setPasswordError] = useState("")

    // Sub-accounts state
    const [subAccounts, setSubAccounts] = useState<SubAccount[]>([])
    const [loadingAccounts, setLoadingAccounts] = useState(false)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [creating, setCreating] = useState(false)
    const [createError, setCreateError] = useState("")

    // New user form
    const [newUser, setNewUser] = useState<CreateUserData>({
        username: "",
        email: "",
        password: "",
        full_name: "",
        role: "staff",
        managed_area: ""
    })

    // Change password for other user
    const [changePasswordUserId, setChangePasswordUserId] = useState<string | null>(null)
    const [changePasswordValue, setChangePasswordValue] = useState("")
    const [changingPassword, setChangingPassword] = useState(false)

    // Load profile on mount
    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || "")
            setUsername(profile.username || "")
        }
    }, [profile])

    // Load sub-accounts for admin
    useEffect(() => {
        if (isAdmin) {
            loadSubAccounts()
        }
    }, [isAdmin])

    const loadSubAccounts = async () => {
        setLoadingAccounts(true)
        try {
            const data = await getAllUsers()
            // Filter out current user - cast data for type safety
            const accounts = (data || []) as SubAccount[]
            setSubAccounts(accounts.filter(acc => acc.id !== user?.id))
        } catch (err) {
            console.error("Failed to load accounts:", err)
        } finally {
            setLoadingAccounts(false)
        }
    }

    const handleSaveProfile = async () => {
        if (!user) return
        setProfileSaving(true)
        setProfileStatus('idle')

        try {
            const updateData = {
                full_name: fullName,
                username: username || null
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase
                .from("profiles") as any)
                .update(updateData)
                .eq("id", user.id)

            if (error) throw error

            // Also update user metadata
            await supabase.auth.updateUser({
                data: { full_name: fullName }
            })

            setProfileStatus('saved')
            setTimeout(() => setProfileStatus('idle'), 2000)
        } catch (err) {
            console.error(err)
            setProfileStatus('error')
            setTimeout(() => setProfileStatus('idle'), 3000)
        } finally {
            setProfileSaving(false)
        }
    }

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setPasswordError("Mật khẩu xác nhận không khớp")
            return
        }
        if (newPassword.length < 6) {
            setPasswordError("Mật khẩu phải có ít nhất 6 ký tự")
            return
        }

        setPasswordSaving(true)
        setPasswordError("")
        setPasswordStatus('idle')

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            })

            if (error) throw error

            setPasswordStatus('success')
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
            setTimeout(() => setPasswordStatus('idle'), 3000)
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Đổi mật khẩu thất bại"
            setPasswordError(errorMessage)
            setPasswordStatus('error')
        } finally {
            setPasswordSaving(false)
        }
    }

    const handleCreateUser = async () => {
        if (!user) return

        // Validate
        if (!newUser.username || !newUser.email || !newUser.password || !newUser.full_name) {
            setCreateError("Vui lòng điền đầy đủ thông tin")
            return
        }
        if (!newUser.email.includes("@")) {
            setCreateError("Email không hợp lệ")
            return
        }
        if (newUser.password.length < 6) {
            setCreateError("Mật khẩu phải có ít nhất 6 ký tự")
            return
        }

        setCreating(true)
        setCreateError("")

        try {
            await createUserAccount(newUser, user.id)

            // Reset form and close dialog
            setNewUser({
                username: "",
                email: "",
                password: "",
                full_name: "",
                role: "staff",
                managed_area: ""
            })
            setCreateDialogOpen(false)

            // Refresh list
            loadSubAccounts()
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Tạo tài khoản thất bại"
            setCreateError(errorMessage)
        } finally {
            setCreating(false)
        }
    }

    const handleChangeUserPassword = async () => {
        if (!changePasswordUserId || !changePasswordValue) return
        if (changePasswordValue.length < 6) return

        setChangingPassword(true)
        try {
            await updateUserPassword({
                userId: changePasswordUserId,
                newPassword: changePasswordValue
            })
            setChangePasswordUserId(null)
            setChangePasswordValue("")
        } catch (err) {
            console.error("Failed to change password:", err)
        } finally {
            setChangingPassword(false)
        }
    }

    const handleDeleteUser = async (userId: string) => {
        try {
            await deleteUserAccount(userId)
            loadSubAccounts()
        } catch (err) {
            console.error("Failed to delete user:", err)
        }
    }

    const generateEmail = (username: string) => {
        if (username && !newUser.email) {
            setNewUser(prev => ({
                ...prev,
                email: `${username.toLowerCase().replace(/\s+/g, '')}@attp.local`
            }))
        }
    }

    return (
        <PageTransition className="space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-primary">Tài khoản</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
                    Quản lý tài khoản
                </h1>
                <p className="text-muted-foreground">
                    Cập nhật thông tin cá nhân và quản lý tài khoản hệ thống
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Profile Card */}
                <Card className="border-0 shadow-soft">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Thông tin cá nhân
                        </CardTitle>
                        <CardDescription>
                            Cập nhật họ tên và tên đăng nhập của bạn
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Avatar & Role */}
                        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                            <Avatar className="h-16 w-16 border-2 border-primary/20">
                                <AvatarImage src={user?.user_metadata?.avatar_url} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                                    {fullName?.[0] || user?.email?.[0] || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium text-lg">{fullName || "Chưa đặt tên"}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant={isAdmin ? "default" : "secondary"}>
                                        <Shield className="h-3 w-3 mr-1" />
                                        {isAdmin ? "Admin" : "Nhân viên"}
                                    </Badge>
                                    {username && (
                                        <span className="text-sm text-muted-foreground">@{username}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="username">Tên đăng nhập</Label>
                            <Input
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Nhập tên đăng nhập"
                            />
                            <p className="text-xs text-muted-foreground">
                                Dùng để đăng nhập thay cho email
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fullName">Họ và tên</Label>
                            <Input
                                id="fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Nhập họ và tên"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={user?.email || ""} disabled className="bg-muted" />
                            <p className="text-xs text-muted-foreground">Email không thể thay đổi</p>
                        </div>

                        <Button
                            className="w-full"
                            onClick={handleSaveProfile}
                            disabled={profileSaving}
                        >
                            {profileSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {profileStatus === 'saved' && <Check className="h-4 w-4 mr-2" />}
                            {profileStatus === 'error' && <X className="h-4 w-4 mr-2" />}
                            {profileSaving ? "Đang lưu..." : profileStatus === 'saved' ? "Đã lưu" : "Lưu thay đổi"}
                        </Button>
                    </CardContent>
                </Card>

                {/* Password Card */}
                <Card className="border-0 shadow-soft">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5 text-orange-500" />
                            Đổi mật khẩu
                        </CardTitle>
                        <CardDescription>
                            Cập nhật mật khẩu đăng nhập của bạn
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                            <div className="relative">
                                <Input
                                    id="currentPassword"
                                    type={showPassword ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Nhập mật khẩu hiện tại"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newPassword">Mật khẩu mới</Label>
                            <Input
                                id="newPassword"
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                            <Input
                                id="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Nhập lại mật khẩu mới"
                            />
                        </div>

                        {passwordError && (
                            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                                <AlertCircle className="h-4 w-4" />
                                {passwordError}
                            </div>
                        )}

                        {passwordStatus === 'success' && (
                            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                                <Check className="h-4 w-4" />
                                Đổi mật khẩu thành công!
                            </div>
                        )}

                        <Button
                            className="w-full"
                            onClick={handleChangePassword}
                            disabled={passwordSaving || !newPassword || !confirmPassword}
                        >
                            {passwordSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {passwordSaving ? "Đang xử lý..." : "Đổi mật khẩu"}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Sub-Accounts Section - Admin Only */}
            {isAdmin && (
                <Card className="border-0 shadow-soft">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-blue-500" />
                                    Quản lý tài khoản
                                </CardTitle>
                                <CardDescription>
                                    Tạo và quản lý tài khoản người dùng trong hệ thống
                                </CardDescription>
                            </div>
                            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Tạo tài khoản
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Tạo tài khoản mới</DialogTitle>
                                        <DialogDescription>
                                            Tạo tài khoản con với quyền thấp hơn
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Tên đăng nhập *</Label>
                                            <Input
                                                value={newUser.username}
                                                onChange={(e) => {
                                                    setNewUser(prev => ({ ...prev, username: e.target.value }))
                                                    generateEmail(e.target.value)
                                                }}
                                                placeholder="vd: nhanvien01"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Họ và tên *</Label>
                                            <Input
                                                value={newUser.full_name}
                                                onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
                                                placeholder="Nguyễn Văn A"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email *</Label>
                                            <Input
                                                type="email"
                                                value={newUser.email}
                                                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                                                placeholder="email@example.com"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Tự động tạo từ tên đăng nhập nếu để trống
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Mật khẩu *</Label>
                                            <Input
                                                type="password"
                                                value={newUser.password}
                                                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                                                placeholder="Tối thiểu 6 ký tự"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Vai trò</Label>
                                            <Select
                                                value={newUser.role}
                                                onValueChange={(value: 'admin' | 'staff') => setNewUser(prev => ({ ...prev, role: value }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="staff">Nhân viên</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Khu vực quản lý</Label>
                                            <Input
                                                value={newUser.managed_area || ""}
                                                onChange={(e) => setNewUser(prev => ({ ...prev, managed_area: e.target.value }))}
                                                placeholder="Để trống nếu quản lý toàn bộ"
                                            />
                                        </div>

                                        {createError && (
                                            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                                                <AlertCircle className="h-4 w-4" />
                                                {createError}
                                            </div>
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                            Hủy
                                        </Button>
                                        <Button onClick={handleCreateUser} disabled={creating}>
                                            {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                            Tạo tài khoản
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loadingAccounts ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : subAccounts.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p>Chưa có tài khoản nào</p>
                                <p className="text-sm">Bấm "Tạo tài khoản" để thêm mới</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {subAccounts.map((account) => (
                                    <div
                                        key={account.id}
                                        className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarFallback className={cn(
                                                    "font-bold",
                                                    account.role === 'admin' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                                )}>
                                                    {account.full_name?.[0] || "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">{account.full_name || "Chưa đặt tên"}</p>
                                                    <Badge variant={account.role === 'admin' ? "default" : "secondary"} className="text-xs">
                                                        {account.role === 'admin' ? "Admin" : "Staff"}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    @{account.username || "no-username"}
                                                    {account.managed_area && ` • ${account.managed_area}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Change Password Dialog */}
                                            <Dialog
                                                open={changePasswordUserId === account.id}
                                                onOpenChange={(open) => {
                                                    if (!open) {
                                                        setChangePasswordUserId(null)
                                                        setChangePasswordValue("")
                                                    }
                                                }}
                                            >
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setChangePasswordUserId(account.id)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle>Đổi mật khẩu</DialogTitle>
                                                        <DialogDescription>
                                                            Đổi mật khẩu cho {account.full_name}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="py-4">
                                                        <Label>Mật khẩu mới</Label>
                                                        <Input
                                                            type="password"
                                                            value={changePasswordValue}
                                                            onChange={(e) => setChangePasswordValue(e.target.value)}
                                                            placeholder="Tối thiểu 6 ký tự"
                                                            className="mt-2"
                                                        />
                                                    </div>
                                                    <DialogFooter>
                                                        <Button
                                                            onClick={handleChangeUserPassword}
                                                            disabled={changingPassword || changePasswordValue.length < 6}
                                                        >
                                                            {changingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                                            Cập nhật
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>

                                            {/* Delete Confirmation */}
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Xác nhận xóa tài khoản</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Bạn có chắc muốn xóa tài khoản <strong>{account.full_name}</strong>?
                                                            Hành động này không thể hoàn tác.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDeleteUser(account.id)}
                                                            className="bg-destructive hover:bg-destructive/90"
                                                        >
                                                            Xóa tài khoản
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </PageTransition>
    )
}
