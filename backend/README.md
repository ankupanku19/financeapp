# Finance Tracker Backend

A production-ready Node.js backend API for the Finance Tracker application built with Express.js and MongoDB.

## Features

- **Authentication & Authorization**: JWT-based auth with refresh tokens
- **User Management**: User profiles, preferences, and subscription management
- **Income Tracking**: Track income from multiple sources with categorization
- **Savings Management**: Track savings with goal integration
- **Goal Setting**: Set and track financial goals with milestones
- **Categories**: Customizable income categories
- **Analytics**: Comprehensive financial analytics and reporting
- **AI Insights**: Smart insights and recommendations (mock implementation)
- **Security**: Helmet, rate limiting, input validation, and secure headers
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Logging**: Structured logging for debugging and monitoring

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **helmet** - Security headers
- **cors** - Cross-origin resource sharing
- **morgan** - HTTP request logging
- **compression** - Response compression
- **express-rate-limit** - Rate limiting

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local or cloud)

### Installation

1. **Clone and navigate to backend**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment setup**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/finance-tracker
   JWT_SECRET=your-super-secret-jwt-key-here
   ```

4. **Start the server**:
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

The API will be available at `http://localhost:5000`

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh access token
- `PUT /api/auth/updatedetails` - Update user details
- `PUT /api/auth/updatepassword` - Update password
- `PUT /api/auth/preferences` - Update user preferences

### Income Endpoints

- `GET /api/income` - Get all income (with pagination and filters)
- `GET /api/income/:id` - Get single income entry
- `POST /api/income` - Create new income entry
- `PUT /api/income/:id` - Update income entry
- `DELETE /api/income/:id` - Delete income entry
- `GET /api/income/category/:categoryId` - Get income by category

### Goals Endpoints

- `GET /api/goals` - Get all goals
- `GET /api/goals/:id` - Get single goal
- `POST /api/goals` - Create new goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal
- `POST /api/goals/:id/contribute` - Add contribution to goal

### Savings Endpoints

- `GET /api/savings` - Get all savings
- `GET /api/savings/:id` - Get single savings entry
- `POST /api/savings` - Create new savings entry
- `PUT /api/savings/:id` - Update savings entry
- `DELETE /api/savings/:id` - Delete savings entry

### Categories Endpoints

- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get single category
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Analytics Endpoints

- `GET /api/analytics/dashboard` - Get dashboard analytics
- `GET /api/analytics/income` - Get income analytics
- `GET /api/analytics/savings` - Get savings analytics
- `GET /api/analytics/goals` - Get goals analytics

### AI Endpoints

- `GET /api/ai/insights` - Get AI insights
- `GET /api/ai/goal-recommendations` - Get goal recommendations
- `GET /api/ai/analyze-patterns` - Analyze income patterns

### User Endpoints

- `GET /api/users/profile` - Get user profile
- `DELETE /api/users/account` - Deactivate account

## Request/Response Format

### Standard Response Format

```json
{
  "success": true,
  "data": {},
  "message": "Optional message"
}
```

### Error Response Format

```json
{
  "success": false,
  "error": "Error message"
}
```

### Pagination Response

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Tokens expire in 7 days by default. Use the refresh token endpoint to get new tokens.

## Data Models

### User
- Personal information and preferences
- Subscription management
- Authentication data

### Income
- Amount, description, date
- Category association
- Recurring income support
- Tags and attachments

### Goal
- Target amount and date
- Progress tracking
- Milestones and contributions
- Auto-save functionality

### Savings
- Amount and description
- Goal association (optional)
- Account information
- Recurring savings support

### Category
- Name, color, and icon
- User-specific categories
- Default categories provided

## Security Features

- **Authentication**: JWT with secure secret rotation
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive validation with express-validator
- **Rate Limiting**: Protection against DoS attacks
- **Security Headers**: Helmet.js for secure HTTP headers
- **Password Hashing**: bcrypt with salt rounds
- **Data Sanitization**: Protection against injection attacks
- **CORS**: Configured for specific origins
- **Error Handling**: No sensitive data in error responses

## Development

### Scripts

```bash
npm run dev      # Start with nodemon
npm start        # Start production server
npm test         # Run tests
npm run seed     # Seed database with sample data
```

### Database Seeding

Create sample data for development:

```bash
npm run seed
```

This creates a test user and sample income/goal data.

## Deployment

### Environment Variables

Set these in production:

- `NODE_ENV=production`
- `MONGO_URI` - Production MongoDB URI
- `JWT_SECRET` - Strong secret key
- `FRONTEND_URL` - Your frontend domain

### Production Considerations

1. **Database**: Use MongoDB Atlas or similar managed service
2. **Environment**: Set NODE_ENV to 'production'
3. **Secrets**: Use strong, unique secrets
4. **Monitoring**: Set up error tracking and monitoring
5. **Scaling**: Consider clustering for high traffic
6. **Backup**: Regular database backups
7. **SSL**: Use HTTPS in production

## Health Check

Check if the API is running:

```
GET /health
```

Returns server status, uptime, and environment info.

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Ensure all tests pass
5. Follow security best practices

## License

This project is licensed under the MIT License.