import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import { Loader2, Save, RotateCcw, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import 'leaflet/dist/leaflet.css'

interface FacilityMapEditorProps {
    facilityId: string
    initialLat?: number | null
    initialLng?: number | null
    onSave?: () => void
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

export function FacilityMapEditor({ facilityId, initialLat, initialLng, onSave }: FacilityMapEditorProps) {
    const queryClient = useQueryClient()
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<L.Map | null>(null)
    const markerRef = useRef<L.Marker | null>(null)

    const [markerPosition, setMarkerPosition] = useState<[number, number]>([
        initialLat || defaultCenter[0],
        initialLng || defaultCenter[1]
    ])

    // Manual input states
    const [manualCoords, setManualCoords] = useState('')

    const saveMutation = useMutation({
        mutationFn: async (position: [number, number]) => {
            const { error } = await supabase
                .from('facilities')
                .update({
                    latitude: position[0],
                    longitude: position[1]
                } as never)
                .eq('id', facilityId)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['facility', facilityId] })
            onSave?.()
        }
    })

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return

        const initialPos: [number, number] = [
            initialLat || defaultCenter[0],
            initialLng || defaultCenter[1]
        ]

        // Initialize map
        const map = L.map(mapRef.current, {
            center: initialPos,
            zoom: 16
        })
        mapInstanceRef.current = map

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map)

        // Add draggable marker
        const marker = L.marker(initialPos, {
            icon: defaultIcon,
            draggable: true
        }).addTo(map)
        markerRef.current = marker

        // Handle marker drag
        marker.on('dragend', () => {
            const pos = marker.getLatLng()
            setMarkerPosition([pos.lat, pos.lng])
        })

        // Handle map click
        map.on('click', (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng
            marker.setLatLng([lat, lng])
            setMarkerPosition([lat, lng])
        })

        // Change cursor to crosshair
        map.getContainer().style.cursor = 'crosshair'

        // Cleanup
        return () => {
            map.remove()
            mapInstanceRef.current = null
            markerRef.current = null
        }
    }, [initialLat, initialLng])

    // Function to update marker position and map view
    const updateMapPosition = useCallback((lat: number, lng: number) => {
        const newPos: [number, number] = [lat, lng]
        setMarkerPosition(newPos)
        if (markerRef.current) {
            markerRef.current.setLatLng(newPos)
        }
        if (mapInstanceRef.current) {
            mapInstanceRef.current.setView(newPos, 16)
        }
    }, [])

    // Handle manual coordinate input - supports "10.7066, 105.1169" format from Google Maps
    const handleApplyManualCoords = useCallback(() => {
        const parts = manualCoords.split(',').map(s => s.trim())
        if (parts.length >= 2) {
            const lat = parseFloat(parts[0])
            const lng = parseFloat(parts[1])

            if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                updateMapPosition(lat, lng)
                setManualCoords('')
            } else {
                alert('Tọa độ không hợp lệ. Vui lòng kiểm tra lại.')
            }
        } else {
            alert('Vui lòng nhập tọa độ theo định dạng: vĩ độ, kinh độ (VD: 10.7066, 105.1169)')
        }
    }, [manualCoords, updateMapPosition])

    const handleReset = useCallback(() => {
        const resetPos: [number, number] = [
            initialLat || defaultCenter[0],
            initialLng || defaultCenter[1]
        ]
        setMarkerPosition(resetPos)
        if (markerRef.current) {
            markerRef.current.setLatLng(resetPos)
        }
        if (mapInstanceRef.current) {
            mapInstanceRef.current.setView(resetPos, 16)
        }
    }, [initialLat, initialLng])

    const handleSave = () => {
        saveMutation.mutate(markerPosition)
    }

    return (
        <div className="space-y-4">
            <div className="h-[300px] rounded-lg overflow-hidden border">
                <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
            </div>

            {/* Manual Coordinate Input */}
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 space-y-2 border border-blue-200 dark:border-blue-800">
                <Label className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    📍 Nhập tọa độ từ Google Maps:
                </Label>
                <p className="text-xs text-muted-foreground">
                    Cách lấy: Mở Google Maps → Click chuột phải vào vị trí → Copy tọa độ
                </p>
                <div className="flex gap-2">
                    <Input
                        placeholder="Paste tọa độ: 10.7066, 105.1169"
                        value={manualCoords}
                        onChange={(e) => setManualCoords(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyManualCoords()}
                        className="flex-1 h-9 text-sm"
                    />
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleApplyManualCoords}
                        className="h-9"
                    >
                        <Navigation className="h-4 w-4 mr-1" />
                        Áp dụng
                    </Button>
                </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p className="text-muted-foreground mb-1">📍 Tọa độ hiện tại:</p>
                <p className="font-mono text-xs">
                    Vĩ độ: <span className="text-primary font-semibold">{markerPosition[0].toFixed(6)}</span> |
                    Kinh độ: <span className="text-primary font-semibold">{markerPosition[1].toFixed(6)}</span>
                </p>
            </div>

            <div className="flex gap-2">
                <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={saveMutation.isPending}
                    className="flex-1"
                >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Đặt lại
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    className="flex-1"
                >
                    {saveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    Lưu vị trí
                </Button>
            </div>
        </div>
    )
}
