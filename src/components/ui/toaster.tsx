import * as React from "react"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

const TOAST_DURATION = 5000 // 5 seconds

interface ToastItemProps {
    id: string
    title?: string
    description?: string
    variant?: "default" | "destructive" | "success" | "warning" | "info"
    onDismiss: (id: string) => void
}

const variantConfig = {
    default: {
        icon: CheckCircle2,
        bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
        borderColor: "border-l-emerald-500",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        progressColor: "bg-emerald-500",
        titleColor: "text-emerald-800 dark:text-emerald-200",
    },
    success: {
        icon: CheckCircle2,
        bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
        borderColor: "border-l-emerald-500",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        progressColor: "bg-emerald-500",
        titleColor: "text-emerald-800 dark:text-emerald-200",
    },
    destructive: {
        icon: XCircle,
        bgColor: "bg-red-50 dark:bg-red-950/50",
        borderColor: "border-l-red-500",
        iconColor: "text-red-600 dark:text-red-400",
        progressColor: "bg-red-500",
        titleColor: "text-red-800 dark:text-red-200",
    },
    warning: {
        icon: AlertTriangle,
        bgColor: "bg-amber-50 dark:bg-amber-950/50",
        borderColor: "border-l-amber-500",
        iconColor: "text-amber-600 dark:text-amber-400",
        progressColor: "bg-amber-500",
        titleColor: "text-amber-800 dark:text-amber-200",
    },
    info: {
        icon: Info,
        bgColor: "bg-blue-50 dark:bg-blue-950/50",
        borderColor: "border-l-blue-500",
        iconColor: "text-blue-600 dark:text-blue-400",
        progressColor: "bg-blue-500",
        titleColor: "text-blue-800 dark:text-blue-200",
    },
}

function ToastItem({ id, title, description, variant = "default", onDismiss }: ToastItemProps) {
    const [progress, setProgress] = React.useState(100)
    const config = variantConfig[variant] || variantConfig.default
    const Icon = config.icon

    React.useEffect(() => {
        const startTime = Date.now()
        const endTime = startTime + TOAST_DURATION

        const updateProgress = () => {
            const now = Date.now()
            const remaining = Math.max(0, endTime - now)
            const progressPercent = (remaining / TOAST_DURATION) * 100
            setProgress(progressPercent)

            if (progressPercent > 0) {
                requestAnimationFrame(updateProgress)
            }
        }

        const animationFrame = requestAnimationFrame(updateProgress)
        return () => cancelAnimationFrame(animationFrame)
    }, [])

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
            }}
            className={cn(
                "relative w-[360px] max-w-[calc(100vw-2rem)] rounded-lg border-l-4 shadow-lg overflow-hidden",
                "bg-white dark:bg-slate-900/95 backdrop-blur-xl",
                "border border-slate-200/50 dark:border-slate-700/50",
                config.borderColor,
                config.bgColor
            )}
        >
            <div className="flex items-start gap-3 p-4">
                {/* Icon */}
                <div className={cn("flex-shrink-0 mt-0.5", config.iconColor)}>
                    <Icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {title && (
                        <p className={cn("font-semibold text-sm", config.titleColor)}>
                            {title}
                        </p>
                    )}
                    {description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                            {description}
                        </p>
                    )}
                </div>

                {/* Close button */}
                <button
                    onClick={() => onDismiss(id)}
                    className="flex-shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200/50 dark:bg-slate-700/50">
                <motion.div
                    className={cn("h-full", config.progressColor)}
                    initial={{ width: "100%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.1, ease: "linear" }}
                />
            </div>
        </motion.div>
    )
}

export function Toaster() {
    const { toasts, dismiss } = useToast()

    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
            <AnimatePresence mode="sync">
                {toasts.map((toast) => (
                    <ToastItem
                        key={toast.id}
                        id={toast.id}
                        title={toast.title}
                        description={toast.description}
                        variant={toast.variant}
                        onDismiss={dismiss}
                    />
                ))}
            </AnimatePresence>
        </div>
    )
}
