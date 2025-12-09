import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface SiteConfig {
    logoUrl: string
    loginBackgroundUrl: string
    logoHeight: number // unit: px
}

interface SiteConfigContextType {
    config: SiteConfig
    updateConfig: (newConfig: Partial<SiteConfig>) => Promise<void>
    isLoading: boolean
}

const defaultConfig: SiteConfig = {
    logoUrl: 'https://placehold.co/140x40/6366f1/white?text=ATTP+Logo',
    loginBackgroundUrl: '',
    logoHeight: 40,
}

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined)

export function SiteConfigProvider({ children }: { children: ReactNode }) {
    const [config, setConfig] = useState<SiteConfig>(defaultConfig)
    const [isLoading, setIsLoading] = useState(true)

    // Load config from localStorage on mount
    useEffect(() => {
        loadConfig()
    }, [])

    const loadConfig = () => {
        try {
            const savedConfig = localStorage.getItem('siteConfig')
            if (savedConfig) {
                const parsed = JSON.parse(savedConfig)
                setConfig({
                    logoUrl: parsed.logoUrl || defaultConfig.logoUrl,
                    loginBackgroundUrl: parsed.loginBackgroundUrl || defaultConfig.loginBackgroundUrl,
                    logoHeight: parsed.logoHeight || defaultConfig.logoHeight,
                })
            }
        } catch (err) {
            console.error('Error loading site config:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const updateConfig = async (newConfig: Partial<SiteConfig>) => {
        const updatedConfig = { ...config, ...newConfig }
        setConfig(updatedConfig)

        // Save to localStorage
        localStorage.setItem('siteConfig', JSON.stringify(updatedConfig))
    }

    return (
        <SiteConfigContext.Provider value={{ config, updateConfig, isLoading }}>
            {children}
        </SiteConfigContext.Provider>
    )
}

export function useSiteConfig() {
    const context = useContext(SiteConfigContext)
    if (context === undefined) {
        throw new Error('useSiteConfig must be used within a SiteConfigProvider')
    }
    return context
}
