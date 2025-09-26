# Environment Variables Setup Guide

## Required Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

### Database Configuration
```bash
MONGODB_URI=mongodb://localhost:27017/financeapp
NODE_ENV=development
PORT=5000
```

### JWT Secrets (Change these in production!)
```bash
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

### Email Configuration (SMTP)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@financeapp.com
```

### OpenAI Configuration
```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Cloudinary Configuration (for avatar uploads)
```bash
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_UPLOAD_PRESET=profile_images
```

### Frontend Configuration
```bash
FRONTEND_URL=http://localhost:8081
```

## How to Get These Values:

### 1. OpenAI API Key
- Go to https://platform.openai.com/api-keys
- Create a new API key
- Copy the key (starts with `sk-`)

### 2. Gmail SMTP Setup
- Enable 2-factor authentication on your Gmail account
- Generate an "App Password" for this application
- Use your Gmail address and the app password

### 3. Cloudinary Setup
- Sign up at https://cloudinary.com
- Go to Dashboard to get your cloud name, API key, and API secret
- Create an upload preset named "profile_images" with unsigned uploads

### 4. MongoDB
- Install MongoDB locally or use MongoDB Atlas
- Update the connection string accordingly

## Frontend Environment Variables

Create a `.env.local` file in the project root:

```bash
EXPO_PUBLIC_API_URL=https://financeapp-77na.onrender.com/api
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=profile_images
```

## Testing the Setup

After setting up the environment variables:

1. Start the backend server: `cd backend && npm start`
2. Start the frontend: `npm start`
3. Test the registration flow
4. Check if OTP emails are being sent
5. Verify AI insights are working

## Troubleshooting

- Make sure all environment variables are set correctly
- Check that MongoDB is running
- Verify SMTP credentials are correct
- Ensure OpenAI API key has sufficient credits
- Check Cloudinary upload preset is configured properly
