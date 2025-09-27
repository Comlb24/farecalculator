// Application configuration
export const CONFIG = {
  // Super admin emails that bypass approval process
  SUPER_ADMIN_EMAILS: [
    'admin@farecalculator.com',
    'info@monctontaxi.com', // Your actual email
    // Add more super admin emails as needed
  ],
  
  // Admin panel access emails (can be same as super admin or different)
  ADMIN_PANEL_EMAILS: [
    'admin@farecalculator.com',
    'info@monctontaxi.com', // Your actual email
    // Add more admin emails as needed
  ],
  
  // Default fare settings
  DEFAULT_FARE_SETTINGS: {
    perKmRate: 1.65,
    baseFare: 3.00,
    minFare: 25.00,
    currency: 'CAD'
  }
}

// Helper functions
export const isSuperAdmin = (email) => {
  return CONFIG.SUPER_ADMIN_EMAILS.includes(email)
}

export const canAccessAdminPanel = (email) => {
  return CONFIG.ADMIN_PANEL_EMAILS.includes(email)
}
