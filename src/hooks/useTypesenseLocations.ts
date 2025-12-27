'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// Interface'ler
export interface LocationEntry {
  id: string
  location_id?: string  // Typesense'den gelince
  name: string
  type?: 'city' | 'district'
  parent_id?: string
  plate_code?: number
}

export interface SchoolEntry {
  id: string
  school_id?: string  // Typesense'den gelince
  name: string
  city_id?: string
  city_name?: string
  district_id?: string
  district_name?: string
  school_type?: string
}

interface UseTypesenseLocationsResult {
  // Data
  cities: LocationEntry[]
  districts: LocationEntry[]
  schools: SchoolEntry[]
  
  // Selection
  selectedCity: string
  selectedDistrict: string
  selectedSchool: string
  
  // Setters
  setSelectedCity: (cityId: string) => void
  setSelectedDistrict: (districtId: string) => void
  setSelectedSchool: (schoolId: string) => void
  
  // State
  loading: boolean
  citiesLoading: boolean
  districtsLoading: boolean
  schoolsLoading: boolean
  error: Error | null
  
  // Helpers
  resetSelection: () => void
  getSelectedCityName: () => string | null
  getSelectedDistrictName: () => string | null
  getSelectedSchoolName: () => string | null
}

// In-memory cache
const citiesCache: { data: LocationEntry[] | null; timestamp: number } = { data: null, timestamp: 0 }
const CACHE_TTL = 5 * 60 * 1000 // 5 dakika

