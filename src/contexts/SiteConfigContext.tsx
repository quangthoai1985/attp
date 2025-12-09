import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

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

    // Load config from Supabase on mount
    useEffect(() => {
        loadConfig()
    }, [])

    const loadConfig = async () => {
        try {
            // Try to load from Supabase first
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase
                .from('site_config') as any)
                .select('*')
                .eq('id', 'main')
                .single()

            if (!error && data) {
                setConfig({
                    logoUrl: data.logo_url || defaultConfig.logoUrl,
                    loginBackgroundUrl: data.login_background_url || defaultConfig.loginBackgroundUrl,
                    logoHeight: data.logo_height || defaultConfig.logoHeight,
                })
                // Also cache to localStorage for faster load
                localStorage.setItem('siteConfig', JSON.stringify({
                    logoUrl: data.logo_url,
                    loginBackgroundUrl: data.login_background_url,
                    logoHeight: data.logo_height,
                }))
            } else {
                // Fallback to localStorage
                const savedConfig = localStorage.getItem('siteConfig')
                if (savedConfig) {
                    const parsed = JSON.parse(savedConfig)
                    setConfig({
                        logoUrl: parsed.logoUrl || defaultConfig.logoUrl,
                        loginBackgroundUrl: parsed.loginBackgroundUrl || defaultConfig.loginBackgroundUrl,
                        logoHeight: parsed.logoHeight || defaultConfig.logoHeight,
                    })
                }
            }
        } catch (err) {
            console.error('Error loading site config:', err)
            // Try localStorage fallback
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
            } catch {
                // Use defaults
            }
        } finally {
            setIsLoading(false)
        }
    }

    const updateConfig = async (newConfig: Partial<SiteConfig>) => {
        const updatedConfig = { ...config, ...newConfig }
        setConfig(updatedConfig)

        // Save to localStorage immediately for fast access
        localStorage.setItem('siteConfig', JSON.stringify(updatedConfig))

        // Save to Supabase
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase.from('site_config') as any).upsert({
                id: 'main',
                logo_url: updatedConfig.logoUrl,
                login_background_url: updatedConfig.loginBackgroundUrl,
                logo_height: updatedConfig.logoHeight,
                updated_at: new Date().toISOString()
            })
        } catch (err) {
            console.error('Error saving site config to Supabase:', err)
        }
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
