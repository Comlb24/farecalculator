import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from './ThemeContext.jsx'
import emailjs from '@emailjs/browser'

function App() {
  console.log('App component is mounting...')
  
  const { isDarkMode, toggleTheme } = useTheme()
  const [pickupAddress, setPickupAddress] = useState('')
  const [dropoffAddress, setDropoffAddress] = useState('')
  const [secondDropoffAddress, setSecondDropoffAddress] = useState('')
  const [showSecondDropoff, setShowSecondDropoff] = useState(false)
  const [distance, setDistance] = useState(null)
  const [travelTime, setTravelTime] = useState(null)
  const [fare, setFare] = useState(null)
  const [apiKey] = useState('AIzaSyB8eSEwobyB-7ZkgKBUKLl5Hvico0CFjso')
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  
  // Customer information state
  const [customerName, setCustomerName] = useState('')
  const [pickupDate, setPickupDate] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [emailAddress, setEmailAddress] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  
  // EmailJS configuration
  const [emailConfig] = useState({
    serviceId: 'service_nrynudw', // You'll need to replace this with your EmailJS service ID
    templateId: 'template_lqiv82a', // You'll need to replace this with your EmailJS template ID
    publicKey: 'a6vgoEqiDO14QO4OJ' // You'll need to replace this with your EmailJS public key
  })
  
  // Settings state
  const [settings, setSettings] = useState({
    perKmRate: 1.65,
    baseFare: 3.00,
    minFare: 25.00,
    currency: 'CAD'
  })
  
  // Refs for Google Maps
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const directionsRendererRef = useRef(null)
  const customMarkersRef = useRef([])
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
        center: { lat: 46.0878, lng: -64.7782 }, // Moncton, New Brunswick coordinates
        zoom: 12,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      })

      mapInstanceRef.current = map

      // Initialize Google Places Autocomplete for pickup address
      try {
        const pickupInput = document.getElementById('pickup-address')
        if (pickupInput) {
          const pickupAutocomplete = new window.google.maps.places.Autocomplete(pickupInput, {
            types: ['establishment'],
            fields: ['formatted_address', 'geometry', 'name', 'place_id']
          })

          pickupAutocomplete.addListener('place_changed', () => {
            const place = pickupAutocomplete.getPlace()
            if (place && place.formatted_address) {
              const displayName = place.name || place.formatted_address
              setPickupAddress(displayName)
              console.log('Pickup place selected:', displayName)
              
              // Auto-calculate route if dropoff addresses are already filled
              setTimeout(() => {
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
            types: ['establishment'],
            fields: ['formatted_address', 'geometry', 'name', 'place_id']
          })

          dropoffAutocomplete.addListener('place_changed', () => {
            console.log('Dropoff place_changed event fired')
            const place = dropoffAutocomplete.getPlace()
            console.log('Dropoff place object:', place)
            if (place && place.formatted_address) {
              const displayName = place.name || place.formatted_address
              setDropoffAddress(displayName)
              console.log('Dropoff place selected:', displayName)
              
              // Auto-calculate if both addresses are filled
              // Use a longer delay and check the actual input values
              setTimeout(() => {
                const pickupInput = document.getElementById('pickup-address')
                const pickupValue = pickupInput ? pickupInput.value : ''
                console.log('Checking pickup value for auto-calculation:', pickupValue)
                
                if (pickupValue.trim()) {
                  console.log('Auto-calculating route...')
                  // Use the current place data for calculation instead of waiting for state
                  const currentPickup = pickupValue.trim()
                  const currentDropoff = displayName
                  console.log('Using addresses for auto-calculation:', { currentPickup, currentDropoff })
                  
                  // Check if there's a second dropoff and use appropriate calculation method
                  if (secondDropoffAddress) {
                    updateMapWithMultipleDropoffs()
                  } else {
                    calculateRouteWithAddresses(currentPickup, currentDropoff)
                  }
                } else {
                  console.log('No pickup address found, skipping auto-calculation')
                }
              }, 300) // Increased delay to ensure state is updated
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
      const secondDropoffInput = document.getElementById('second-dropoff-address')
      if (secondDropoffInput && !autocompleteRefs.current.secondDropoff) {
        const secondDropoffAutocomplete = new window.google.maps.places.Autocomplete(secondDropoffInput, {
          types: ['establishment'],
          fields: ['formatted_address', 'geometry', 'name', 'place_id']
        })

        secondDropoffAutocomplete.addListener('place_changed', () => {
          console.log('Second dropoff place_changed event fired')
          const place = secondDropoffAutocomplete.getPlace()
          console.log('Second dropoff place object:', place)
          
          // Only proceed if we have a valid place with geometry (actual selection, not just typing)
          if (place && place.formatted_address && place.geometry && place.geometry.location) {
            const displayName = place.name || place.formatted_address
            console.log('Valid second dropoff place selected:', displayName)
            console.log('Setting secondDropoffAddress to:', displayName)
            setSecondDropoffAddress(displayName)
            console.log('Current state values:', { pickupAddress, dropoffAddress, secondDropoffAddress: displayName })
            
            // Update map to show both dropoff locations with a delay to ensure state is updated
            setTimeout(() => {
              console.log('Calling updateMapWithMultipleDropoffs from second dropoff listener')
              console.log('State values at timeout:', { pickupAddress, dropoffAddress, secondDropoffAddress: displayName })
              updateMapWithMultipleDropoffs(displayName)
            }, 500)
          } else {
            console.warn('Second dropoff place selection failed - invalid place object or no geometry')
            console.log('Place object details:', { 
              hasFormattedAddress: !!(place && place.formatted_address),
              hasGeometry: !!(place && place.geometry),
              hasLocation: !!(place && place.geometry && place.geometry.location)
            })
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
    if (!window.google || !window.google.maps || !mapInstanceRef.current) return
    
    // Use provided address or fall back to state
    const currentSecondDropoff = providedSecondDropoff || secondDropoffAddress
    
    if (!pickupAddress || !dropoffAddress || !currentSecondDropoff) {
      console.log('Missing addresses for multi-dropoff:', { pickupAddress, dropoffAddress, secondDropoffAddress: currentSecondDropoff })
      return
    }

    console.log('Updating map with multiple dropoffs:', { pickupAddress, dropoffAddress, secondDropoffAddress: currentSecondDropoff })
    console.log('Current state values in updateMapWithMultipleDropoffs:', { 
      pickupAddress, 
      dropoffAddress, 
      secondDropoffAddress: currentSecondDropoff,
      showSecondDropoff 
    })

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
        setFare(calculatedFare)
        
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
        await addCustomMarkers(currentSecondDropoff)
        
        console.log('Multi-dropoff route calculated successfully:', { distanceKm, timeMinutes, calculatedFare })
      }
    } catch (error) {
      console.error('Error calculating multi-dropoff route:', error)
      // Fallback to single route if multi-dropoff fails
      if (pickupAddress && dropoffAddress) {
        calculateRouteWithAddresses(pickupAddress, dropoffAddress)
      }
    }
  }

  const addCustomMarkers = async (providedSecondDropoff = null) => {
    if (!window.google || !window.google.maps || !mapInstanceRef.current) return

    // Clear existing custom markers
    clearCustomMarkers()

    const markers = []
    const geocoder = new window.google.maps.Geocoder()

    // Use provided address or fall back to state
    const currentSecondDropoff = providedSecondDropoff || secondDropoffAddress

    console.log('Adding custom markers for addresses:', { pickupAddress, dropoffAddress, secondDropoffAddress: currentSecondDropoff })

    // Helper function to create a marker
    const createMarker = (position, title, iconUrl, labelText, color) => {
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
    }

    // Helper function to geocode an address
    const geocodeAddress = (address, markerInfo) => {
      return new Promise((resolve, reject) => {
        console.log(`Geocoding address: ${address}`)
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
    }

    try {
      // Geocode all addresses in parallel
      const geocodePromises = []

      // Add pickup marker
      if (pickupAddress) {
        geocodePromises.push(
          geocodeAddress(pickupAddress, {
            title: 'Pickup',
            iconUrl: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
            labelText: 'P',
            color: 'white'
          })
        )
      }

      // Add first dropoff marker
      if (dropoffAddress) {
        geocodePromises.push(
          geocodeAddress(dropoffAddress, {
            title: 'First Drop-off',
            iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
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
            iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
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

  const clearCustomMarkers = () => {
    if (customMarkersRef.current) {
      customMarkersRef.current.forEach(marker => {
        marker.setMap(null)
      })
      customMarkersRef.current = []
    }
  }

  // Initialize map when Google Maps API is loaded
  useEffect(() => {
    if (isMapLoaded && mapRef.current) {
      // Add a small delay to ensure DOM elements are ready
      setTimeout(() => {
        initializeMap()
      }, 500)
    }
  }, [isMapLoaded])

  // Initialize second dropoff autocomplete when the field becomes visible
  useEffect(() => {
    if (showSecondDropoff && isMapLoaded) {
      // Add a small delay to ensure the DOM element is rendered
      setTimeout(() => {
        initializeSecondDropoffAutocomplete()
      }, 100)
    }
  }, [showSecondDropoff, isMapLoaded])

  // Note: Map updates for second dropoff are now handled only by autocomplete place_changed events
  // This ensures the map only updates when a valid address is selected, not while typing

  const calculateRouteWithAddresses = async (pickup, dropoff) => {
    if (!pickup || !dropoff) {
      console.log('Missing addresses for calculation:', { pickup, dropoff })
      return
    }

    if (!window.google || !window.google.maps) {
      alert('Google Maps is not loaded yet. Please wait a moment and try again.')
      return
    }

    setIsCalculating(true)
    setDistance(null)
    setTravelTime(null)
    setFare(null)

    try {
      const directionsService = new window.google.maps.DirectionsService()
      
      const result = await directionsService.route({
        origin: pickup,
        destination: dropoff,
        travelMode: window.google.maps.TravelMode.DRIVING
      })

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
        setFare(calculatedFare)
        
        // Display route on map with custom markers
        if (directionsRendererRef.current) {
          directionsRendererRef.current.setMap(null)
        }
        clearCustomMarkers()
        
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
        await addCustomMarkers()
        
        console.log('Route calculated successfully:', { distanceKm, timeMinutes, calculatedFare })
      }
    } catch (error) {
      console.error('Error calculating route:', error)
      alert('Error calculating route. Please check your addresses and try again.')
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
      alert('Please enter both pickup and dropoff addresses')
      return
    }

    if (!customerName || !emailAddress || !phoneNumber) {
      alert('Please fill in all required customer information (Name, Email, Phone)')
      return
    }

    setIsCalculating(true)

    try {
      // Prepare email template parameters
      const templateParams = {
        customer_name: customerName,
        pickup_address: pickupAddress,
        dropoff_address: dropoffAddress,
        second_dropoff_address: secondDropoffAddress || 'Not specified',
        pickup_date: pickupDate,
        pickup_time: pickupTime,
        email_address: emailAddress,
        phone_number: phoneNumber,
        distance: distance ? `${distance.toFixed(2)} km` : 'Not calculated',
        travel_time: travelTime ? `${travelTime} minutes` : 'Not calculated',
        estimated_fare: fare ? `${settings.currency} ${fare.toFixed(2)}` : 'Not calculated',
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
      alert('Booking submitted successfully! We will contact you shortly.')
      
      // Clear the form after successful booking
      clearResults()
      setCustomerName('')
      setPickupDate('')
      setPickupTime('')
      setEmailAddress('')
      setPhoneNumber('')

    } catch (error) {
      console.error('Error sending email:', error)
      alert('Failed to submit booking. Please try again or contact us directly.')
    } finally {
      setIsCalculating(false)
    }
  }

  const handleBookNow = async () => {
    // First calculate the route and fare
    await calculateRoute()
    
    // Then send the booking email
    await sendBookingEmail()
  }

  const clearResults = () => {
    console.log('Clearing results...')
    setDistance(null)
    setTravelTime(null)
    setFare(null)
    setPickupAddress('')
    setDropoffAddress('')
    setSecondDropoffAddress('')
    setShowSecondDropoff(false)
    
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

  console.log('App component is rendering...')

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
              {/* Contact Us Button */}
              <button
                onClick={() => window.open('mailto:info@monctontaxi.com', '_blank')}
                className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 bg-white hover:bg-gray-100 text-black border border-gray-300"
                title="Contact Us"
              >
                Contact us
              </button>
              
              {/* Services Button */}
              <button
                onClick={() => {
                  // You can add navigation to a services page or show a modal
                  alert('Services: Airport transfers, City tours, Corporate transportation, Special events, Hourly rates available')
                }}
                className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 bg-white hover:bg-gray-100 text-black border border-gray-300"
                title="Our Services"
              >
                Services
              </button>
              
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Inputs Only */}
          <div className="space-y-6">
            
            {/* Address Inputs */}
            <div className={`${isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-100'} rounded-xl shadow-lg p-6 border transition-colors duration-200`}>
              <h2 className={`text-xl font-semibold mb-4 transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Route Details</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="pickup-address" className={`block text-sm font-medium mb-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Pickup Address
                  </label>
                  <div className="relative">
                    <input
                      id="pickup-address"
                      type="text"
                      placeholder=""
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
                  <label htmlFor="dropoff-address" className={`block text-sm font-medium mb-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Drop-off Address
                  </label>
                  <div className="relative">
                    <input
                      id="dropoff-address"
                      type="text"
                      placeholder=""
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
                  </div>
                  
                  {/* Plus Button for Second Dropoff */}
                  {!showSecondDropoff && (
                    <button
                      type="button"
                      onClick={() => setShowSecondDropoff(true)}
                      className={`mt-2 flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                        isDarkMode 
                          ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-600' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 border border-gray-300'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Add Second Drop-off</span>
                    </button>
                  )}
                </div>

                {/* Second Dropoff Address Field */}
                {showSecondDropoff && (
                  <div>
                    <label htmlFor="second-dropoff-address" className={`block text-sm font-medium mb-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Second Drop-off Address
                    </label>
                    <div className="relative">
                      <input
                        id="second-dropoff-address"
                        type="text"
                        placeholder=""
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
                    
                    {/* Remove Second Dropoff Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowSecondDropoff(false)
                        setSecondDropoffAddress('')
                        // Clear autocomplete reference
                        if (autocompleteRefs.current.secondDropoff) {
                          autocompleteRefs.current.secondDropoff = null
                        }
                      }}
                      className={`mt-2 flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                        isDarkMode 
                          ? 'bg-red-900/20 hover:bg-red-900/30 text-red-400 hover:text-red-300 border border-red-700/50' 
                          : 'bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Remove Second Drop-off</span>
                    </button>
                  </div>
                )}

                {/* Additional Customer Information */}
                <div>
                  <label htmlFor="customer-name" className={`block text-sm font-medium mb-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Name
                  </label>
                  <input
                    id="customer-name"
                    type="text"
                    placeholder=""
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' 
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="pickup-date" className={`block text-sm font-medium mb-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Date
                  </label>
                  <input
                    id="pickup-date"
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-900 border-gray-700 text-white' 
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="pickup-time" className={`block text-sm font-medium mb-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Pickup Time
                  </label>
                  <input
                    id="pickup-time"
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-900 border-gray-700 text-white' 
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="email-address" className={`block text-sm font-medium mb-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Email Address
                  </label>
                  <input
                    id="email-address"
                    type="email"
                    placeholder=""
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' 
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>

      <div>
                  <label htmlFor="phone-number" className={`block text-sm font-medium mb-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Phone Number
                  </label>
                  <input
                    id="phone-number"
                    type="tel"
                    placeholder=""
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
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
                    disabled={!pickupAddress || !dropoffAddress || !secondDropoffAddress || isCalculating}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {isCalculating ? 'Calculating...' : 'Calculate Multi-Stop Route'}
                  </button>
                </div>
              )}

              {/* Calculate Button */}
              <div className="mt-6">
                <button
                  onClick={handleBookNow}
                  disabled={!pickupAddress || !dropoffAddress || isCalculating}
                  className="w-full bg-black hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isCalculating ? 'Processing...' : 'Book Now'}
        </button>
              </div>
            </div>
          </div>

          {/* Right Column - Map and Results */}
          <div className="space-y-6">
            {/* Map */}
            <div className={`${isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-100'} rounded-xl shadow-lg p-0 overflow-hidden border transition-colors duration-200`}>
              <div className="h-96 w-full" ref={mapRef}>
                {!isMapLoaded && (
                  <div className={`h-full flex items-center justify-center transition-colors duration-200 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className={`transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading map...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Results Card */}
            {(distance || fare) && (
              <div className={`${isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-100'} rounded-xl shadow-lg p-6 border transition-colors duration-200`}>
                <h2 className={`text-xl font-semibold mb-4 transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Fare Estimate</h2>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className={`text-sm transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Distance</p>
                    <p className={`font-medium transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{distance?.toFixed(2)} km</p>
                  </div>
                  <div>
                    <p className={`text-sm transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Travel Time</p>
                    <p className={`font-medium transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{travelTime} min</p>
                  </div>
                  <div>
                    <p className={`text-sm transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Estimated Fare</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {settings.currency} {fare?.toFixed(2)}
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
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
