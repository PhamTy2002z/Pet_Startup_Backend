# Theme Redemption Code System

## Overview

The Theme Redemption Code System implements a Steam-like code redemption feature for themes. Users register and log in to the Theme Store, purchase themes, and receive unique redemption codes. These codes can then be used in pet profiles to activate premium themes.

## How It Works

1. **Theme Store Purchase Flow**:
   - User registers/logs into the Theme Store
   - User browses and selects a theme to purchase
   - Upon purchase, a unique redemption code is generated
   - User receives the code which can be shared or used later

2. **Theme Redemption Flow**:
   - Pet owner accesses their pet's profile
   - Pet owner enters the redemption code
   - System validates the code and links the theme to the pet
   - Theme is applied to the pet's profile

## Features

- **Unique Codes**: Each redemption code is a unique 16-character alphanumeric string
- **Code Expiration**: Codes expire after 6 months if not used
- **Code Status Tracking**: Track if codes are active, redeemed, or expired
- **Redemption History**: View all theme redemptions for a pet
- **Code Validation**: Check if a code is valid before redemption
- **Multiple Codes Per Purchase**: Generate additional codes for themes you've already purchased

## API Endpoints

### Theme Store

- `POST /api/v1/theme-store/purchase`: Buy a theme and generate a redemption code
  - Request: `{ "themeId": "theme_id" }`
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

- `GET /api/v1/theme-store/purchases`: Get all themes purchased with their redemption codes
  - Response: Array of purchased themes with associated redemption codes

- `POST /api/v1/theme-store/generate-code`: Generate a new code for an already purchased theme
  - Request: `{ "themeId": "theme_id" }`
  - Response: Similar to purchase endpoint

### Pet Profile

- `POST /api/v1/redeem-theme-code`: Redeem a code for a pet
  - Request: `{ "code": "A1B2C3D4E5F6G7H8", "petId": "pet_id" }`
  - Response:
    ```json
    {
      "success": true,
      "message": "Theme redeemed successfully!",
      "theme": {
        "id": "theme_id",
        "name": "Theme Name",
        "description": "Theme description",
        "imageUrl": "/uploads/themes/image.jpg"
      },
      "pet": {
        "id": "pet_id",
        "name": "Pet Name"
      }
    }
    ```

- `GET /api/v1/validate-theme-code/:code`: Check if a code is valid without redeeming it
  - Response if valid:
    ```json
    {
      "valid": true,
      "code": "A1B2C3D4E5F6G7H8",
      "expiresAt": "2024-05-01T00:00:00.000Z",
      "theme": {
        "id": "theme_id",
        "name": "Theme Name",
        "description": "Theme description",
        "imageUrl": "/uploads/themes/image.jpg"
      }
    }
    ```
  - Response if invalid: HTTP error with explanation

- `GET /api/v1/theme-redemption-history/:petId`: Get all redeemed themes for a pet
  - Response: Array of theme redemption records

## Data Model

### ThemeRedemptionCode
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

1. **Security**: Codes are randomly generated and hard to guess
2. **Usability**: Codes are case-insensitive for easier entry
3. **Validation**: Multiple layers of validation ensure codes are used properly
4. **Gift Giving**: Codes can be shared with friends to gift themes
5. **Pet Integration**: Theme is automatically applied when redeemed

## Example Use Cases

1. **Personal Use**: Buy a theme in the store and redeem it on your pet's profile
2. **Gift for Friend**: Purchase a theme and send the code to a friend's pet
3. **Promotional Codes**: Administrators can generate codes for marketing campaigns
4. **Theme Collections**: Purchase multiple themes and redeem them as needed 