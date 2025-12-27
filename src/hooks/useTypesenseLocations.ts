'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  getCitiesFast, 
  getDistrictsFast, 
  getSchoolsFast,
  LocationEntry,
  SchoolEntry,
  isTypesenseEnabled
} from '@/lib/typesense/browser-client'

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
      if (citiesCache.data && (now - citiesCache.timestamp) < CACHE_TTL) {
        setCities(citiesCache.data)
        setCitiesLoading(false)
        console.log('⚡ Cities from cache')
        return
      }

      setCitiesLoading(true)
      setError(null)
      
      try {
        if (isTypesenseEnabled()) {
          const result = await getCitiesFast()
          setCities(result.data)
          
          // Cache'e kaydet
          citiesCache.data = result.data
          citiesCache.timestamp = now
        } else {
          console.warn('Typesense disabled, cities will not load')
          setCities([])
        }
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
        if (isTypesenseEnabled()) {
          const result = await getDistrictsFast(selectedCity)
          setDistricts(result.data)
        } else {
          setDistricts([])
        }
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
        if (isTypesenseEnabled()) {
          const result = await getSchoolsFast(selectedDistrict)
          setSchools(result.data)
        } else {
          setSchools([])
        }
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
    return cities.find(c => c.location_id === selectedCity)?.name || null
  }, [selectedCity, cities])

  const getSelectedDistrictName = useCallback(() => {
    if (!selectedDistrict) return null
    return districts.find(d => d.location_id === selectedDistrict)?.name || null
  }, [selectedDistrict, districts])

  const getSelectedSchoolName = useCallback(() => {
    if (!selectedSchool) return null
    return schools.find(s => s.school_id === selectedSchool)?.name || null
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

