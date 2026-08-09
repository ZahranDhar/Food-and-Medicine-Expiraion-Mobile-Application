# Freshness Tracker Frontend (React Native & Expo)

A complete, modular, scalable, production-ready React Native mobile frontend built using Expo. This application helps users track their kitchen items and receive push alerts 7 days before items expire to reduce food waste.

---

## 🚀 Tech Stack

- **Framework:** React Native with Expo (SDK 56)
- **Language:** TypeScript
- **Navigation:** React Navigation (Native Stack)
- **HTTP Client:** Axios with dynamic authorization interceptor
- **Storage:** AsyncStorage (for auth state and notification mappings)
- **Alerts:** Expo Notifications
- **Styling:** NativeWind v4 (Tailwind CSS for React Native)
- **State Management:** React Context API

---

## 📂 Project Structure

```
src/
├── api/
│   ├── axios.ts         # Axios configuration & JWT interceptor
│   ├── authApi.ts       # Auth endpoints (Login, Signup, User validation)
│   └── productApi.ts    # Product endpoints (Fetch list, Multipart add, Delete)
│
├── components/
│   ├── ui/
│   │   ├── AppButton.tsx       # Button with variants and loading spinner
│   │   ├── AppInput.tsx        # TextInput with validation errors and password show/hide
│   │   ├── LoadingSpinner.tsx  # Activity Indicator with descriptive labels
│   │   ├── LoadingSkeleton.tsx # Skeleton UI for product cards and dashboard
│   │   ├── EmptyState.tsx      # Standard empty list warning page
│   │   ├── ErrorState.tsx      # Standard error alert layout with retry trigger
│   │   └── Avatar.tsx          # Dynamic initials-based profile avatars
│   │
│   ├── cards/
│   │   ├── ProductCard.tsx     # Product displays showing remaining days and color badge
│   │   └── DashboardCard.tsx   # Profile counter stats with category themes
│   │
│   └── layout/
│       ├── ScreenContainer.tsx # Safe area view, KeyboardAvoidingView, & Scroll wrappers
│       └── Header.tsx          # Modular header with title, back controls, and right elements
│
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.tsx      # Login form, validation, and auth stack redirect
│   │   └── SignupScreen.tsx     # Signup form with confirmation validation
│   │
│   ├── home/
│   │   └── HomeScreen.tsx       # Pantry search, filtering tabs, skeletons, & refresh control
│   │
│   ├── profile/
│   │   └── ProfileScreen.tsx    # User details view, dashboard stats, and logout
│   │
│   └── product/
│       ├── AddProductScreen.tsx   # Camera/gallery image capture and title forms
│       └── ProductDetailScreen.tsx# Detailed views and product deletion triggers
│
├── navigation/
│   ├── AppNavigator.tsx   # Stack Navigator for authenticated users
│   ├── AuthNavigator.tsx  # Stack Navigator for guest login/signup flows
│   ├── MainNavigator.tsx  # Root navigator switching stack based on AuthContext state
│   └── types.ts           # TypeScript type definitions for routes
│
├── context/
│   ├── AuthContext.tsx    # User login session, auto-login bootstrapping, and logout states
│   └── ProductContext.tsx # Products, refresh actions, additions, deletions, & stat counters
│
├── notifications/
│   └── notificationService.ts # Local notification scheduler and self-healing syncing cycles
│
├── constants/
│   └── index.ts           # Centralized API base URL and AsyncStorage key names
│
├── theme/
│   └── colors.ts          # Color palettes for light/dark freshness themes
│
├── utils/
│   └── date.ts            # Freshness status classification and remaining days calculations
│
└── types/
    ├── auth.ts            # Type definitions for Auth entities
    └── product.ts         # Type definitions for Product entities
```

---

## ⚙️ Configuration & Environment Variables

Create a `.env` file in the root of the project to configure the backend API endpoint.

```env
# Backend API base URL
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

- **For local iOS Simulator:** Use `http://localhost:3000/api`
- **For local Android Emulator:** Use `http://10.0.2.2:3000/api`
- **For Physical Devices:** Use `http://<your-machine-ip>:3000/api`

---

## 📦 Installation & Setup

1. **Clone the repository and navigate to the root directory.**
2. **Install all dependencies:**
   ```bash
   npm install
   ```
3. **Set up the configuration:**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Modify `.env` to point to your backend service.

4. **Start the Expo development server:**
   ```bash
   npm run start
   ```

To restart the server with a cleared cache:
```bash
npx expo start -c
```

---

## 🔔 Notification Sync Architecture

Local push alerts are completely decoupled from UI components and scheduled securely on the device.

1. **Permissions:** Requested on initial application launch (via `notificationService.requestPermissions()`).
2. **Trigger Window:** Automatically scheduled for exactly **7 days prior** to the product's expiration date at **9:00 AM local time**.
3. **Expired & Expiring Items:** Schedulers ignore products that have already expired or are expiring in less than 7 days.
4. **Rescheduling & Cleanup:** The application runs `syncProductNotifications` whenever products are added, loaded, or refreshed. It:
   - Cancels scheduled alerts for products that were deleted.
   - Updates triggers if a product's expiration date changes.
   - Prevents duplicate alerts by maintaining a local map of scheduled `notificationIds` in `AsyncStorage`.