export function useTypesenseLocations(): UseTypesenseLocationsResult {
  const [cities, setCities] = useState<LocationEntry[]>([])
  const [districts, setDistricts] = useState<LocationEntry[]>([])
  const [schools, setSchools] = useState<SchoolEntry[]>([])
  
  const [selectedCity, setSelectedCityState] = useState('')
  const [selectedDistrict, setSelectedDistrictState] = useState('')
  const [selectedSchool, setSelectedSchoolState] = useState('')
  
  const [citiesLoading, setCitiesLoading] = useState(true)
  const [districtsLoading, setDistrictsLoading] = useState(false)
  const [schoolsLoading, setSchoolsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // Önceki değerleri takip et
  const prevCityRef = useRef<string>('')
  const prevDistrictRef = useRef<string>('')

  // İlleri yükle (sayfa açılışında)
  useEffect(() => {
    async function loadCities() {
      // Cache kontrolü
      const now = Date.now()
      if (citiesCache.data && citiesCache.data.length > 0 && (now - citiesCache.timestamp) < CACHE_TTL) {
        setCities(citiesCache.data)
        setCitiesLoading(false)
        console.log('⚡ Cities from cache:', citiesCache.data.length)
        return
      }

      setCitiesLoading(true)
      setError(null)
      
      try {
        // API route üzerinden çek (Typesense -> Supabase fallback)
        const response = await fetch('/api/locations?type=city')
        const result = await response.json()
        
        if (result.error) throw new Error(result.error)
        
        const formattedCities: LocationEntry[] = (result.data || []).map((city: any) => ({
          id: city.id,
          location_id: city.id,
          name: city.name,
          type: 'city' as const,
          plate_code: city.plate_code
        }))
        
        setCities(formattedCities)
        citiesCache.data = formattedCities
        citiesCache.timestamp = now
        console.log(`✅ ${formattedCities.length} cities loaded from ${result.source}`)
        
      } catch (err) {
        console.error('Cities load error:', err)
        setError(err as Error)
        setCities([])
      } finally {
        setCitiesLoading(false)
      }
    }

    loadCities()
  }, [])

  // İl değiştiğinde ilçeleri yükle
  useEffect(() => {
    // Aynı il seçiliyse yeniden yükleme
    if (selectedCity === prevCityRef.current) return
    prevCityRef.current = selectedCity

    async function loadDistricts() {
      if (!selectedCity) {
        setDistricts([])
        setSelectedDistrictState('')
        setSchools([])
        setSelectedSchoolState('')
        return
      }

      setDistrictsLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/locations?type=district&parentId=${selectedCity}`)
        const result = await response.json()
        
        if (result.error) throw new Error(result.error)
        
        const formattedDistricts: LocationEntry[] = (result.data || []).map((district: any) => ({
          id: district.id,
          location_id: district.id,
          name: district.name,
          type: 'district' as const,
          parent_id: district.city_id
        }))
        
        setDistricts(formattedDistricts)
        console.log(`✅ ${formattedDistricts.length} districts loaded from ${result.source}`)
        
      } catch (err) {
        console.error('Districts load error:', err)
        setError(err as Error)
        setDistricts([])
      } finally {
        setDistrictsLoading(false)
      }
      
      // İlçe seçimini sıfırla
      setSelectedDistrictState('')
      setSchools([])
      setSelectedSchoolState('')
    }

    loadDistricts()
  }, [selectedCity])

  // İlçe değiştiğinde okulları yükle
  useEffect(() => {
    // Aynı ilçe seçiliyse yeniden yükleme
    if (selectedDistrict === prevDistrictRef.current) return
    prevDistrictRef.current = selectedDistrict

    async function loadSchools() {
      if (!selectedDistrict) {
        setSchools([])
        setSelectedSchoolState('')
        return
      }

      setSchoolsLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/locations?type=school&parentId=${selectedDistrict}`)
        const result = await response.json()
        
        if (result.error) throw new Error(result.error)
        
        const formattedSchools: SchoolEntry[] = (result.data || []).map((school: any) => ({
          id: school.id,
          school_id: school.id,
          name: school.name,
          district_id: school.district_id
        }))
        
        setSchools(formattedSchools)
        console.log(`✅ ${formattedSchools.length} schools loaded from ${result.source}`)
        
      } catch (err) {
        console.error('Schools load error:', err)
        setError(err as Error)
        setSchools([])
      } finally {
        setSchoolsLoading(false)
      }
      
      // Okul seçimini sıfırla
      setSelectedSchoolState('')
    }

    loadSchools()
  }, [selectedDistrict])

  // Setters with cascade reset
  const setSelectedCity = useCallback((cityId: string) => {
    setSelectedCityState(cityId)
  }, [])

  const setSelectedDistrict = useCallback((districtId: string) => {
    setSelectedDistrictState(districtId)
  }, [])

  const setSelectedSchool = useCallback((schoolId: string) => {
    setSelectedSchoolState(schoolId)
  }, [])

  // Reset all selections
  const resetSelection = useCallback(() => {
    setSelectedCityState('')
    setSelectedDistrictState('')
    setSelectedSchoolState('')
    setDistricts([])
    setSchools([])
    prevCityRef.current = ''
    prevDistrictRef.current = ''
  }, [])

  // Helpers
  const getSelectedCityName = useCallback(() => {
    if (!selectedCity) return null
    return cities.find(c => c.id === selectedCity || c.location_id === selectedCity)?.name || null
  }, [selectedCity, cities])

  const getSelectedDistrictName = useCallback(() => {
    if (!selectedDistrict) return null
    return districts.find(d => d.id === selectedDistrict || d.location_id === selectedDistrict)?.name || null
  }, [selectedDistrict, districts])

  const getSelectedSchoolName = useCallback(() => {
    if (!selectedSchool) return null
    return schools.find(s => s.id === selectedSchool || s.school_id === selectedSchool)?.name || null
  }, [selectedSchool, schools])

  return {
    cities,
    districts,
    schools,
    selectedCity,
    selectedDistrict,
    selectedSchool,
    setSelectedCity,
    setSelectedDistrict,
    setSelectedSchool,
    loading: citiesLoading || districtsLoading || schoolsLoading,
    citiesLoading,
    districtsLoading,
    schoolsLoading,
    error,
    resetSelection,
    getSelectedCityName,
    getSelectedDistrictName,
    getSelectedSchoolName
  }
}

export default useTypesenseLocations
