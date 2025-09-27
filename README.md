# 🚕 Taxi Fare Calculator

A modern, responsive web application for estimating taxi fares using Google Maps APIs. Built with React, Vite, and Tailwind CSS.

## ✨ Features

- **Address Input with Autocomplete**: Pickup and drop-off address fields with Google Places Autocomplete
- **Interactive Google Map**: Embedded map showing the calculated route
- **Real-time Route Calculation**: Uses Google Directions API to calculate driving distance
- **Customizable Fare Settings**: Adjustable per-kilometer rate, base fare, and minimum fare
- **Multiple Currency Support**: CAD, USD, EUR, GBP
- **Responsive Design**: Mobile-first UI built with Tailwind CSS
- **Local Storage**: Saves API key and settings locally
- **Production Ready**: Optimized for deployment to Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- Google Maps API key with the following APIs enabled:
  - Maps JavaScript API
  - Places API
  - Directions API

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd farecalculator
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Setting up Google Maps API

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Directions API
4. Create credentials (API Key)
5. Copy the API key and paste it into the app's API key field

## 🏗️ Project Structure

```
src/
├── App.jsx          # Main application component
├── main.jsx         # Application entry point
└── index.css        # Tailwind CSS and custom styles

tailwind.config.js   # Tailwind CSS configuration
postcss.config.js    # PostCSS configuration
package.json         # Dependencies and scripts
```

## 💰 Fare Calculation Formula

The fare is calculated using the following formula:

```
fare = max(minFare, baseFare + (perKmRate × distanceKm))
```

**Default Values:**
- Per Kilometer Rate: $2.25 CAD
- Base Fare: $3.00 CAD
- Minimum Fare: $10.00 CAD
- Currency: CAD

## 🎨 Customization

### Styling
The app uses Tailwind CSS for styling. Custom styles are defined in `src/index.css` using Tailwind's `@layer` directive.

### Fare Settings
All fare settings can be adjusted through the settings panel in the app. Changes are automatically saved to local storage.

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy with the following build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Other Platforms

The app can be deployed to any static hosting platform:

1. Build the project: `npm run build`
2. Upload the `dist` folder to your hosting provider

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📱 Mobile Support

The app is fully responsive and optimized for mobile devices with a mobile-first design approach.

## 🔒 Security Notes

- API keys are stored in local storage (client-side only)
- No server-side processing or data storage
- All calculations happen in the browser

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you encounter any issues or have questions:

1. Check the browser console for error messages
2. Verify your Google Maps API key is correct and has the required APIs enabled
3. Ensure you have a stable internet connection
4. Check that all required APIs are enabled in your Google Cloud Console

## 🔄 Updates

The app automatically saves your settings and API key to local storage. To update the API key, simply paste the new key and click "Update API Key" - the app will reload with the new configuration.
# Force redeploy Sat Sep 27 18:23:11 ADT 2025
