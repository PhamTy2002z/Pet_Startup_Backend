# Theme Management Features

This document outlines the implementation of theme management features for the Pet Startup Backend. The system supports both free and premium themes, with the ability to purchase, collect, and apply themes to pet profiles.

## Models

### Theme Model
The Theme model has been enhanced to support premium themes:

- `name`: The name of the theme
- `imageUrl`: URL to the theme image
- `description`: Description of the theme
- `isActive`: Whether the theme is active and can be used
- `isPremium`: Whether the theme is a premium theme that needs to be purchased
- `price`: The price of the theme (0 for free themes)
- `inStore`: Whether the theme is available in the store
- `order`: Order of display

### UserTheme Model
The UserTheme model tracks purchased themes:

- `petId`: Reference to the Pet that owns the theme
- `themeId`: Reference to the purchased Theme
- `purchaseDate`: When the theme was purchased
- `transactionDetails`: Simulated payment transaction information
  - `transactionId`: Unique transaction ID
  - `amount`: Amount paid
  - `status`: Transaction status (completed, pending, failed)

## User Features

### Viewing Available Themes
- Users can view all available themes in the store
- Endpoint: `GET /store/themes`

### Viewing Purchased Themes
- Users can view their purchased themes
- Endpoint: `GET /purchased-themes/:petId`

### Purchasing a Theme
- Users can purchase a theme from the store
- Endpoint: `POST /purchase-theme`
- Payload: `{ petId, themeId }`

### Applying a Theme
- Users can apply any of their themes (free or purchased) to their pet profile
- Endpoint: `POST /apply-theme`
- Payload: `{ petId, themeId }`

## Admin Features

### Creating Themes
- Admins can create new themes (free or premium)
- Endpoint: `POST /admin/themes`
- Payload: `{ name, description, isActive, isPremium, price, inStore, order, image }`

### Managing Themes
- Admins can update theme properties
- Endpoint: `PUT /admin/themes/:id`
- Payload: `{ name, description, isActive, isPremium, price, inStore, order, image }`

### Deleting Themes
- Admins can delete themes that are not in use
- Endpoint: `DELETE /admin/themes/:id`

### Bulk Theme Management
- Admins can update theme active status in bulk
- Endpoint: `PUT /admin/themes/batch-status`
- Payload: `{ themes: [{ id, isActive }] }`

- Admins can update theme order in bulk
- Endpoint: `PUT /admin/themes/order`
- Payload: `{ themes: [{ id, order }] }`

## Payment Simulation

Since there is no real payment API, the system simulates payment transactions:

1. When a user attempts to purchase a theme, the system creates a transaction record
2. The transaction is automatically marked as "completed"
3. The purchased theme is added to the user's collection

## Authentication

The system validates pet ownership through the pet ID rather than tokens, which works well with the QR scanning access pattern:

1. When a pet QR is scanned, the pet ID is used to fetch the pet profile
2. The same pet ID is used to check theme ownership and apply themes
3. No token-based authentication is required for these operations

## Implementation Notes

- Free themes are available to all pets
- Premium themes must be purchased before they can be applied
- Themes that are not active or not in the store cannot be purchased
- Purchased themes remain in the user's collection even if they are removed from the store
- Applying a theme updates the pet's themeId reference 