import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { Database } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

type Facility = Database['public']['Tables']['facilities']['Row']

interface FacilityMapProps {
    facility: Facility
    height?: string
}

// Default center: Chau Doc city center
const defaultCenter: [number, number] = [10.7066, 105.1169]

// Fix for default marker icon
const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
})

export function FacilityMap({ facility, height = '400px' }: FacilityMapProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<L.Map | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const center: [number, number] = [
        facility.latitude || defaultCenter[0],
        facility.longitude || defaultCenter[1]
    ]

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return

        // Initialize map
        const map = L.map(mapRef.current).setView(center, 16)
        mapInstanceRef.current = map

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map)

        // Add marker with popup
        const marker = L.marker(center, { icon: defaultIcon }).addTo(map)

        const popupContent = `
            <div style="min-width: 200px; font-family: system-ui, sans-serif;">
                <h3 style="font-weight: bold; font-size: 14px; margin: 0 0 8px 0; color: #1a1a1a;">
                    📍 ${facility.name}
                </h3>
                <div style="font-size: 13px; color: #666; line-height: 1.5;">
                    <p style="margin: 4px 0;"><strong>Địa chỉ:</strong> ${facility.address || 'Chưa cập nhật'}</p>
                    <p style="margin: 4px 0;"><strong>Loại hình:</strong> ${facility.type}</p>
                    <p style="margin: 4px 0;"><strong>Trạng thái:</strong> 
                        <span style="color: ${facility.status === 'active' ? '#16a34a' : '#d97706'}; font-weight: 500;">
                            ${facility.status === 'active' ? 'Hoạt động' : facility.status}
                        </span>
                    </p>
                    ${facility.owner_name ? `<p style="margin: 4px 0;"><strong>Chủ cơ sở:</strong> ${facility.owner_name}</p>` : ''}
                </div>
            </div>
        `
        marker.bindPopup(popupContent)

        setIsLoading(false)

        // Cleanup
        return () => {
            map.remove()
            mapInstanceRef.current = null
        }
    }, [center, facility])

    // Update map center if facility location changes
    useEffect(() => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.setView(center, 16)
        }
    }, [center])

    return (
        <div style={{ height }} className="rounded-xl overflow-hidden shadow-lg border relative">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
            <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
        </div>
    )
}
