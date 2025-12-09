import { useState, useRef } from "react"
import { useSiteConfig } from "@/contexts/SiteConfigContext"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageTransition } from "@/components/layout/PageTransition"
import { Settings, Image, Loader2, Check, X, RefreshCw, Upload, Info } from "lucide-react"

// Helper to resize image
const resizeImage = (file: File, maxWidth = 800): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = (event) => {
            const img = document.createElement("img")
            img.src = event.target?.result as string
            img.onload = () => {
                const canvas = document.createElement("canvas")
                let width = img.width
                let height = img.height

                // Calculate new dimensions
                if (width > maxWidth) {
                    height = (height * maxWidth) / width
                    width = maxWidth
                }

                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext("2d")
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height)
                    // Use PNG for PNG files to preserve transparency, JPEG for others
                    const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
                    const quality = file.type === 'image/png' ? undefined : 0.7
                    resolve(canvas.toDataURL(mimeType, quality))
                }
            }
        }
    })
}

export default function SettingsPage() {
    const { config, updateConfig, isLoading } = useSiteConfig()
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
    const [uploading, setUploading] = useState<'logo' | 'background' | null>(null)
    const [tempLogo, setTempLogo] = useState('')
    const [tempBg, setTempBg] = useState('')

    // File input refs
    const logoInputRef = useRef<HTMLInputElement>(null)
    const bgInputRef = useRef<HTMLInputElement>(null)

    const handleSave = async (type: 'logo' | 'background') => {
        setSaveStatus('saving')
        try {
            if (type === 'logo' && tempLogo) {
                await updateConfig({ logoUrl: tempLogo })
                setTempLogo('')
            } else if (type === 'background') {
                await updateConfig({ loginBackgroundUrl: tempBg })
                setTempBg('')
            }
            setSaveStatus('saved')
            setTimeout(() => setSaveStatus('idle'), 2000)
        } catch {
            setSaveStatus('error')
            setTimeout(() => setSaveStatus('idle'), 3000)
        }
    }

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'background') => {
        const file = event.target.files?.[0]
        if (!file) return

        setUploading(type)
        setSaveStatus('saving')

        try {
            // 1. Try to resize first to optimize
            const base64 = await resizeImage(file, type === 'logo' ? 400 : 1200)

            // 2. Try to upload to Supabase Storage if configured
            try {
                const fileExt = file.name.split('.').pop()
                const fileName = `${type}_${Date.now()}.${fileExt}`
                const filePath = `settings/${fileName}`

                const { data, error } = await supabase.storage
                    .from('attp')
                    .upload(filePath, file)

                if (!error && data) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('attp')
                        .getPublicUrl(filePath)

                    if (type === 'logo') {
                        await updateConfig({ logoUrl: publicUrl })
                        setTempLogo('') // Clear temp if direct save
                    } else {
                        await updateConfig({ loginBackgroundUrl: publicUrl })
                        setTempBg('')
                    }
                    setSaveStatus('saved')
                    setUploading(null)
                    setTimeout(() => setSaveStatus('idle'), 2000)
                    return // Exit if Supabase upload successful
                }
            } catch (err) {
                console.warn("Supabase storage upload failed, falling back to LocalStorage", err)
            }

            // 3. Fallback: Save Base64 to LocalStorage config
            if (type === 'logo') {
                await updateConfig({ logoUrl: base64 })
            } else {
                await updateConfig({ loginBackgroundUrl: base64 })
            }

            setSaveStatus('saved')
            setTimeout(() => setSaveStatus('idle'), 2000)

        } catch (error) {
            console.error(error)
            setSaveStatus('error')
            setTimeout(() => setSaveStatus('idle'), 3000)
        } finally {
            setUploading(null)
            // Reset input
            if (event.target) event.target.value = ''
        }
    }

    const resetToDefault = async (type: 'logo' | 'background') => {
        setSaveStatus('saving')
        try {
            if (type === 'logo') {
                await updateConfig({
                    logoUrl: 'https://placehold.co/140x40/6366f1/white?text=ATTP+Logo',
                    logoHeight: 40
                })
            } else {
                await updateConfig({ loginBackgroundUrl: '' })
            }
            setSaveStatus('saved')
            setTimeout(() => setSaveStatus('idle'), 2000)
        } catch {
            setSaveStatus('error')
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <PageTransition className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium text-primary">Cấu hình</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
                        Cấu hình hệ thống
                    </h1>
                    <p className="text-muted-foreground">
                        Tùy chỉnh giao diện và cài đặt hệ thống
                    </p>
                </div>
                {saveStatus !== 'idle' && (
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${saveStatus === 'saving' ? 'bg-primary/10 text-primary' :
                        saveStatus === 'saved' ? 'bg-green-500/10 text-green-600' :
                            'bg-destructive/10 text-destructive'
                        }`}>
                        {saveStatus === 'saving' && <Loader2 className="h-4 w-4 animate-spin" />}
                        {saveStatus === 'saved' && <Check className="h-4 w-4" />}
                        {saveStatus === 'error' && <X className="h-4 w-4" />}
                        {saveStatus === 'saving' ? 'Đang lưu...' : saveStatus === 'saved' ? 'Đã lưu' : 'Lỗi'}
                    </div>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Logo Configuration */}
                <Card className="border-0 shadow-soft">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Image className="h-5 w-5 text-primary" />
                            Logo hệ thống
                        </CardTitle>
                        <CardDescription>
                            Logo hiển thị trên sidebar và header. Hỗ trợ upload ảnh hoặc dán URL.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Preview */}
                        <div className="p-4 bg-muted/50 rounded-xl border-2 border-dashed border-border">
                            <p className="text-xs text-muted-foreground mb-2">Xem trước:</p>
                            <div className="flex items-center justify-center p-4 bg-primary rounded-lg">
                                <img
                                    src={tempLogo || config.logoUrl}
                                    alt="Logo preview"
                                    style={{ height: `${config.logoHeight}px` }}
                                    className="w-auto object-contain max-w-full transition-all duration-300"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://placehold.co/140x40/6366f1/white?text=ATTP+Logo'
                                    }}
                                />
                            </div>
                        </div>

                        {/* URL Input */}
                        <div className="space-y-2">
                            <Label>URL Logo</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="url"
                                    placeholder="https://example.com/logo.png"
                                    value={tempLogo || config.logoUrl}
                                    onChange={(e) => setTempLogo(e.target.value)}
                                    className="flex-1"
                                />
                                <input
                                    type="file"
                                    ref={logoInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, 'logo')}
                                />
                                <Button
                                    variant="outline"
                                    onClick={() => logoInputRef.current?.click()}
                                    disabled={uploading === 'logo'}
                                >
                                    {uploading === 'logo' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        {/* Logo Height Control */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Chiều cao Logo (px)</Label>
                                <span className="text-sm font-medium text-muted-foreground">{config.logoHeight}px</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <Input
                                    type="range"
                                    min="20"
                                    max="200"
                                    step="4"
                                    value={config.logoHeight}
                                    onChange={(e) => updateConfig({ logoHeight: parseInt(e.target.value) })}
                                    className="flex-1"
                                />
                                <Input
                                    type="number"
                                    min="20"
                                    max="200"
                                    value={config.logoHeight}
                                    onChange={(e) => updateConfig({ logoHeight: parseInt(e.target.value) })}
                                    className="w-20"
                                />
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2">
                            <Button
                                className="flex-1"
                                onClick={() => handleSave('logo')}
                                disabled={!tempLogo || tempLogo === config.logoUrl}
                            >
                                <Check className="h-4 w-4 mr-2" />
                                Lưu URL
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => resetToDefault('logo')}
                                title="Khôi phục mặc định"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Login Background Configuration */}
                <Card className="border-0 shadow-soft">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Image className="h-5 w-5 text-blue-500" />
                            Ảnh nền trang đăng nhập
                        </CardTitle>
                        <CardDescription>
                            Hình nền hiển thị trên trang đăng nhập (để trống = gradient mặc định).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Preview */}
                        <div className="p-4 bg-muted/50 rounded-xl border-2 border-dashed border-border">
                            <p className="text-xs text-muted-foreground mb-2">Xem trước:</p>
                            <div
                                className="aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-primary/80 to-purple-600/80"
                                style={(tempBg || config.loginBackgroundUrl) ? {
                                    backgroundImage: `url(${tempBg || config.loginBackgroundUrl})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                } : {}}
                            >
                                <div className="w-full h-full flex items-center justify-center bg-black/20">
                                    <div className="bg-white/90 backdrop-blur rounded-lg p-4 shadow-lg">
                                        <div className="w-24 h-6 bg-gray-200 rounded mb-2"></div>
                                        <div className="w-32 h-8 bg-gray-100 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* URL Input */}
                        <div className="space-y-2">
                            <Label>URL Ảnh nền</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="url"
                                    placeholder="https://example.com/background.jpg (để trống = gradient)"
                                    value={tempBg !== '' ? tempBg : config.loginBackgroundUrl}
                                    onChange={(e) => setTempBg(e.target.value)}
                                    className="flex-1"
                                />
                                <input
                                    type="file"
                                    ref={bgInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, 'background')}
                                />
                                <Button
                                    variant="outline"
                                    onClick={() => bgInputRef.current?.click()}
                                    disabled={uploading === 'background'}
                                >
                                    {uploading === 'background' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2">
                            <Button
                                className="flex-1"
                                onClick={() => handleSave('background')}
                            >
                                <Check className="h-4 w-4 mr-2" />
                                Lưu URL
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => resetToDefault('background')}
                                title="Khôi phục mặc định"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Storage Info */}
            <Card className="border-0 shadow-soft bg-blue-50/50 dark:bg-blue-950/20">
                <CardContent className="pt-6">
                    <div className="flex gap-3">
                        <div className="shrink-0 h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <Info className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h4 className="font-medium text-blue-900 dark:text-blue-100">Thông tin lưu trữ ảnh</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                Hệ thống sẽ cố gắng lưu ảnh lên <strong>Supabase Storage</strong> (Bucket 'attp').
                                Nếu chưa cấu hình Storage, ảnh sẽ được nén và lưu trực tiếp trên <strong>Trình duyệt của bạn</strong> (LocalStorage).

                                <br />Lưu ý: Ảnh lưu trên trình duyệt sẽ mất nếu bạn xóa dữ liệu duyệt web.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </PageTransition>
    )
}
