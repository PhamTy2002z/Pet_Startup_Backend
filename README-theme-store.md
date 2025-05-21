# Theme Store Refactoring Documentation

## Overview

This document describes the refactoring of the Theme Store functionality to be a separate, independent page with its own authentication system. The Theme Store now operates independently from the pet profile system while still providing access to the same themes.

## Key Changes

1. **Separate Authentication System**
   - Created a dedicated user model for Theme Store users (`ThemeStoreUser`)
   - Implemented registration and login endpoints for Theme Store users
   - Added JWT-based authentication for Theme Store features

2. **Independent Theme Store**
   - The Theme Store no longer requires pet IDs or QR tokens from profiles
   - Users can browse themes without authentication
   - Theme purchases require Theme Store user authentication
   - Users can view their purchased themes in the Theme Store

3. **Updated UserTheme Model**
   - Modified to support both pet-based themes and Theme Store user purchases
   - Added flexible schema validation to handle both use cases
   - Created appropriate indexes for efficient queries

4. **Redemption Code System (New)**
   - Implemented Steam-like redemption code system
   - Theme purchases generate unique redemption codes
   - Codes can be redeemed in pet profiles to unlock themes
   - Supports code validation, expiration, and tracking

## API Endpoints

### Authentication
- `POST /api/v1/theme-store/auth/register`: Register a new Theme Store user
  - Request body: `{ "name": "User Name", "email": "user@example.com", "password": "password123" }`
  - Response: `{ "token": "jwt_token", "user": { "id": "user_id", "name": "User Name", "email": "user@example.com" } }`

- `POST /api/v1/theme-store/auth/login`: Login to the Theme Store
  - Request body: `{ "email": "user@example.com", "password": "password123" }`
  - Response: `{ "token": "jwt_token", "user": { "id": "user_id", "name": "User Name", "email": "user@example.com" } }`

- `GET /api/v1/theme-store/auth/me`: Get current Theme Store user details
  - Headers: `Authorization: Bearer jwt_token`
  - Response: `{ "id": "user_id", "name": "User Name", "email": "user@example.com" }`

### Themes
- `GET /api/v1/theme-store/themes`: Get all active themes in the store (public)
  - Response: Array of theme objects

- `POST /api/v1/theme-store/purchase`: Purchase a theme and get a redemption code (authenticated)
  - Headers: `Authorization: Bearer jwt_token`
  - Request body: `{ "themeId": "theme_id" }`
  - Response: 
    ```json
    {
      "success": true,
      "userTheme": { ... },
      "redemptionCode": {
        "code": "A1B2C3D4E5F6G7H8",
        "expiresAt": "2024-05-01T00:00:00.000Z",
        "theme": {
          "id": "theme_id",
          "name": "Theme Name"
        }
      }
    }
    ```

- `GET /api/v1/theme-store/purchases`: Get purchased themes with redemption codes (authenticated)
  - Headers: `Authorization: Bearer jwt_token`
  - Response: Array of purchased theme objects with their redemption codes

- `POST /api/v1/theme-store/generate-code`: Generate a new code for an already purchased theme (authenticated)
  - Headers: `Authorization: Bearer jwt_token`
  - Request body: `{ "themeId": "theme_id" }`
  - Response: Similar to purchase endpoint

### Redemption (Pet Profile)
- `POST /api/v1/redeem-theme-code`: Redeem a code for a pet
  - Request: `{ "code": "A1B2C3D4E5F6G7H8", "petId": "pet_id" }`
  - Response: Theme and pet details

- `GET /api/v1/validate-theme-code/:code`: Check if a code is valid without redeeming it
  - Response: Theme details or error

- `GET /api/v1/theme-redemption-history/:petId`: Get all redeemed themes for a pet
  - Response: Array of theme redemption records

## Data Models

### ThemeStoreUser
```javascript
{
  name: String, // required
  email: String, // required, unique
  password: String, // required, hashed
  registrationDate: Date
}
```

### UserTheme (Updated)
```javascript
{
  petId: ObjectId, // optional if themeStoreUserId exists
  themeStoreUserId: ObjectId, // optional if petId exists
  themeId: ObjectId, // required
  purchaseDate: Date,
  transactionDetails: {
    transactionId: String,
    amount: Number,
    status: String // 'completed', 'pending', or 'failed'
  }
}
```

### ThemeRedemptionCode (New)
```javascript
{
  code: String,        // Unique redemption code
  themeId: ObjectId,   // Reference to the theme
  createdBy: ObjectId, // Theme store user who purchased
  redeemedBy: ObjectId, // Pet that redeemed the code (null if not redeemed)
  status: String,      // 'active', 'redeemed', or 'expired'
  expiresAt: Date,     // When the code expires
  redeemedAt: Date,    // When the code was redeemed (null if not redeemed)
  createdAt: Date      // When the code was created
}
```

## Implementation Notes

1. The Theme Store system is fully backward compatible with the existing pet profile theme system.
2. Theme purchases in the Theme Store now generate redemption codes instead of directly assigning themes to pets.
3. The redemption code system enables gifting themes to other pet owners.
4. Codes expire after 6 months if not redeemed.
5. Each Theme Store user can generate multiple codes for purchased themes.

## User Flow

1. **Theme Store User Flow**:
   - Register or login to the Theme Store
   - Browse and select a theme to purchase
   - Complete purchase and receive a redemption code
   - View all your purchased themes and their redemption codes
   - Generate additional codes for purchased themes as needed

2. **Pet Owner Flow**:
   - Access pet profile
   - Enter the redemption code received from the Theme Store
   - Theme is validated, applied to the pet, and marked as redeemed
   - View history of all redeemed themes

## Future Considerations

1. Add theme search and filtering features to the Theme Store
2. Implement user profile management for Theme Store users
3. Create a theme preview feature before purchase
4. Add payment integration for premium themes
5. Implement promotional code system for marketing campaigns
6. Add bulk code generation for organizational users 