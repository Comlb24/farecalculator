# EmailJS Setup Instructions

## Step 1: Create EmailJS Account
1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

## Step 2: Create Email Service
1. In your EmailJS dashboard, go to "Email Services"
2. Click "Add New Service"
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the setup instructions for your provider
5. Note down your **Service ID** (e.g., `service_xxxxxxx`)

## Step 3: Create Email Template
1. Go to "Email Templates" in your dashboard
2. Click "Create New Template"
3. Use this template content:

### Email Template Content:
```
Subject: New Taxi Booking Received

Hello,

You have received a new taxi booking request:

Customer Information:
- Name: {{customer_name}}
- Email: {{email_address}}
- Phone: {{phone_number}}
- Message: {{message}}

Booking Details:
- Pickup Address: {{pickup_address}}
- Drop-off Address: {{dropoff_address}}
- Second Drop-off Address: {{second_dropoff_address}}
- Pickup Date: {{pickup_date}}
- Pickup Time: {{pickup_time}}

Route Information:
- Distance: {{distance}}
- Travel Time: {{travel_time}}
- Estimated Fare: {{estimated_fare}}

Booking submitted on: {{booking_date}}

Please contact the customer to confirm the booking.

Best regards,
Taxi Booking System
```

4. Save the template and note down your **Template ID** (e.g., `template_xxxxxxx`)

## Step 4: Get Public Key
1. Go to "Account" in your EmailJS dashboard
2. Find your **Public Key** (e.g., `your_public_key_here`)

## Step 5: Update App Configuration
1. Open `src/App.jsx`
2. Find the `emailConfig` object around line 27
3. Replace the placeholder values:
   ```javascript
   const [emailConfig] = useState({
     serviceId: 'your_service_id_here', // Replace with your Service ID
     templateId: 'your_template_id_here', // Replace with your Template ID
     publicKey: 'your_public_key_here' // Replace with your Public Key
   })
   ```

## Step 6: Update Email Recipient
1. In the `sendBookingEmail` function around line 310
2. Replace `'your-email@example.com'` with the email address where you want to receive bookings

## Step 7: Test the Booking System
1. Fill out the form with test data
2. Click "Book Now"
3. Check your email for the booking notification

## Important Notes:
- EmailJS free tier allows 200 emails per month
- Make sure to test with your actual email address
- The email will be sent to the address specified in the `to_email` parameter
- All form data will be included in the email automatically
