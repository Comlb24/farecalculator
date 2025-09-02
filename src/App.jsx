import { useState, useEffect, useRef } from 'react'

function App() {
  console.log('App component is mounting...')
  
  const [pickupAddress, setPickupAddress] = useState('')
  const [dropoffAddress, setDropoffAddress] = useState('')
  const [distance, setDistance] = useState(null)
  const [fare, setFare] = useState(null)
  const [apiKey] = useState('AIzaSyB8eSEwobyB-7ZkgKBUKLl5Hvico0CFjso')
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  
  // Settings state
  const [settings, setSettings] = useState({
    perKmRate: 2.25,
    baseFare: 3.00,
    minFare: 10.00,
    currency: 'CAD'
  })
  
  // Refs for Google Maps
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const directionsRendererRef = useRef(null)
  const autocompleteRefs = useRef({})

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

  // Load Google Maps API with Routes API
  useEffect(() => {
    // Only load once
    if (window.google && window.google.maps) {
      setIsMapLoaded(true)
      return
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      return
    }

    const loadGoogleMaps = async () => {
      try {
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,routes&callback=initMap`
        script.async = true
        script.defer = true
        
        window.initMap = () => {
          console.log('Google Maps with Routes API loaded successfully')
          setIsMapLoaded(true)
        }
        
        document.head.appendChild(script)
      } catch (error) {
        console.error('Error loading Google Maps:', error)
      }
    }

    loadGoogleMaps()
  }, [apiKey])

  const initializeMap = () => {
    if (!window.google || !window.google.maps) return
    if (!mapRef.current) return

    try {
      console.log('Initializing map with Routes API...')
      
      // Initialize map
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 43.6532, lng: -79.3832 }, // Toronto coordinates
        zoom: 10,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      })

      mapInstanceRef.current = map

      // Initialize Places API for autocomplete using the working Autocomplete API
      if (window.google.maps.places) {
        console.log('Places API available, initializing autocomplete...')
        
        // Initialize autocomplete for pickup
        const pickupInput = document.getElementById('pickup-address')
        console.log('Pickup input element found:', pickupInput)
        if (pickupInput) {
          try {
            // Use the working Autocomplete API (with deprecation warning)
            const pickupAutocomplete = new window.google.maps.places.Autocomplete(pickupInput, {
              types: ['establishment'],
              componentRestrictions: { country: 'ca' },
              fields: ['formatted_address', 'geometry', 'name', 'place_id']
            })
            
            // Listen for place changes
            pickupAutocomplete.addListener('place_changed', () => {
              console.log('Pickup place_changed event fired')
              const place = pickupAutocomplete.getPlace()
              console.log('Pickup place object:', place)
              if (place && place.formatted_address) {
                // Use the place name if available, otherwise use the formatted address
                const displayName = place.name || place.formatted_address
                setPickupAddress(displayName)
                console.log('Pickup place selected:', displayName)
              }
            })
            
            autocompleteRefs.current.pickup = pickupAutocomplete
            console.log('Pickup autocomplete initialized successfully')
          } catch (error) {
            console.error('Could not initialize pickup autocomplete:', error)
          }
        } else {
          console.error('Pickup input element not found!')
        }

        // Initialize autocomplete for dropoff
        const dropoffInput = document.getElementById('dropoff-address')
        console.log('Dropoff input element found:', dropoffInput)
        if (dropoffInput) {
          try {
            // Use the working Autocomplete API (with deprecation warning)
            const dropoffAutocomplete = new window.google.maps.places.Autocomplete(dropoffInput, {
              types: ['establishment'],
              componentRestrictions: { country: 'ca' },
              fields: ['formatted_address', 'geometry', 'name', 'place_id']
            })
            
            // Listen for place changes
            dropoffAutocomplete.addListener('place_changed', () => {
              console.log('Dropoff place_changed event fired')
              const place = dropoffAutocomplete.getPlace()
              console.log('Dropoff place object:', place)
              if (place && place.formatted_address) {
                // Use the place name if available, otherwise use the formatted address
                const displayName = place.name || place.formatted_address
                setDropoffAddress(displayName)
                console.log('Dropoff place selected:', displayName)
              }
            })
            
            autocompleteRefs.current.dropoff = dropoffAutocomplete
            console.log('Dropoff autocomplete initialized successfully')
          } catch (error) {
            console.error('Could not initialize dropoff autocomplete:', error)
          }
        } else {
          console.error('Dropoff input element not found!')
        }
      } else {
        console.log('Places API not available')
      }

      // Initialize Routes API services
      if (window.google.maps.routes) {
        console.log('Routes API available')
      } else {
        console.log('Routes API not available, using fallback')
      }

      console.log('Map initialized successfully')
    } catch (error) {
      console.error('Error initializing map:', error)
    }
  }

  // Initialize map when component mounts and map is loaded
  useEffect(() => {
    if (isMapLoaded && mapRef.current) {
      // Add a delay to ensure DOM is ready
      const timer = setTimeout(() => {
        initializeMap()
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [isMapLoaded])

  // Initialize autocomplete separately to ensure it works
  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      console.log('Initializing autocomplete separately...')
      
      // Initialize autocomplete for pickup
      const pickupInput = document.getElementById('pickup-address')
      console.log('Separate pickup input element found:', pickupInput)
      if (pickupInput && !autocompleteRefs.current.pickup) {
        try {
          const pickupAutocomplete = new window.google.maps.places.Autocomplete(pickupInput, {
            types: ['establishment'],
            componentRestrictions: { country: 'ca' },
            fields: ['formatted_address', 'geometry', 'name', 'place_id']
          })
          
          pickupAutocomplete.addListener('place_changed', () => {
            console.log('Separate pickup place_changed event fired')
            const place = pickupAutocomplete.getPlace()
            console.log('Separate pickup place object:', place)
            if (place && place.formatted_address) {
              const displayName = place.name || place.formatted_address
              setPickupAddress(displayName)
              console.log('Separate pickup place selected:', displayName)
            }
          })
          
          autocompleteRefs.current.pickup = pickupAutocomplete
          console.log('Separate pickup autocomplete initialized successfully')
        } catch (error) {
          console.error('Could not initialize separate pickup autocomplete:', error)
        }
      }

      // Initialize autocomplete for dropoff
      const dropoffInput = document.getElementById('dropoff-address')
      console.log('Separate dropoff input element found:', dropoffInput)
      if (dropoffInput && !autocompleteRefs.current.dropoff) {
        try {
          const dropoffAutocomplete = new window.google.maps.places.Autocomplete(dropoffInput, {
            types: ['establishment'],
            componentRestrictions: { country: 'ca' },
            fields: ['formatted_address', 'geometry', 'name', 'place_id']
          })
          
          dropoffAutocomplete.addListener('place_changed', () => {
            console.log('Separate dropoff place_changed event fired')
            const place = dropoffAutocomplete.getPlace()
            console.log('Separate dropoff place object:', place)
            if (place && place.formatted_address) {
              const displayName = place.name || place.formatted_address
              setDropoffAddress(displayName)
              console.log('Separate dropoff place selected:', displayName)
            }
          })
          
          autocompleteRefs.current.dropoff = dropoffAutocomplete
          console.log('Separate dropoff autocomplete initialized successfully')
        } catch (error) {
          console.error('Could not initialize separate dropoff autocomplete:', error)
        }
      }
    }
  }, [isMapLoaded])

  const calculateRoute = async () => {
    if (!pickupAddress || !dropoffAddress) {
      alert('Please enter both pickup and dropoff addresses')
      return
    }

    if (!window.google || !window.google.maps) {
      alert('Google Maps is not ready yet. Please wait a moment and try again.')
      return
    }

    setIsCalculating(true)

    try {
      console.log('Calculating route using Google Maps API...')
      
      // Use the Directions Service to get real distance
      if (window.google.maps.DirectionsService) {
        const directionsService = new window.google.maps.DirectionsService()
        
        const request = {
          origin: pickupAddress,
          destination: dropoffAddress,
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.METRIC
        }

        directionsService.route(request, (result, status) => {
          if (status === 'OK' && result.routes[0]) {
            const route = result.routes[0]
            const leg = route.legs[0]
            
            // Get distance in kilometers
            const distanceKm = leg.distance.value / 1000 // Convert meters to kilometers
            setDistance(distanceKm)
            
            // Calculate fare
            const calculatedFare = Math.max(
              settings.minFare,
              settings.baseFare + (settings.perKmRate * distanceKm)
            )
            setFare(calculatedFare)
            
            console.log(`Route calculated successfully! Distance: ${distanceKm.toFixed(2)} km, Fare: ${settings.currency} ${calculatedFare.toFixed(2)}`)
            
            // Display route on map
            if (mapInstanceRef.current) {
              // Clear any existing directions first
              if (directionsRendererRef.current) {
                directionsRendererRef.current.setMap(null)
              }
              
              // Create new directions renderer
              const directionsRenderer = new window.google.maps.DirectionsRenderer()
              directionsRenderer.setMap(mapInstanceRef.current)
              directionsRenderer.setDirections(result)
              
              // Store reference for later clearing
              directionsRendererRef.current = directionsRenderer
            }
          } else {
            console.error('Directions request failed:', status)
            alert('Could not calculate route. Please check your addresses and try again.')
          }
        })
      } else {
        // Fallback to basic calculation if Directions Service not available
        console.warn('Directions Service not available, using fallback calculation')
        const distanceKm = 5.0 // Placeholder distance
        setDistance(distanceKm)
        
        const calculatedFare = Math.max(
          settings.minFare,
          settings.baseFare + (settings.perKmRate * distanceKm)
        )
        setFare(calculatedFare)
        
        alert(`Basic calculation: Distance: ${distanceKm.toFixed(2)} km, Fare: ${settings.currency} ${calculatedFare.toFixed(2)}`)
      }

    } catch (error) {
      console.error('Error calculating route:', error)
      alert('Error calculating route. Please check your addresses and try again.')
    } finally {
      setIsCalculating(false)
    }
  }

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: parseFloat(value) || value
    }))
  }

  const clearResults = () => {
    console.log('clearResults function called')
    console.log('Before clearing - Distance:', distance, 'Fare:', fare)
    console.log('Before clearing - Pickup:', pickupAddress, 'Dropoff:', dropoffAddress)
    
    // Clear the state
    setDistance(null)
    setFare(null)
    setPickupAddress('')
    setDropoffAddress('')
    
    // Clear the map if it exists
    if (directionsRendererRef.current) {
      try {
        // Clear the existing directions renderer
        directionsRendererRef.current.setMap(null)
        directionsRendererRef.current = null
        console.log('Map directions cleared')
      } catch (error) {
        console.warn('Could not clear map directions:', error)
      }
    }
    
    console.log('After clearing - Distance:', distance, 'Fare:', fare)
    console.log('After clearing - Pickup:', pickupAddress, 'Dropoff:', dropoffAddress)
    console.log('Results cleared successfully')
  }

  console.log('App component is rendering...')
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            🚕 Taxi Fare Calculator
          </h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Inputs and Settings */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Address Inputs */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Route Details</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="pickup-address" className="block text-sm font-medium text-gray-700 mb-2">
                    Pickup Address
                  </label>
                  <div className="relative">
                    <input
                      id="pickup-address"
                      type="text"
                      placeholder="Start typing for place or address suggestions..."
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Type to see place or address suggestions</p>
                </div>
                <div>
                  <label htmlFor="dropoff-address" className="block text-sm font-medium text-gray-700 mb-2">
                    Drop-off Address
                  </label>
                  <div className="relative">
                    <input
                      id="dropoff-address"
                      type="text"
                      placeholder="Start typing for place or address suggestions..."
                      value={dropoffAddress}
                      onChange={(e) => setDropoffAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Type to see place or address suggestions</p>
                </div>

                
                <button
                  onClick={calculateRoute}
                  disabled={!pickupAddress || !dropoffAddress || isCalculating}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCalculating ? 'Calculating...' : 'Calculate Route & Fare'}
                </button>
                {(distance || fare) && (
                  <button
                    onClick={clearResults}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg"
                  >
                    Clear Results
                  </button>
                )}
              </div>
            </div>

            {/* Settings Panel */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Fare Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Per Kilometer Rate ({settings.currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.perKmRate}
                    onChange={(e) => updateSetting('perKmRate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Fare ({settings.currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.baseFare}
                    onChange={(e) => updateSetting('baseFare', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Fare ({settings.currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.minFare}
                    onChange={(e) => updateSetting('minFare', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={settings.currency}
                    onChange={(e) => updateSetting('currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="CAD">CAD</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Map and Results */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Map */}
            <div className="bg-white rounded-xl shadow-lg p-0 overflow-hidden border border-gray-100">
              <div className="h-96 w-full" ref={mapRef}>
                {!isMapLoaded && (
                  <div className="h-full flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading map...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Results Card */}
            {(distance || fare) && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Fare Estimate</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Pickup</p>
                    <p className="font-medium text-gray-900">{pickupAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Drop-off</p>
                    <p className="font-medium text-gray-900">{dropoffAddress}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Distance</p>
                    <p className="font-medium text-gray-900">{distance?.toFixed(2)} km</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estimated Fare</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {settings.currency} {fare?.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Estimates may vary due to traffic, tolls, or route changes.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
