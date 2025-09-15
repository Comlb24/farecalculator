import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from './ThemeContext.jsx'
import emailjs from '@emailjs/browser'

// Memoized Results Component
const ResultsCard = memo(({ 
  distance, 
  calculatedFare, 
  travelTime, 
  pickupAddress, 
  dropoffAddress, 
  secondDropoffAddress, 
  numberOfPassengers,
  isReturnTrip,
  settings, 
  isDarkMode, 
  clearResults 
}) => {
  if (!distance && !calculatedFare) return null

  return (
    <div className={`${isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-100'} rounded-xl shadow-lg p-5 border transition-colors duration-200`}>
      <h2 className={`text-xl font-semibold mb-3 transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Fare Estimate</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className={`text-sm transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pickup</p>
          <p className={`font-medium transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{pickupAddress}</p>
        </div>
        <div>
          <p className={`text-sm transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Drop-off</p>
          <p className={`font-medium transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{dropoffAddress}</p>
        </div>
      </div>
      {secondDropoffAddress && (
        <div className="mb-4">
          <p className={`text-sm transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Second Drop-off</p>
          <p className={`font-medium transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{secondDropoffAddress}</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <p className={`text-sm transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Distance</p>
          <p className={`font-medium transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{distance?.toFixed(2)} km</p>
        </div>
        <div>
          <p className={`text-sm transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Travel Time</p>
          <p className={`font-medium transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{travelTime} min</p>
        </div>
        <div>
          <p className={`text-sm transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Passengers</p>
          <p className={`font-medium transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{numberOfPassengers}</p>
        </div>
        <div>
          <p className={`text-sm transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Trip Type</p>
          <p className={`font-medium transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {isReturnTrip ? 'Return Trip' : 'One Way'}
          </p>
        </div>
        <div>
          <p className={`text-sm transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Estimated Fare</p>
          <p className="text-2xl font-bold text-blue-600">
            {settings.currency} {calculatedFare?.toFixed(2)}
            {isReturnTrip && <span className="text-sm font-normal text-gray-500 ml-1">(Return)</span>}
          </p>
        </div>
      </div>
      <div className={`p-4 rounded-lg transition-colors duration-200 ${isDarkMode ? 'bg-yellow-900/20 border border-yellow-700/30' : 'bg-yellow-50'}`}>
        <p className={`text-sm transition-colors duration-200 ${isDarkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
          ⚠️ Estimates may vary due to traffic, tolls, or route changes.
        </p>
      </div>
      
      {/* Clear Results Button */}
      <div className="mt-4">
        <button
          onClick={clearResults}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          Clear Results
        </button>
      </div>
    </div>
  )
})

function App() {
  
  const { isDarkMode, toggleTheme } = useTheme()
  const [pickupAddress, setPickupAddress] = useState('')
  const [dropoffAddress, setDropoffAddress] = useState('')
  const [secondDropoffAddress, setSecondDropoffAddress] = useState('')
  const [showSecondDropoff, setShowSecondDropoff] = useState(false)
  const [distance, setDistance] = useState(null)
  const [travelTime, setTravelTime] = useState(null)
  const [apiKey] = useState(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyB8eSEwobyB-7ZkgKBUKLl5Hvico0CFjso')
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [isLoadingMap, setIsLoadingMap] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [bookingPopup, setBookingPopup] = useState(null)
  
  // Customer information state
  const [customerName, setCustomerName] = useState('')
  const [pickupDateTime, setPickupDateTime] = useState(() => {
    // Set default to current date and time + 30 minutes in Moncton timezone
    const now = new Date()
    // Add 30 minutes to current time
    const futureTime = new Date(now.getTime() + 30 * 60 * 1000)
    
    const monctonDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Moncton',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(futureTime)
    
    const monctonTime = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Moncton',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(futureTime)
    
    const year = monctonDate.find(part => part.type === 'year').value
    const month = monctonDate.find(part => part.type === 'month').value
    const day = monctonDate.find(part => part.type === 'day').value
    
    return `${year}-${month}-${day}T${monctonTime}`
  })
  const [emailAddress, setEmailAddress] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [numberOfPassengers, setNumberOfPassengers] = useState(1)
  const [isReturnTrip, setIsReturnTrip] = useState(false)
  const [returnDateTime, setReturnDateTime] = useState(() => {
    // Set default to current date and time + 2 hours in Moncton timezone
    const now = new Date()
    // Add 2 hours to current time for return trip
    const futureTime = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    
    const monctonDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Moncton',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(futureTime)
    
    const monctonTime = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Moncton',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(futureTime)
    
    const year = monctonDate.find(part => part.type === 'year').value
    const month = monctonDate.find(part => part.type === 'month').value
    const day = monctonDate.find(part => part.type === 'day').value
    
    return `${year}-${month}-${day}T${monctonTime}`
  })
  const [message, setMessage] = useState('')
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState({
    customerName: false,
    emailAddress: false,
    phoneNumber: false,
    pickupDateTime: false,
    returnDateTime: false,
    numberOfPassengers: false
  })
  
  // EmailJS configuration
  const [emailConfig] = useState({
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_nrynudw',
    templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_lqiv82a',
    publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'a6vgoEqiDO14QO4OJ'
  })
  
  // Settings state
  const [settings, setSettings] = useState({
    perKmRate: 1.65,
    baseFare: 3.00,
    minFare: 25.00,
    currency: 'CAD'
  })

  // Memoized fare calculation
  const calculatedFare = useMemo(() => {
    if (!distance) return null
    const baseFare = Math.max(
      settings.minFare,
      settings.baseFare + (settings.perKmRate * distance)
    )
    // Double the fare for return trips
    return isReturnTrip ? baseFare * 2 : baseFare
  }, [distance, settings.minFare, settings.baseFare, settings.perKmRate, isReturnTrip])
  
  // Refs for Google Maps
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const directionsRendererRef = useRef(null)
  const customMarkersRef = useRef([])
  const autocompleteRefs = useRef({})
  const timeoutRefs = useRef([])

  // Utility function to manage timeouts with cleanup
  const createTimeout = (callback, delay) => {
    const timeoutId = setTimeout(() => {
      callback()
      // Remove from refs array after execution
      timeoutRefs.current = timeoutRefs.current.filter(id => id !== timeoutId)
    }, delay)
    timeoutRefs.current.push(timeoutId)
    return timeoutId
  }

  // Debounced input handler to reduce API calls
  const debouncedInputHandler = useCallback((value, setter, delay = 300) => {
    // Clear existing timeout for this input
    const existingTimeout = timeoutRefs.current.find(id => 
      id.toString().includes('debounce')
    )
    if (existingTimeout) {
      clearTimeout(existingTimeout)
      timeoutRefs.current = timeoutRefs.current.filter(id => id !== existingTimeout)
    }

    // Set new timeout
    const timeoutId = setTimeout(() => {
      setter(value)
      timeoutRefs.current = timeoutRefs.current.filter(id => id !== timeoutId)
    }, delay)
    
    timeoutRefs.current.push(timeoutId)
  }, [])

  // Helper function to clear messages
  const clearMessages = useCallback(() => {
    setError(null)
    setSuccessMessage(null)
    setBookingPopup(null)
  }, [])

  // Helper function to handle popup close and form clearing
  const handleBookingPopupClose = useCallback(() => {
    setBookingPopup(null)
    // Clear the form after user acknowledges the popup
    clearResults()
    setCustomerName('')
    setPickupDateTime('')
    setEmailAddress('')
    setPhoneNumber('')
    setMessage('')
  }, [])

  // Helper function to show error
  const showError = useCallback((message) => {
    setError(message)
    setSuccessMessage(null)
    // Auto-clear error after 5 seconds
    createTimeout(() => setError(null), 5000)
  }, [])

  // Helper function to show success
  const showSuccess = useCallback((message) => {
    setSuccessMessage(message)
    setError(null)
    // Auto-clear success after 5 seconds for better visibility
    createTimeout(() => setSuccessMessage(null), 5000)
  }, [])

  // Helper function to show booking popup
  const showBookingPopup = useCallback((message) => {
    setBookingPopup(message)
    setError(null)
    setSuccessMessage(null)
    // Popup will only clear when user clicks OK or close button
  }, [])

  // Load saved settings from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('fareSettings')
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings))
      }
    } catch (error) {
      console.warn('Could not load settings:', error)
    }
  }, [])

  // Save settings to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('fareSettings', JSON.stringify(settings))
    } catch (error) {
      console.warn('Could not save settings:', error)
    }
  }, [settings])

  // Load Google Maps API with optimized loading strategy
  useEffect(() => {
    // Only load once
    if (window.google && window.google.maps) {
      setIsMapLoaded(true)
      setIsLoadingMap(false)
      return
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      return
    }

    // Preload Google Maps API for faster loading
    const preloadGoogleMaps = () => {
      // Add DNS prefetch and preconnect hints for faster loading
      const dnsPrefetch = document.createElement('link')
      dnsPrefetch.rel = 'dns-prefetch'
      dnsPrefetch.href = '//maps.googleapis.com'
      document.head.appendChild(dnsPrefetch)

      const preconnect = document.createElement('link')
      preconnect.rel = 'preconnect'
      preconnect.href = 'https://maps.googleapis.com'
      preconnect.crossOrigin = 'anonymous'
      document.head.appendChild(preconnect)

      // Preload the script
      const preloadLink = document.createElement('link')
      preloadLink.rel = 'preload'
      preloadLink.href = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`
      preloadLink.as = 'script'
      document.head.appendChild(preloadLink)
    }

    // Optimized Google Maps loading
    const loadGoogleMaps = async () => {
      try {
        setIsLoadingMap(true)
        
        // Preload resources first
        preloadGoogleMaps()
        
        // Use optimized script loading with only necessary libraries
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap&v=weekly&loading=async`
        script.async = true
        script.defer = true
        
        // Add error handling for script loading
        script.onerror = () => {
          console.error('Failed to load Google Maps API')
          setIsLoadingMap(false)
          showError('Failed to load Google Maps. Please refresh the page.')
        }
        
        // Optimized callback with immediate cleanup
        window.initMap = () => {
          console.log('Google Maps API loaded successfully')
          setIsMapLoaded(true)
          setIsLoadingMap(false)
          // Clean up the callback immediately
          delete window.initMap
        }
        
        document.head.appendChild(script)
      } catch (error) {
        console.error('Error loading Google Maps:', error)
        setIsLoadingMap(false)
        showError('Error loading Google Maps. Please refresh the page.')
      }
    }

    // Load immediately on component mount for better UX
    // Remove the interaction-based loading as it causes delays
    loadGoogleMaps()

    return () => {
      // Cleanup is handled by the script loading mechanism
    }
  }, [apiKey, showError])

  const initializeMap = () => {
    if (!window.google || !window.google.maps) return
    if (!mapRef.current) return

    try {
      console.log('Initializing map...')
      
      // Define bounding box for Atlantic provinces (NB, PEI, NS)
      const atlanticBounds = new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(43.0, -67.0), // Southwest corner
        new window.google.maps.LatLng(48.0, -60.0)  // Northeast corner
      )
      
      // Initialize map
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 46.0878, lng: -64.7782 }, // Moncton, New Brunswick coordinates
        zoom: 12,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'transit',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ],
        gestureHandling: 'greedy',
        clickableIcons: false,
        keyboardShortcuts: false
      })

      mapInstanceRef.current = map

      // Initialize Google Places Autocomplete for pickup address
      try {
        const pickupInput = document.getElementById('pickup-address')
        if (pickupInput) {
          const pickupAutocomplete = new window.google.maps.places.Autocomplete(pickupInput, {
            fields: ['formatted_address', 'geometry', 'name', 'place_id'],
            bounds: atlanticBounds,
            strictBounds: false,
            componentRestrictions: { country: 'ca' }
          })

          pickupAutocomplete.addListener('place_changed', () => {
            const place = pickupAutocomplete.getPlace()
            if (place && place.formatted_address) {
              const displayName = place.formatted_address
              setPickupAddress(displayName)
              console.log('Pickup place selected:', displayName)
              
              // Add pickup marker immediately
              addPickupMarker(displayName)
              
              // Auto-calculate route if dropoff addresses are already filled
              createTimeout(() => {
                if (dropoffAddress) {
                  if (secondDropoffAddress) {
                    updateMapWithMultipleDropoffs()
                  } else {
                    calculateRouteWithAddresses(displayName, dropoffAddress)
                  }
                }
              }, 300)
            }
          })

          autocompleteRefs.current.pickup = pickupAutocomplete
          console.log('Pickup autocomplete initialized')
        }
      } catch (error) {
        console.warn('Could not initialize pickup autocomplete:', error)
      }

      // Initialize Google Places Autocomplete for dropoff address
      try {
        const dropoffInput = document.getElementById('dropoff-address')
        if (dropoffInput) {
          const dropoffAutocomplete = new window.google.maps.places.Autocomplete(dropoffInput, {
            fields: ['formatted_address', 'geometry', 'name', 'place_id'],
            bounds: atlanticBounds,
            strictBounds: false,
            componentRestrictions: { country: 'ca' }
          })

          dropoffAutocomplete.addListener('place_changed', () => {
            const place = dropoffAutocomplete.getPlace()
            if (place && place.formatted_address) {
              const displayName = place.formatted_address
              setDropoffAddress(displayName)
              console.log('Dropoff place selected:', displayName)
              
              // Auto-calculate if both addresses are filled
              createTimeout(() => {
                const pickupInput = document.getElementById('pickup-address')
                const pickupValue = pickupInput ? pickupInput.value : ''
                
                if (pickupValue.trim()) {
                  const currentPickup = pickupValue.trim()
                  const currentDropoff = displayName
                  
                  if (secondDropoffAddress) {
                    updateMapWithMultipleDropoffs()
                  } else {
                    calculateRouteWithAddresses(currentPickup, currentDropoff)
                  }
                }
              }, 300)
            }
          })

          autocompleteRefs.current.dropoff = dropoffAutocomplete
          console.log('Dropoff autocomplete initialized')
        }
      } catch (error) {
        console.warn('Could not initialize dropoff autocomplete:', error)
      }

    } catch (error) {
      console.error('Error initializing map:', error)
    }
  }

  const initializeSecondDropoffAutocomplete = () => {
    if (!window.google || !window.google.maps) return

    try {
      // Define bounding box for Atlantic provinces (NB, PEI, NS)
      const atlanticBounds = new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(43.0, -67.0), // Southwest corner
        new window.google.maps.LatLng(48.0, -60.0)  // Northeast corner
      )
      
      const secondDropoffInput = document.getElementById('second-dropoff-address')
      if (secondDropoffInput && !autocompleteRefs.current.secondDropoff) {
        const secondDropoffAutocomplete = new window.google.maps.places.Autocomplete(secondDropoffInput, {
          fields: ['formatted_address', 'geometry', 'name', 'place_id'],
          bounds: atlanticBounds,
          strictBounds: false,
          componentRestrictions: { country: 'ca' }
        })

        secondDropoffAutocomplete.addListener('place_changed', () => {
          const place = secondDropoffAutocomplete.getPlace()
          
          if (place && place.formatted_address && place.geometry && place.geometry.location) {
            const displayName = place.formatted_address
            setSecondDropoffAddress(displayName)
            console.log('Second dropoff place selected:', displayName)
            
            // Update map immediately with the selected address
            updateMapWithMultipleDropoffs(displayName)
          }
        })

        autocompleteRefs.current.secondDropoff = secondDropoffAutocomplete
        console.log('Second dropoff autocomplete initialized')
      }
    } catch (error) {
      console.warn('Could not initialize second dropoff autocomplete:', error)
    }
  }

  const updateMapWithMultipleDropoffs = async (providedSecondDropoff = null) => {
    if (!window.google || !window.google.maps || !mapInstanceRef.current) {
      showError('Google Maps is not loaded yet. Please wait a moment and try again.')
      return
    }
    
    // Use provided address or fall back to state
    const currentSecondDropoff = providedSecondDropoff || secondDropoffAddress
    
    if (!pickupAddress || !dropoffAddress || !currentSecondDropoff) {
      console.log('Missing addresses for multi-dropoff:', { pickupAddress, dropoffAddress, secondDropoffAddress: currentSecondDropoff })
      showError('Please enter all required addresses for multi-stop route')
      return
    }

    console.log('Updating map with multiple dropoffs:', { pickupAddress, dropoffAddress, secondDropoffAddress: currentSecondDropoff })
    console.log('Current state values in updateMapWithMultipleDropoffs:', { 
      pickupAddress, 
      dropoffAddress, 
      secondDropoffAddress: currentSecondDropoff,
      showSecondDropoff 
    })

    // Set calculating state
    setIsCalculating(true)
    setDistance(null)
    setTravelTime(null)

    try {
      // Clear existing route and markers
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null)
        directionsRendererRef.current = null
      }
      clearCustomMarkers()

      const directionsService = new window.google.maps.DirectionsService()
      
      // For multiple dropoffs: pickup → first dropoff → second dropoff
      const waypoints = [{
        location: dropoffAddress,
        stopover: true
      }]

      const request = {
        origin: pickupAddress,
        destination: currentSecondDropoff,
        waypoints: waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false // Don't optimize to maintain order
      }

      console.log('Directions request:', request)
      const result = await directionsService.route(request)

      if (result.routes && result.routes.length > 0) {
        // Calculate total distance and time
        let totalDistance = 0
        let totalTime = 0
        
        result.routes[0].legs.forEach(leg => {
          totalDistance += leg.distance.value
          totalTime += leg.duration.value
        })

        const distanceKm = totalDistance / 1000
        const timeMinutes = Math.round(totalTime / 60)
        
        setDistance(distanceKm)
        setTravelTime(timeMinutes)
        
        // Calculate fare
        const calculatedFare = Math.max(
          settings.minFare,
          settings.baseFare + (settings.perKmRate * distanceKm)
        )
        
        // Display route on map with custom markers
        const directionsRenderer = new window.google.maps.DirectionsRenderer({
          suppressMarkers: true, // Hide default markers
          polylineOptions: {
            strokeColor: '#3B82F6',
            strokeWeight: 4
          }
        })
        directionsRenderer.setMap(mapInstanceRef.current)
        directionsRenderer.setDirections(result)
        directionsRendererRef.current = directionsRenderer

        // Add custom markers for our specific locations
        await addCustomMarkers(pickupAddress, dropoffAddress, currentSecondDropoff)
        
        console.log('Multi-dropoff route calculated successfully:', { distanceKm, timeMinutes, calculatedFare })
        showSuccess(`Multi-stop route calculated! Distance: ${distanceKm.toFixed(2)} km, Time: ${timeMinutes} min`)
      } else {
        showError('No route found for the multi-stop journey. Please check your addresses and try again.')
      }
    } catch (error) {
      console.error('Error calculating multi-dropoff route:', error)
      
      let errorMessage = 'Error calculating multi-stop route. '
      if (error.status === 'ZERO_RESULTS') {
        errorMessage += 'No route found for the multi-stop journey. Please check your addresses and try again.'
      } else if (error.status === 'OVER_QUERY_LIMIT') {
        errorMessage += 'Too many requests. Please wait a moment and try again.'
      } else if (error.status === 'REQUEST_DENIED') {
        errorMessage += 'Request denied. Please check your Google Maps API key.'
      } else if (error.status === 'INVALID_REQUEST') {
        errorMessage += 'Invalid request. Please check your addresses and try again.'
      } else {
        errorMessage += error.message || 'Please check your addresses and try again.'
      }
      
      showError(errorMessage)
      
      // Fallback to single route if multi-dropoff fails
      if (pickupAddress && dropoffAddress) {
        console.log('Falling back to single route calculation')
        calculateRouteWithAddresses(pickupAddress, dropoffAddress)
      }
    } finally {
      setIsCalculating(false)
    }
  }

  // Helper function to create a marker
  const createMarker = useCallback((position, title, iconUrl, labelText, color) => {
    return new window.google.maps.Marker({
      position: position,
      map: mapInstanceRef.current,
      title: title,
      icon: {
        url: iconUrl,
        scaledSize: new window.google.maps.Size(32, 32)
      },
      label: {
        text: labelText,
        color: 'white',
        fontWeight: 'bold',
        fontSize: '12px'
      }
    })
  }, [])

  // Helper function to geocode an address
  const geocodeAddress = useCallback((address, markerInfo) => {
    return new Promise((resolve, reject) => {
      console.log(`Geocoding address: ${address}`)
      const geocoder = new window.google.maps.Geocoder()
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          console.log(`Successfully geocoded ${address}:`, results[0].geometry.location.toString())
          const marker = createMarker(
            results[0].geometry.location,
            markerInfo.title,
            markerInfo.iconUrl,
            markerInfo.labelText,
            markerInfo.color
          )
          resolve(marker)
        } else {
          console.error(`Geocoding failed for ${address}:`, status)
          reject(new Error(`Geocoding failed for ${address}: ${status}`))
        }
      })
    })
  }, [createMarker])

  // Function to add a single pickup marker immediately
  const addPickupMarker = async (address) => {
    if (!window.google || !window.google.maps || !mapInstanceRef.current || !address) return

    try {
      // Remove existing pickup marker if any
      if (customMarkersRef.current) {
        const pickupMarker = customMarkersRef.current.find(marker => 
          marker.getTitle() === 'Pickup'
        )
        if (pickupMarker) {
          pickupMarker.setMap(null)
          customMarkersRef.current = customMarkersRef.current.filter(marker => 
            marker.getTitle() !== 'Pickup'
          )
        }
      }

      // Add new pickup marker
      const marker = await geocodeAddress(address, {
        title: 'Pickup',
        iconUrl: 'https://maps.google.com/mapfiles/marker.png',
        labelText: 'P',
        color: 'white'
      })

      // Add to markers array
      if (!customMarkersRef.current) {
        customMarkersRef.current = []
      }
      customMarkersRef.current.push(marker)

      console.log('Pickup marker added immediately for:', address)
    } catch (error) {
      console.error('Error adding pickup marker:', error)
    }
  }

  const addCustomMarkers = async (providedPickup = null, providedDropoff = null, providedSecondDropoff = null) => {
    if (!window.google || !window.google.maps || !mapInstanceRef.current) return

    // Use provided addresses or fall back to state
    const currentPickup = providedPickup || pickupAddress
    const currentDropoff = providedDropoff || dropoffAddress
    const currentSecondDropoff = providedSecondDropoff || secondDropoffAddress

    // Store existing pickup marker before clearing
    let existingPickupMarker = null
    if (customMarkersRef.current) {
      existingPickupMarker = customMarkersRef.current.find(marker => 
        marker.getTitle() === 'Pickup'
      )
    }

    // Clear only non-pickup markers
    if (customMarkersRef.current) {
      customMarkersRef.current.forEach(marker => {
        if (marker.getTitle() !== 'Pickup') {
          marker.setMap(null)
        }
      })
      customMarkersRef.current = customMarkersRef.current.filter(marker => 
        marker.getTitle() === 'Pickup'
      )
    }

    const markers = []
    const geocoder = new window.google.maps.Geocoder()

    console.log('Adding custom markers for addresses:', { currentPickup, currentDropoff, secondDropoffAddress: currentSecondDropoff })

    try {
      // Geocode all addresses in parallel
      const geocodePromises = []

      // Add pickup marker (reuse existing or create new)
      if (currentPickup) {
        if (existingPickupMarker) {
          // Reuse existing pickup marker
          markers.push(existingPickupMarker)
          console.log('Reusing existing pickup marker')
        } else {
          // Create new pickup marker
          geocodePromises.push(
            geocodeAddress(currentPickup, {
              title: 'Pickup',
              iconUrl: 'https://maps.google.com/mapfiles/marker.png',
              labelText: 'P',
              color: 'white'
            })
          )
        }
      }

      // Add first dropoff marker
      if (currentDropoff) {
        geocodePromises.push(
          geocodeAddress(currentDropoff, {
            title: 'First Drop-off',
            iconUrl: 'https://maps.google.com/mapfiles/marker.png',
            labelText: '1',
            color: 'white'
          })
        )
      }

      // Add second dropoff marker
      if (currentSecondDropoff) {
        geocodePromises.push(
          geocodeAddress(currentSecondDropoff, {
            title: 'Second Drop-off',
            iconUrl: 'https://maps.google.com/mapfiles/marker.png',
            labelText: '2',
            color: 'white'
          })
        )
      }

      // Wait for all geocoding to complete
      const markerResults = await Promise.allSettled(geocodePromises)
      
      // Add successful markers to the array
      markerResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          markers.push(result.value)
          console.log(`Successfully added marker ${index + 1}`)
        } else {
          console.error(`Failed to add marker ${index + 1}:`, result.reason)
        }
      })


      customMarkersRef.current = markers
      console.log(`Successfully created ${markers.length} custom markers`)
      
      // Log marker positions for debugging
      markers.forEach((marker, index) => {
        console.log(`Marker ${index + 1} position:`, marker.getPosition().toString())
      })

    } catch (error) {
      console.error('Error in addCustomMarkers:', error)
    }
  }

  const clearCustomMarkers = useCallback(() => {
    if (customMarkersRef.current) {
      customMarkersRef.current.forEach(marker => {
        marker.setMap(null)
      })
      customMarkersRef.current = []
    }
  }, [])

  // Initialize map when Google Maps API is loaded with optimized timing
  useEffect(() => {
    if (isMapLoaded && mapRef.current) {
      // Reduced delay for faster initialization
      createTimeout(() => {
        initializeMap()
      }, 100)
    }
  }, [isMapLoaded])

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clear all timeouts
      timeoutRefs.current.forEach(timeoutId => {
        clearTimeout(timeoutId)
      })
      timeoutRefs.current = []
      
      // Clean up autocomplete instances
      Object.values(autocompleteRefs.current).forEach(autocomplete => {
        if (autocomplete && autocomplete.unbindAll) {
          autocomplete.unbindAll()
        }
      })
      autocompleteRefs.current = {}
      
      // Clear custom markers
      clearCustomMarkers()
      
      // Clear directions renderer
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null)
        directionsRendererRef.current = null
      }
      
      // Clear map instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Initialize second dropoff autocomplete when the field becomes visible
  useEffect(() => {
    if (showSecondDropoff && isMapLoaded) {
      // Add a small delay to ensure the DOM element is rendered
      createTimeout(() => {
        initializeSecondDropoffAutocomplete()
      }, 100)
    }
  }, [showSecondDropoff, isMapLoaded])

  // Note: Map updates for second dropoff are now handled only by autocomplete place_changed events
  // This ensures the map only updates when a valid address is selected, not while typing

  const calculateRouteWithAddresses = async (pickup, dropoff) => {
    if (!pickup || !dropoff) {
      console.log('Missing addresses for calculation:', { pickup, dropoff })
      showError('Please enter both pickup and dropoff addresses')
      return
    }

    if (!window.google || !window.google.maps) {
      showError('Google Maps is not loaded yet. Please wait a moment and try again.')
      return
    }

    setIsCalculating(true)
    setDistance(null)
    setTravelTime(null)

    try {
      const directionsService = new window.google.maps.DirectionsService()
      
      console.log('Calculating route with addresses:', { pickup, dropoff })
      
      const result = await directionsService.route({
        origin: pickup,
        destination: dropoff,
        travelMode: window.google.maps.TravelMode.DRIVING
      })
      
      console.log('Directions API result:', result)

      if (result.routes && result.routes.length > 0) {
        const route = result.routes[0]
        const leg = route.legs[0]
        
        const distanceKm = leg.distance.value / 1000
        const timeMinutes = Math.round(leg.duration.value / 60)
        
        setDistance(distanceKm)
        setTravelTime(timeMinutes)
        
        // Calculate fare
        const calculatedFare = Math.max(
          settings.minFare,
          settings.baseFare + (settings.perKmRate * distanceKm)
        )
        
        // Display route on map with custom markers
        if (directionsRendererRef.current) {
          directionsRendererRef.current.setMap(null)
        }
        
        // Clear only dropoff markers, preserve pickup marker
        if (customMarkersRef.current) {
          customMarkersRef.current.forEach(marker => {
            if (marker.getTitle() !== 'Pickup') {
              marker.setMap(null)
            }
          })
          customMarkersRef.current = customMarkersRef.current.filter(marker => 
            marker.getTitle() === 'Pickup'
          )
        }
        
        const directionsRenderer = new window.google.maps.DirectionsRenderer({
          suppressMarkers: true, // Hide default markers
          polylineOptions: {
            strokeColor: '#3B82F6',
            strokeWeight: 4
          }
        })
        directionsRenderer.setMap(mapInstanceRef.current)
        directionsRenderer.setDirections(result)
        directionsRendererRef.current = directionsRenderer

        // Add custom markers for single route
        await addCustomMarkers(pickup, dropoff)
        
        console.log('Route calculated successfully:', { distanceKm, timeMinutes, calculatedFare })
        showSuccess(`Route calculated successfully! Distance: ${distanceKm.toFixed(2)} km, Time: ${timeMinutes} min`)
      } else {
        showError('No route found between the selected addresses. Please check your addresses and try again.')
      }
    } catch (error) {
      console.error('Error calculating route:', error)
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        pickup,
        dropoff
      })
      
      let errorMessage = 'Error calculating route. '
      if (error.status === 'ZERO_RESULTS') {
        errorMessage += 'No route found between the selected addresses. Please check your addresses and try again.'
      } else if (error.status === 'OVER_QUERY_LIMIT') {
        errorMessage += 'Too many requests. Please wait a moment and try again.'
      } else if (error.status === 'REQUEST_DENIED') {
        errorMessage += 'Request denied. Please check your Google Maps API key.'
      } else if (error.status === 'INVALID_REQUEST') {
        errorMessage += 'Invalid request. Please check your addresses and try again.'
      } else {
        errorMessage += error.message || 'Please check your addresses and try again.'
      }
      
      showError(errorMessage)
    } finally {
      setIsCalculating(false)
    }
  }

  const calculateRoute = async () => {
    if (!pickupAddress || !dropoffAddress) {
      alert('Please enter both pickup and dropoff addresses')
      return
    }

    if (secondDropoffAddress) {
      await updateMapWithMultipleDropoffs()
    } else {
      await calculateRouteWithAddresses(pickupAddress, dropoffAddress)
    }
  }

  const sendBookingEmail = async () => {
    if (!pickupAddress || !dropoffAddress) {
      showError('Please enter both pickup and dropoff addresses')
      return
    }

    if (!customerName || !emailAddress || !phoneNumber) {
      showError('Please fill in all required customer information (Name, Email, Phone)')
      return
    }

    setIsSendingEmail(true)

    try {
      // Prepare email template parameters
      const templateParams = {
        customer_name: customerName,
        pickup_address: pickupAddress,
        dropoff_address: dropoffAddress,
        second_dropoff_address: secondDropoffAddress || 'Not specified',
        pickup_date: pickupDateTime ? pickupDateTime.split('T')[0] : 'Not specified',
        pickup_time: pickupDateTime ? (() => {
          const time = pickupDateTime.split('T')[1] || '12:00'
          const [hours, minutes] = time.split(':')
          const hour24 = parseInt(hours)
          const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
          const period = hour24 >= 12 ? 'PM' : 'AM'
          return `${hour12}:${minutes} ${period}`
        })() : 'Not specified',
        return_date: isReturnTrip && returnDateTime ? returnDateTime.split('T')[0] : 'Not specified',
        return_time: isReturnTrip && returnDateTime ? (() => {
          const time = returnDateTime.split('T')[1] || '12:00'
          const [hours, minutes] = time.split(':')
          const hour24 = parseInt(hours)
          const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
          const period = hour24 >= 12 ? 'PM' : 'AM'
          return `${hour12}:${minutes} ${period}`
        })() : 'Not specified',
        email_address: emailAddress,
        phone_number: phoneNumber,
        number_of_passengers: numberOfPassengers,
        return_trip: isReturnTrip ? 'Yes' : 'No',
        message: message || 'No special requests',
        distance: distance ? `${distance.toFixed(2)} km` : 'Not calculated',
        travel_time: travelTime ? `${travelTime} minutes` : 'Not calculated',
        estimated_fare: calculatedFare ? `${settings.currency} ${calculatedFare.toFixed(2)}` : 'Not calculated',
        booking_date: new Date().toLocaleString(),
        to_email: 'info@monctontaxi.com' // Replace with the email address where you want to receive bookings
      }

      // Send email using EmailJS
      const response = await emailjs.send(
        emailConfig.serviceId,
        emailConfig.templateId,
        templateParams,
        emailConfig.publicKey
      )

      console.log('Email sent successfully:', response)
      showBookingPopup('Thank you for your booking request we will send you a confirmation as soon as possible')
      
      // Form will be cleared when user clicks OK on the popup

    } catch (error) {
      console.error('Error sending email:', error)
      
      let errorMessage = 'Failed to submit booking. '
      if (error.status === 400) {
        errorMessage += 'Invalid email configuration. Please contact support.'
      } else if (error.status === 401) {
        errorMessage += 'Authentication failed. Please contact support.'
      } else if (error.status === 403) {
        errorMessage += 'Access denied. Please contact support.'
      } else if (error.status === 429) {
        errorMessage += 'Too many requests. Please wait a moment and try again.'
      } else {
        errorMessage += 'Please try again or contact us directly.'
      }
      
      showError(errorMessage)
    } finally {
      setIsSendingEmail(false)
    }
  }

  // Email validation helper
  const isValidEmail = useCallback((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }, [])

  // Phone validation helper - more flexible
  const isValidPhoneNumber = useCallback((phone) => {
    if (!phone || !phone.trim()) return false
    
    // Remove all non-numeric characters except +
    const cleanPhone = phone.replace(/[^\d+]/g, '')
    
    // Must have at least 10 digits (North American phone number)
    // Allow for +1 prefix (11 characters total) or just 10 digits
    const digitCount = cleanPhone.replace(/\+/g, '').length
    return digitCount >= 10 && digitCount <= 11
  }, [])

  // Get current date in Moncton timezone (Atlantic Time) - memoized
  const getCurrentDateInMoncton = useCallback(() => {
    const now = new Date()
    // Moncton is in Atlantic Time (UTC-4 in winter, UTC-3 in summer)
    // Using Intl.DateTimeFormat to get the correct timezone
    const monctonDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Moncton',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(now)
    
    // Format as YYYY-MM-DD for HTML date input
    const year = monctonDate.find(part => part.type === 'year').value
    const month = monctonDate.find(part => part.type === 'month').value
    const day = monctonDate.find(part => part.type === 'day').value
    
    return `${year}-${month}-${day}`
  }, [])

  // Validate pickup date and time - memoized
  const validatePickupDateTime = useCallback((dateTime) => {
    if (!dateTime) return false
    
    const selectedDate = dateTime.split('T')[0]
    const currentDate = getCurrentDateInMoncton()
    
    // Check if selected date is before today
    if (selectedDate < currentDate) {
      return false
    }
    
    // If it's today, check if the time is in the future
    if (selectedDate === currentDate) {
      const now = new Date()
      const monctonTime = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Moncton',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(now)
      
      const selectedTime = dateTime.split('T')[1] || '12:00'
      const [selectedHour, selectedMinute] = selectedTime.split(':').map(Number)
      const [currentHour, currentMinute] = monctonTime.split(':').map(Number)
      
      const selectedMinutes = selectedHour * 60 + selectedMinute
      const currentMinutes = currentHour * 60 + currentMinute
      
      return selectedMinutes > currentMinutes
    }
    
    return true
  }, [getCurrentDateInMoncton])

  // Validation function - memoized
  const validateRequiredFields = useCallback(() => {
    const errors = {
      customerName: !customerName.trim(),
      emailAddress: !emailAddress.trim() || !isValidEmail(emailAddress),
      phoneNumber: !phoneNumber.trim() || !isValidPhoneNumber(phoneNumber),
      pickupDateTime: !pickupDateTime || !validatePickupDateTime(pickupDateTime),
      returnDateTime: isReturnTrip && (!returnDateTime || !validatePickupDateTime(returnDateTime)),
      numberOfPassengers: !numberOfPassengers || numberOfPassengers < 1 || numberOfPassengers > 40
    }
    
    setValidationErrors(errors)
    
    // Show specific error messages
    if (errors.customerName) {
      showError('Please enter your full name')
    } else if (errors.emailAddress) {
      if (!emailAddress.trim()) {
        showError('Please enter your email address')
      } else {
        showError('Please enter a valid email address')
      }
    } else if (errors.phoneNumber) {
      if (!phoneNumber.trim()) {
        showError('Please enter your phone number')
      } else {
        showError('Please enter a valid phone number (e.g., +1 (555) 123-4567)')
      }
    } else if (errors.pickupDateTime) {
      showError('Please select a valid pickup date and time in the future')
    } else if (errors.returnDateTime) {
      showError('Please select a valid return date and time in the future')
    } else if (errors.numberOfPassengers) {
      showError('Please enter a valid number of passengers (1-40)')
    }
    
    // Return true if all fields are valid
    return !Object.values(errors).some(error => error)
  }, [customerName, emailAddress, phoneNumber, pickupDateTime, returnDateTime, isReturnTrip, numberOfPassengers, isValidEmail, isValidPhoneNumber, validatePickupDateTime, showError])

  // Clear validation error for a specific field
  const clearValidationError = useCallback((fieldName) => {
    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: false
    }))
  }, [])

  const handleBookNow = async () => {
    // Validate required fields first
    if (!validateRequiredFields()) {
      return // Stop if validation fails
    }
    
    try {
      // First calculate the route and fare
      await calculateRoute()
      
      // Then send the booking email
      await sendBookingEmail()
    } catch (error) {
      console.error('Error in booking process:', error)
      showError('An error occurred during booking. Please try again.')
    }
  }

  // Phone number formatting function - always show +1 format
  const formatPhoneNumber = useCallback((value) => {
    // Remove all non-numeric characters except +
    const phoneNumber = value.replace(/[^\d+]/g, '')
    
    // If empty, return empty string
    if (!phoneNumber) return ''
    
    // If it starts with +1, keep it as is
    if (phoneNumber.startsWith('+1')) {
      const digits = phoneNumber.slice(2)
      const limitedDigits = digits.slice(0, 10)
      
      if (limitedDigits.length <= 3) {
        return `+1 (${limitedDigits}`
      } else if (limitedDigits.length <= 6) {
        return `+1 (${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3)}`
      } else {
        return `+1 (${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`
      }
    }
    
    // If it starts with 1, treat as +1
    if (phoneNumber.startsWith('1')) {
      const digits = phoneNumber.slice(1)
      const limitedDigits = digits.slice(0, 10)
      
      if (limitedDigits.length <= 3) {
        return `+1 (${limitedDigits}`
      } else if (limitedDigits.length <= 6) {
        return `+1 (${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3)}`
      } else {
        return `+1 (${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`
      }
    }
    
    // For any 10-digit number, format as +1 (XXX) XXX-XXXX
    const limitedDigits = phoneNumber.slice(0, 10)
    
    if (limitedDigits.length <= 3) {
      return `+1 (${limitedDigits}`
    } else if (limitedDigits.length <= 6) {
      return `+1 (${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3)}`
    } else {
      return `+1 (${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`
    }
  }, [])

  const handlePhoneNumberChange = useCallback((e) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhoneNumber(formatted)
  }, [formatPhoneNumber])

  const clearResults = () => {
    console.log('Clearing results...')
    setDistance(null)
    setTravelTime(null)
    setPickupAddress('')
    setDropoffAddress('')
    setSecondDropoffAddress('')
    setShowSecondDropoff(false)
    
    // Clear customer information
    setCustomerName('')
    setPickupDateTime('')
    setEmailAddress('')
    setPhoneNumber('')
    setNumberOfPassengers(1)
    setIsReturnTrip(false)
    setReturnDateTime(() => {
      // Reset to current date and time + 2 hours in Moncton timezone
      const now = new Date()
      const futureTime = new Date(now.getTime() + 2 * 60 * 60 * 1000)
      
      const monctonDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Moncton',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).formatToParts(futureTime)
      
      const monctonTime = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Moncton',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(futureTime)
      
      const year = monctonDate.find(part => part.type === 'year').value
      const month = monctonDate.find(part => part.type === 'month').value
      const day = monctonDate.find(part => part.type === 'day').value
      
      return `${year}-${month}-${day}T${monctonTime}`
    })
    setMessage('')
    
    // Clear validation errors
    setValidationErrors({
      customerName: false,
      emailAddress: false,
      phoneNumber: false,
      pickupDateTime: false,
      returnDateTime: false,
      numberOfPassengers: false
    })
    
    // Clear autocomplete references
    if (autocompleteRefs.current.secondDropoff) {
      autocompleteRefs.current.secondDropoff = null
    }
    
    // Clear custom markers
    clearCustomMarkers()
    
    // Clear the map route
    if (directionsRendererRef.current) {
      console.log('Clearing map route...')
      directionsRendererRef.current.setMap(null)
      directionsRendererRef.current = null
    }
    
    console.log('Results cleared successfully')
  }


  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`${isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'} shadow-sm border-b transition-colors duration-200`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className={`text-2xl font-bold flex items-center transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Moncton Taxi
            </h1>
            
            <div className="flex items-center space-x-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
                  isDarkMode 
                    ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.001 9.001 0 0012 21a9.001 9.001 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              
              {/* Settings Wheel */}
              <Link
                to="/settings"
                className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
                  isDarkMode 
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-blue-400' 
                    : 'bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600'
                }`}
                title="Fare Settings"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Booking Popup Modal */}
      {bookingPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 transition-opacity duration-300"
            onClick={handleBookingPopupClose}
          />
          
          {/* Modal */}
          <div className={`relative w-full max-w-md transform transition-all duration-300 ${
            bookingPopup ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}>
            <div className={`rounded-2xl shadow-2xl border transition-colors duration-200 ${
              isDarkMode 
                ? 'bg-gray-900 border-green-500/20' 
                : 'bg-white border-green-200'
            }`}>
              {/* Header */}
              <div className="flex items-center justify-between p-6 pb-4">
                <div className="flex items-center space-x-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    isDarkMode ? 'bg-green-500/20' : 'bg-green-100'
                  }`}>
                    <svg className={`w-6 h-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold transition-colors duration-200 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Booking Confirmed
                    </h3>
                  </div>
                </div>
                <button
                  onClick={handleBookingPopupClose}
                  className={`p-2 rounded-full transition-colors duration-200 hover:scale-110 ${
                    isDarkMode 
                      ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Content */}
              <div className="px-6 pb-6">
                <p className={`text-sm leading-relaxed transition-colors duration-200 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {bookingPopup}
                </p>
                
                {/* Action Button */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleBookingPopupClose}
                    className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${
                      isDarkMode 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other Success Messages Banner */}
      {successMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className={`rounded-lg p-4 mb-4 transition-colors duration-200 ${
            isDarkMode 
              ? 'bg-green-900/20 border border-green-700/30 text-green-200' 
              : 'bg-green-50 border border-green-200 text-green-800'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className={`h-5 w-5 ${isDarkMode ? 'text-green-300' : 'text-green-400'}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{successMessage}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    type="button"
                    onClick={() => setSuccessMessage(null)}
                    className={`inline-flex rounded-md p-1.5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      isDarkMode
                        ? 'text-green-300 hover:bg-green-800/30 focus:ring-green-600 focus:ring-offset-gray-900'
                        : 'text-green-500 hover:bg-green-100 focus:ring-green-600 focus:ring-offset-green-50'
                    }`}
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Messages Banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className={`rounded-lg p-4 mb-4 transition-colors duration-200 ${
            isDarkMode 
              ? 'bg-red-900/20 border border-red-700/30 text-red-200' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className={`h-5 w-5 ${isDarkMode ? 'text-red-300' : 'text-red-400'}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className={`inline-flex rounded-md p-1.5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      isDarkMode
                        ? 'text-red-300 hover:bg-red-800/30 focus:ring-red-600 focus:ring-offset-gray-900'
                        : 'text-red-500 hover:bg-red-100 focus:ring-red-600 focus:ring-offset-red-50'
                    }`}
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Inputs Only */}
          <div className="space-y-4">
            
            {/* Address Inputs */}
            <div className={`${isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-100'} rounded-xl shadow-lg p-5 border transition-colors duration-200`}>
              <h2 className={`text-xl font-semibold mb-3 text-center transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Route Details</h2>
              <div className="space-y-3">
                <div>
                  <label htmlFor="pickup-address" className={`block text-sm font-medium mb-1 transition-colors duration-200 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Pickup Address
                  </label>
                  <div className="relative">
                    <input
                      id="pickup-address"
                      type="text"
                      placeholder="Enter pickup address"
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 transition-colors duration-200 ${
                        isDarkMode 
                          ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' 
                          : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                      }`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className={`h-5 w-5 transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="dropoff-address" className={`block text-sm font-medium mb-1 transition-colors duration-200 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Drop-off Address
                  </label>
                  <div className="relative">
                    <input
                      id="dropoff-address"
                      type="text"
                      placeholder="Enter drop-off address"
                      value={dropoffAddress}
                      onChange={(e) => setDropoffAddress(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 transition-colors duration-200 ${
                        isDarkMode 
                          ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' 
                          : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                      }`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className={`h-5 w-5 transition-colors duration-200 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    
                    {/* Plus Button for Second Dropoff - positioned under magnifying glass */}
                    {!showSecondDropoff && (
                      <button
                        type="button"
                        onClick={() => setShowSecondDropoff(true)}
                        className={`absolute top-8 right-3 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 ${
                          isDarkMode 
                            ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-600' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 border border-gray-300'
                        }`}
                      >
                        <span>+Address</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Second Dropoff Address Field */}
                {showSecondDropoff && (
                  <div>
                    <label htmlFor="second-dropoff-address" className={`block text-sm font-medium mb-1 transition-colors duration-200 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Second Drop-off Address
                    </label>
                    <div className="relative">
                      <input
                        id="second-dropoff-address"
                        type="text"
                        placeholder="Enter second drop-off address"
                        value={secondDropoffAddress}
                        onChange={(e) => setSecondDropoffAddress(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 transition-colors duration-200 ${
                          isDarkMode 
                            ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' 
                            : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                        }`}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className={`h-5 w-5 transition-colors duration-200 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Customer Information */}
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Date & Time {validationErrors.pickupDateTime && <span className="text-red-500">*</span>}
                  </label>
                  <div className="flex gap-2">
                    {/* Date Input */}
                    <input
                      type="date"
                      value={pickupDateTime.split('T')[0] || ''}
                      min={getCurrentDateInMoncton()}
                      onChange={(e) => {
                        const time = pickupDateTime.split('T')[1] || '12:00'
                        setPickupDateTime(`${e.target.value}T${time}`)
                        clearValidationError('pickupDateTime')
                      }}
                      className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                        validationErrors.pickupDateTime
                          ? 'border-red-500 ring-2 ring-red-200'
                          : isDarkMode 
                            ? 'bg-gray-900 border-gray-700 text-white' 
                            : 'border-gray-300 bg-white text-gray-900'
                      }`}
                    />
                    
                    {/* Simple Time Picker - 12 Hour Format */}
                    <div className={`flex-1 flex border rounded-lg transition-colors duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-900 border-gray-700' 
                        : 'border-gray-300 bg-white'
                    }`}>
                      {/* Hours Dropdown */}
                      <select
                        value={(() => {
                          const currentTime = pickupDateTime.split('T')[1] || '12:00'
                          const currentHour24 = parseInt(currentTime.split(':')[0]) || 12
                          // Convert 24-hour to 12-hour format
                          if (currentHour24 === 0) return 12
                          if (currentHour24 > 12) return currentHour24 - 12
                          return currentHour24
                        })()}
                        onChange={(e) => {
                          const currentDate = pickupDateTime.split('T')[0] || new Date().toISOString().split('T')[0]
                          const currentTime = pickupDateTime.split('T')[1] || '12:00'
                          const minutes = currentTime.split(':')[1] || '00'
                          const currentHour24 = parseInt(currentTime.split(':')[0]) || 12
                          const isPM = currentHour24 >= 12
                          const newHour12 = parseInt(e.target.value)
                          const newHour24 = newHour12 === 12 ? (isPM ? 12 : 0) : (isPM ? newHour12 + 12 : newHour12)
                          const newHour24Str = newHour24.toString().padStart(2, '0')
                          setPickupDateTime(`${currentDate}T${newHour24Str}:${minutes}`)
                          clearValidationError('pickupDateTime')
                        }}
                        className={`flex-1 px-3 py-2 border-0 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                          isDarkMode 
                            ? 'bg-gray-900 text-white' 
                            : 'bg-white text-gray-900'
                        }`}
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {(i + 1).toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                      
                      {/* Separator */}
                      <div className={`flex items-center px-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        :
                      </div>
                      
                      {/* Minutes Dropdown */}
                      <select
                        value={pickupDateTime.split('T')[1]?.split(':')[1] || '00'}
                        onChange={(e) => {
                          const currentDate = pickupDateTime.split('T')[0] || new Date().toISOString().split('T')[0]
                          const currentTime = pickupDateTime.split('T')[1] || '12:00'
                          const hours = currentTime.split(':')[0] || '12'
                          setPickupDateTime(`${currentDate}T${hours}:${e.target.value}`)
                          clearValidationError('pickupDateTime')
                        }}
                        className={`flex-1 px-3 py-2 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                          isDarkMode 
                            ? 'bg-gray-900 text-white' 
                            : 'bg-white text-gray-900'
                        }`}
                      >
                        {Array.from({ length: 60 }, (_, i) => (
                          <option key={i} value={i.toString().padStart(2, '0')}>
                            {i.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                      
                      {/* AM/PM Toggle */}
                      <div className="flex">
                        {['AM', 'PM'].map((period) => {
                          const currentTime = pickupDateTime.split('T')[1] || '12:00'
                          const currentHour24 = parseInt(currentTime.split(':')[0]) || 12
                          // Default to AM if no time is set, otherwise use proper 24-hour logic
                          const isPM = pickupDateTime ? (currentHour24 >= 12) : false
                          const isCurrentPeriod = (period === 'PM') === isPM
                          
                          return (
                            <button
                              key={period}
                              type="button"
                              onClick={() => {
                                const currentDate = pickupDateTime.split('T')[0] || new Date().toISOString().split('T')[0]
                                const currentTime = pickupDateTime.split('T')[1] || '12:00'
                                const currentHour24 = parseInt(currentTime.split(':')[0]) || 12
                                const minutes = currentTime.split(':')[1] || '00'
                                const currentHour12 = currentHour24 === 0 ? 12 : currentHour24 > 12 ? currentHour24 - 12 : currentHour24
                                const newHour24 = period === 'PM' 
                                  ? (currentHour12 === 12 ? 12 : currentHour12 + 12)
                                  : (currentHour12 === 12 ? 0 : currentHour12)
                                const newHour24Str = newHour24.toString().padStart(2, '0')
                                const newDateTime = `${currentDate}T${newHour24Str}:${minutes}`
                                console.log('AM/PM clicked:', { period, currentDateTime: pickupDateTime, newDateTime })
                                setPickupDateTime(newDateTime)
                                clearValidationError('pickupDateTime')
                              }}
                              className={`px-3 py-2 text-sm font-medium border-0 transition-colors duration-200 ${
                                isCurrentPeriod 
                                  ? `${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'}`
                                  : `${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                              } ${period === 'AM' ? 'rounded-l-lg' : 'rounded-r-lg'}`}
                            >
                              {period}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Date validation error message */}
                  {validationErrors.pickupDateTime && (
                    <p className="text-red-500 text-sm mt-1">
                      Please select a date and time in the future (Moncton timezone)
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="customer-name" className={`block text-sm font-medium mb-1 transition-colors duration-200 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Name {validationErrors.customerName && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    id="customer-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value)
                      clearValidationError('customerName')
                    }}
                    className={`w-3/4 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                      validationErrors.customerName
                        ? 'border-red-500 ring-2 ring-red-200'
                        : isDarkMode 
                          ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' 
                          : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="email-address" className={`block text-sm font-medium mb-1 transition-colors duration-200 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Email Address {validationErrors.emailAddress && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    id="email-address"
                    type="email"
                    placeholder="Enter your email address"
                    value={emailAddress}
                    onChange={(e) => {
                      setEmailAddress(e.target.value)
                      clearValidationError('emailAddress')
                    }}
                    className={`w-3/4 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                      validationErrors.emailAddress
                        ? 'border-red-500 ring-2 ring-red-200'
                        : isDarkMode 
                          ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' 
                          : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="phone-number" className={`block text-sm font-medium mb-1 transition-colors duration-200 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Phone Number {validationErrors.phoneNumber && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    id="phone-number"
                    type="tel"
                    placeholder="+1 (506) 797-0087"
                    value={phoneNumber}
                    onChange={(e) => {
                      handlePhoneNumberChange(e)
                      clearValidationError('phoneNumber')
                    }}
                    maxLength={20} // Allow for longer input before formatting
                    className={`w-3/4 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                      validationErrors.phoneNumber
                        ? 'border-red-500 ring-2 ring-red-200'
                        : isDarkMode 
                          ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' 
                          : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="number-of-passengers" className={`block text-sm font-medium mb-1 transition-colors duration-200 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Number of Passengers {validationErrors.numberOfPassengers && <span className="text-red-500">*</span>}
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      id="number-of-passengers"
                      type="number"
                      min="1"
                      max="40"
                      placeholder="1"
                      value={numberOfPassengers}
                      onChange={(e) => {
                        setNumberOfPassengers(parseInt(e.target.value) || 1)
                        clearValidationError('numberOfPassengers')
                      }}
                      className={`w-1/4 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                        validationErrors.numberOfPassengers
                          ? 'border-red-500 ring-2 ring-red-200'
                          : isDarkMode 
                            ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' 
                            : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                      }`}
                    />
                    <div className="flex items-center">
                      <input
                        id="return-trip"
                        type="checkbox"
                        checked={isReturnTrip}
                        onChange={(e) => setIsReturnTrip(e.target.checked)}
                        className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-colors duration-200 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-blue-500' 
                            : 'bg-white border-gray-300'
                        }`}
                      />
                      <label htmlFor="return-trip" className={`ml-2 text-sm font-medium transition-colors duration-200 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        Return Trip
                      </label>
                    </div>
                  </div>
                </div>

                {/* Return Date & Time Field - Only show when return trip is selected */}
                {isReturnTrip && (
                  <div>
                    <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Return Date & Time {validationErrors.returnDateTime && <span className="text-red-500">*</span>}
                    </label>
                    <div className="flex gap-2">
                      {/* Return Date Input */}
                      <input
                        type="date"
                        value={returnDateTime.split('T')[0] || ''}
                        min={getCurrentDateInMoncton()}
                        onChange={(e) => {
                          const time = returnDateTime.split('T')[1] || '12:00'
                          setReturnDateTime(`${e.target.value}T${time}`)
                          clearValidationError('returnDateTime')
                        }}
                        className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                          validationErrors.returnDateTime
                            ? 'border-red-500 ring-2 ring-red-200'
                            : isDarkMode 
                              ? 'bg-gray-900 border-gray-700 text-white' 
                              : 'border-gray-300 bg-white text-gray-900'
                        }`}
                      />
                      
                      {/* Return Time Picker - 12 Hour Format */}
                      <div className={`flex-1 flex border rounded-lg transition-colors duration-200 ${
                        isDarkMode 
                          ? 'bg-gray-900 border-gray-700' 
                          : 'border-gray-300 bg-white'
                      }`}>
                        {/* Hours Dropdown */}
                        <select
                          value={(() => {
                            const currentTime = returnDateTime.split('T')[1] || '12:00'
                            const currentHour24 = parseInt(currentTime.split(':')[0]) || 12
                            // Convert 24-hour to 12-hour format
                            if (currentHour24 === 0) return 12
                            if (currentHour24 > 12) return currentHour24 - 12
                            return currentHour24
                          })()}
                          onChange={(e) => {
                            const currentDate = returnDateTime.split('T')[0] || new Date().toISOString().split('T')[0]
                            const currentTime = returnDateTime.split('T')[1] || '12:00'
                            const minutes = currentTime.split(':')[1] || '00'
                            const currentHour24 = parseInt(currentTime.split(':')[0]) || 12
                            const isPM = currentHour24 >= 12
                            const newHour12 = parseInt(e.target.value)
                            const newHour24 = newHour12 === 12 ? (isPM ? 12 : 0) : (isPM ? newHour12 + 12 : newHour12)
                            const newHour24Str = newHour24.toString().padStart(2, '0')
                            setReturnDateTime(`${currentDate}T${newHour24Str}:${minutes}`)
                            clearValidationError('returnDateTime')
                          }}
                          className={`flex-1 px-3 py-2 border-0 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                            isDarkMode 
                              ? 'bg-gray-900 text-white' 
                              : 'bg-white text-gray-900'
                          }`}
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {(i + 1).toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                        
                        {/* Separator */}
                        <div className={`flex items-center px-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          :
                        </div>
                        
                        {/* Minutes Dropdown */}
                        <select
                          value={returnDateTime.split('T')[1]?.split(':')[1] || '00'}
                          onChange={(e) => {
                            const currentDate = returnDateTime.split('T')[0] || new Date().toISOString().split('T')[0]
                            const currentTime = returnDateTime.split('T')[1] || '12:00'
                            const hours = currentTime.split(':')[0] || '12'
                            setReturnDateTime(`${currentDate}T${hours}:${e.target.value}`)
                            clearValidationError('returnDateTime')
                          }}
                          className={`flex-1 px-3 py-2 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                            isDarkMode 
                              ? 'bg-gray-900 text-white' 
                              : 'bg-white text-gray-900'
                          }`}
                        >
                          {Array.from({ length: 60 }, (_, i) => (
                            <option key={i} value={i.toString().padStart(2, '0')}>
                              {i.toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                        
                        {/* AM/PM Toggle */}
                        <div className="flex">
                          {['AM', 'PM'].map((period) => {
                            const currentTime = returnDateTime.split('T')[1] || '12:00'
                            const currentHour24 = parseInt(currentTime.split(':')[0]) || 12
                            // Default to AM if no time is set, otherwise use proper 24-hour logic
                            const isPM = returnDateTime ? (currentHour24 >= 12) : false
                            const isCurrentPeriod = (period === 'PM') === isPM
                            
                            return (
                              <button
                                key={period}
                                type="button"
                                onClick={() => {
                                  const currentDate = returnDateTime.split('T')[0] || new Date().toISOString().split('T')[0]
                                  const currentTime = returnDateTime.split('T')[1] || '12:00'
                                  const currentHour24 = parseInt(currentTime.split(':')[0]) || 12
                                  const minutes = currentTime.split(':')[1] || '00'
                                  const currentHour12 = currentHour24 === 0 ? 12 : currentHour24 > 12 ? currentHour24 - 12 : currentHour24
                                  const newHour24 = period === 'PM' 
                                    ? (currentHour12 === 12 ? 12 : currentHour12 + 12)
                                    : (currentHour12 === 12 ? 0 : currentHour12)
                                  const newHour24Str = newHour24.toString().padStart(2, '0')
                                  const newDateTime = `${currentDate}T${newHour24Str}:${minutes}`
                                  setReturnDateTime(newDateTime)
                                  clearValidationError('returnDateTime')
                                }}
                                className={`px-3 py-2 text-sm font-medium border-0 transition-colors duration-200 ${
                                  isCurrentPeriod 
                                    ? `${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'}`
                                    : `${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                                } ${period === 'AM' ? 'rounded-l-lg' : 'rounded-r-lg'}`}
                              >
                                {period}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                    
                    {/* Return date validation error message */}
                    {validationErrors.returnDateTime && (
                      <p className="text-red-500 text-sm mt-1">
                        Please select a valid return date and time in the future (Moncton timezone)
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label htmlFor="message" className={`block text-sm font-medium mb-1 transition-colors duration-200 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Message / Special Requests
                  </label>
                  <textarea
                    id="message"
                    rows={2}
                    placeholder="Add your flight number or request a child seat or anything that can help us make your experience better"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 resize-none ${
                      isDarkMode 
                        ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' 
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
      </div>

              {/* Calculate Multi-Stop Route Button */}
              {secondDropoffAddress && (
                <div className="mt-4">
                  <button
                    onClick={updateMapWithMultipleDropoffs}
                    disabled={!pickupAddress || !dropoffAddress || !secondDropoffAddress || isCalculating || isSendingEmail}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                  >
                    {isCalculating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Calculating Route...
                      </>
                    ) : (
                      'Calculate Multi-Stop Route'
                    )}
                  </button>
                </div>
              )}

              {/* Calculate Button */}
              <div className="mt-6">
                <button
                  onClick={handleBookNow}
                  disabled={!pickupAddress || !dropoffAddress || isCalculating || isSendingEmail}
                  className="w-full bg-black hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                >
                  {isSendingEmail ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending Booking...
                    </>
                  ) : isCalculating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Calculating Route...
                    </>
                  ) : (
                    'Book Now'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Map and Results */}
          <div className="space-y-4">
            {/* Map */}
            <div className={`${isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-100'} rounded-xl shadow-lg p-0 overflow-hidden border transition-colors duration-200`}>
              <div className="h-96 w-full" ref={mapRef}>
                {!isMapLoaded && (
                  <div className={`h-full flex items-center justify-center transition-colors duration-200 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
                    <div className="text-center">
                      {isLoadingMap ? (
                        <>
                          <div className="relative">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 mx-auto"></div>
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto absolute top-0 left-1/2 transform -translate-x-1/2"></div>
                          </div>
                          <p className={`transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading Google Maps...</p>
                          <p className={`text-sm mt-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Optimized for faster loading</p>
                        </>
                      ) : (
                        <>
                          <div className="animate-pulse rounded-full h-12 w-12 bg-gray-400 mx-auto mb-4"></div>
                          <p className={`transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Initializing map...</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Results Card */}
            <ResultsCard
              distance={distance}
              calculatedFare={calculatedFare}
              travelTime={travelTime}
              pickupAddress={pickupAddress}
              dropoffAddress={dropoffAddress}
              secondDropoffAddress={secondDropoffAddress}
              numberOfPassengers={numberOfPassengers}
              isReturnTrip={isReturnTrip}
              settings={settings}
              isDarkMode={isDarkMode}
              clearResults={clearResults}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
