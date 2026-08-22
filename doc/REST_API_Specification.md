# GlobeTrotter REST API Specification

## 1. API Conventions

* **Base Path**: `/api/v1`
* **Format**: `application/json` for both requests and responses.
* **Authentication**: Bearer Token (JWT) provided in the `Authorization` header (`Authorization: Bearer <token>`).
* **Dates/Datetimes**: ISO-8601 format (e.g., `YYYY-MM-DD` for dates, `YYYY-MM-DDTHH:MM:SSZ` for datetimes).
* **Pagination**: Query parameters `?page=1&size=20`. Responses wrap lists in `{ "items": [...], "total": 100, "page": 1, "size": 20, "pages": 5 }`.
* **Search/Filter/Sort**: Query parameters like `?q=search_term`, `?country=FR`, `?sort_by=created_at&sort_order=desc`.
* **Standard Success Response**: Returns the resource directly or wrapped in `data` (e.g., `{"id": 1, ...}`).
* **Standard Error Response**: `{"error": {"code": "ERROR_CODE", "message": "Human readable message", "details": [...]}}`
* **HTTP Status Codes**:
  * `200 OK`: Successful read/update.
  * `201 Created`: Successful creation.
  * `204 No Content`: Successful deletion (no body returned).
  * `400 Bad Request`: Invalid input/Pydantic validation failure.
  * `401 Unauthorized`: Missing or invalid JWT.
  * `403 Forbidden`: Authenticated, but lacks permissions (e.g., editing someone else's trip).
  * `404 Not Found`: Resource does not exist.
  * `409 Conflict`: Business logic conflict (e.g., email already exists).
  * `422 Unprocessable Entity`: FastAPI specific data validation error.
  * `500 Internal Server Error`: Unhandled backend exception.

---

## 2. Database Mapping

The core PostgreSQL tables and their API relationships:

* `users`: Read/Written by Auth, Profile, and Admin APIs.
* `trips`: Read/Written by Trip APIs. Linked to `users`.
* `cities`: Read by City Search.
* `trip_stops`: Read/Written by Itinerary Builder. Linked to `trips` and `cities`.
* `activities`: Read by Activity Search. Linked to `cities`.
* `trip_activities`: Read/Written by Itinerary Builder and Calendar. Linked to `trip_stops` and `activities`.
* `expenses`: Read/Written by Budget APIs. Linked to `trips`.
* `saved_destinations`: Read/Written by Profile APIs. Linked to `users` and `cities`.
* `shared_trips`: Read/Written by Sharing APIs. Links `trips` for public access.
* `community_posts`: Read/Written by Community APIs. Linked to `users` and `shared_trips`.

---

## 3. API Domains

* **Authentication**: Registration, Login, Token generation.
* **Dashboard**: Aggregate data for the home screen (recent trips, quick actions).
* **Trips**: CRUD operations for trips.
* **Cities**: Search and metadata retrieval.
* **Stops / Itinerary Builder**: Managing destinations within a trip and reordering.
* **Activities**: Search and retrieval for things to do.
* **Trip Activities / Itinerary**: Managing specific activities within a stop.
* **Calendar / Timeline**: Day-wise retrieval and drag-and-drop reordering.
* **Budget / Expenses**: Cost breakdown and financial alerts.
* **Public Sharing**: Generating public URLs and copying trips.
* **Profile / Settings**: User details, preferences, and saved destinations.
* **Community**: Discovering shared trips.
* **Admin (Optional)**: Platform analytics and user management.

---

## 4. Endpoint Contract

### Auth: Register
* **Endpoint + Method**: `POST /api/v1/auth/register`
* **Purpose**: Create a new user account.
* **Called by**: `SignupScreen` (User clicks Signup)
* **Auth**: None
* **Request**: Body `UserRegisterRequest` (`email`, `password`, `name`)
* **Validation**: Email format, strong password.
* **FastAPI Router**: `AuthRouter.register()`
* **Service**: `AuthService.register_user()`
* **Repository**: `UserRepository.create()`
* **PostgreSQL**: `INSERT INTO users`
* **Response**: `201 Created` with `AuthResponse` (`token`, `user`)
* **React UI Update**: Stores token, redirects to Dashboard.
* **Errors**: `409 Conflict` (Email exists).

### Auth: Login
* **Endpoint + Method**: `POST /api/v1/auth/login`
* **Purpose**: Authenticate user and issue JWT.
* **Called by**: `LoginScreen` (User clicks Login)
* **Auth**: None
* **Request**: Body `UserLoginRequest` (`email`, `password`)
* **Validation**: None
* **FastAPI Router**: `AuthRouter.login()`
* **Service**: `AuthService.authenticate()`
* **Repository**: `UserRepository.get_by_email()`
* **PostgreSQL**: `SELECT FROM users`
* **Response**: `200 OK` with `AuthResponse`
* **React UI Update**: Stores token, redirects to Dashboard.
* **Errors**: `401 Unauthorized` (Invalid credentials).

### Trips: Create Trip
* **Endpoint + Method**: `POST /api/v1/trips`
* **Purpose**: Initiate a new personalized travel plan.
* **Called by**: `CreateTripScreen` (User clicks Save)
* **Auth**: Required
* **Request**: Body `TripCreateRequest` (`name`, `start_date`, `end_date`, `description`, `cover_photo_url`)
* **Validation**: `start_date` before `end_date`.
* **FastAPI Router**: `TripRouter.create_trip()`
* **Service**: `TripService.create_trip()`
* **Repository**: `TripRepository.create()`
* **PostgreSQL**: `INSERT INTO trips`
* **Response**: `201 Created` with `TripResponse`
* **React UI Update**: Adds trip to state, navigates to `ItineraryBuilderScreen`.
* **Errors**: `400 Bad Request` (Invalid dates).

### Trips: Get My Trips
* **Endpoint + Method**: `GET /api/v1/trips`
* **Purpose**: List user's upcoming/past trips.
* **Called by**: `MyTripsScreen`, `DashboardScreen` (On mount)
* **Auth**: Required
* **Request**: Query `?page=1&size=10`
* **Validation**: None
* **FastAPI Router**: `TripRouter.get_my_trips()`
* **Service**: `TripService.get_user_trips()`
* **Repository**: `TripRepository.get_all_for_user()`
* **PostgreSQL**: `SELECT FROM trips WHERE user_id = ?`
* **Response**: `200 OK` with `Paginated[TripSummaryResponse]`
* **React UI Update**: Renders list of trip cards.

### Stops: Add Stop to Trip
* **Endpoint + Method**: `POST /api/v1/trips/{trip_id}/stops`
* **Purpose**: Add a city to the itinerary.
* **Called by**: `ItineraryBuilderScreen` (User clicks "Add Stop")
* **Auth**: Required, Must own trip
* **Request**: Body `StopCreateRequest` (`city_id`, `arrival_date`, `departure_date`, `order_index`)
* **Validation**: Dates within trip range.
* **FastAPI Router**: `StopRouter.add_stop()`
* **Service**: `StopService.add_stop()`
* **Repository**: `StopRepository.create()`
* **PostgreSQL**: `INSERT INTO trip_stops`
* **Response**: `201 Created` with `StopResponse`
* **React UI Update**: Updates timeline/itinerary view with new city stop.
* **Errors**: `403 Forbidden`, `404 Not Found` (Trip/City missing).

### Stops: Reorder Stops
* **Endpoint + Method**: `PUT /api/v1/trips/{trip_id}/stops/reorder`
* **Purpose**: Change the order of cities in a trip.
* **Called by**: `ItineraryBuilderScreen` (Drag-and-drop reorder)
* **Auth**: Required, Must own trip
* **Request**: Body `StopReorderRequest` (`stop_ids` array in new order)
* **Validation**: All IDs belong to the trip.
* **FastAPI Router**: `StopRouter.reorder_stops()`
* **Service**: `StopService.reorder()`
* **Repository**: `StopRepository.bulk_update_order()`
* **PostgreSQL**: Transactional `UPDATE trip_stops` (batch)
* **Response**: `200 OK`
* **React UI Update**: Confirms reorder visually, updates local state.

### Activities: Search
* **Endpoint + Method**: `GET /api/v1/activities`
* **Purpose**: Browse things to do.
* **Called by**: `ActivitySearchScreen` (User types or filters)
* **Auth**: Required
* **Request**: Query `?city_id=123&type=food&max_cost=50`
* **Validation**: `city_id` is required.
* **FastAPI Router**: `ActivityRouter.search_activities()`
* **Service**: `ActivityService.search()`
* **Repository**: `ActivityRepository.search()`
* **PostgreSQL**: `SELECT FROM activities WHERE city_id = ? AND ...`
* **Response**: `200 OK` with `Paginated[ActivityResponse]`
* **React UI Update**: Displays activity cards.

### Itinerary: Add Activity to Stop
* **Endpoint + Method**: `POST /api/v1/stops/{stop_id}/activities`
* **Purpose**: Assign an activity to a specific day/stop.
* **Called by**: `ActivitySearchScreen` (User clicks "Add to Trip")
* **Auth**: Required, Must own trip linked to stop
* **Request**: Body `TripActivityCreateRequest` (`activity_id`, `scheduled_time`, `custom_notes`)
* **Validation**: None
* **FastAPI Router**: `TripActivityRouter.add_activity()`
* **Service**: `TripActivityService.add_activity()`
* **Repository**: `TripActivityRepository.create()`
* **PostgreSQL**: `INSERT INTO trip_activities`
* **Response**: `201 Created` with `TripActivityResponse`
* **React UI Update**: Shows success toast, updates itinerary context.

### Calendar: Get Timeline
* **Endpoint + Method**: `GET /api/v1/trips/{trip_id}/timeline`
* **Purpose**: Fetch structured daily plan for the calendar view.
* **Called by**: `TripCalendarScreen`, `ItineraryViewScreen` (On mount)
* **Auth**: Required, Must own trip or trip must be public
* **Request**: Path `trip_id`
* **Validation**: None
* **FastAPI Router**: `TimelineRouter.get_timeline()`
* **Service**: `TimelineService.generate_timeline()`
* **Repository**: `TripRepository.get_full_hierarchy()`
* **PostgreSQL**: Complex `SELECT` with `JOIN`s (trips, stops, activities).
* **Response**: `200 OK` with `TimelineResponse` (grouped by day)
* **React UI Update**: Renders calendar blocks or vertical timeline.

### Budget: Get Cost Breakdown
* **Endpoint + Method**: `GET /api/v1/trips/{trip_id}/budget`
* **Purpose**: Retrieve financial summary and charts data.
* **Called by**: `TripBudgetScreen` (On mount)
* **Auth**: Required, Must own trip
* **Request**: Path `trip_id`
* **Validation**: None
* **FastAPI Router**: `BudgetRouter.get_breakdown()`
* **Service**: `BudgetService.calculate_budget()`
* **Repository**: `ExpenseRepository.get_by_trip()` + aggregations.
* **PostgreSQL**: `SELECT sum(cost), category FROM expenses GROUP BY category`
* **Response**: `200 OK` with `BudgetBreakdownResponse` (totals, categories, alerts)
* **React UI Update**: Renders pie/bar charts and average daily cost.

### Sharing: Publish Trip
* **Endpoint + Method**: `POST /api/v1/trips/{trip_id}/share`
* **Purpose**: Generate public URL for a trip.
* **Called by**: `DashboardScreen` or `ItineraryViewScreen` (User clicks Share)
* **Auth**: Required, Must own trip
* **Request**: Body `ShareTripRequest` (`is_public`)
* **Validation**: None
* **FastAPI Router**: `ShareRouter.publish_trip()`
* **Service**: `ShareService.create_share_link()`
* **Repository**: `SharedTripRepository.upsert()`
* **PostgreSQL**: `INSERT/UPDATE shared_trips`
* **Response**: `200 OK` with `ShareResponse` (`public_url`, `share_id`)
* **React UI Update**: Displays copyable link to user.

### Sharing: Copy Trip
* **Endpoint + Method**: `POST /api/v1/shared-trips/{share_id}/copy`
* **Purpose**: Clone a public trip to user's account.
* **Called by**: `SharedItineraryViewScreen` (User clicks "Copy Trip")
* **Auth**: Required
* **Request**: Path `share_id`
* **Validation**: `share_id` must be active.
* **FastAPI Router**: `ShareRouter.copy_trip()`
* **Service**: `ShareService.clone_trip()`
* **Repository**: `TripRepository.deep_clone()`
* **PostgreSQL**: Transactional multi-table `INSERT` (trips, stops, activities)
* **Response**: `201 Created` with `TripResponse` (New trip ID)
* **React UI Update**: Redirects to user's new `ItineraryBuilderScreen`.

### Profile: Update Settings
* **Endpoint + Method**: `PUT /api/v1/profile`
* **Purpose**: Update user preferences.
* **Called by**: `UserProfileScreen` (User clicks Save)
* **Auth**: Required
* **Request**: Body `ProfileUpdateRequest` (`name`, `language`, `photo_url`)
* **Validation**: None
* **FastAPI Router**: `ProfileRouter.update_profile()`
* **Service**: `ProfileService.update()`
* **Repository**: `UserRepository.update()`
* **PostgreSQL**: `UPDATE users`
* **Response**: `200 OK` with `UserResponse`
* **React UI Update**: Updates user context globally.

---

## 5. Frontend API Functions

* `authApi.register(payload: UserRegisterRequest): Promise<AuthResponse>`
* `authApi.login(payload: UserLoginRequest): Promise<AuthResponse>`
* `tripApi.createTrip(payload: TripCreateRequest): Promise<TripResponse>`
* `tripApi.getMyTrips(params?: PaginationParams): Promise<Paginated<TripSummaryResponse>>`
* `tripApi.getTimeline(tripId: string): Promise<TimelineResponse>`
* `stopApi.addStop(tripId: string, payload: StopCreateRequest): Promise<StopResponse>`
* `stopApi.reorderStops(tripId: string, payload: StopReorderRequest): Promise<void>`
* `cityApi.searchCities(query: string): Promise<Paginated<CityResponse>>`
* `activityApi.searchActivities(cityId: string, filters?: ActivityFilters): Promise<Paginated<ActivityResponse>>`
* `tripActivityApi.addActivity(stopId: string, payload: TripActivityCreateRequest): Promise<TripActivityResponse>`
* `budgetApi.getCostBreakdown(tripId: string): Promise<BudgetBreakdownResponse>`
* `shareApi.publishTrip(tripId: string, payload: ShareTripRequest): Promise<ShareResponse>`
* `shareApi.copyTrip(shareId: string): Promise<TripResponse>`
* `profileApi.updateProfile(payload: ProfileUpdateRequest): Promise<UserResponse>`
* `profileApi.deleteAccount(): Promise<void>`
* `profileApi.getSavedDestinations(): Promise<CityResponse[]>`

---

## 6. Complete UI → API Matrix

| Screen | Component | Action | API Function | Method | Endpoint | DB Effect | Response/UI Update |
|---|---|---|---|---|---|---|---|
| Login/Signup | `LoginForm` | Submit Login | `authApi.login` | POST | `/api/v1/auth/login` | None (Read `users`) | Sets token, routes to Dashboard |
| Login/Signup | `SignupForm` | Submit Signup | `authApi.register` | POST | `/api/v1/auth/register` | `INSERT users` | Sets token, routes to Dashboard |
| Dashboard | `RecentTrips` | Mount | `tripApi.getMyTrips` | GET | `/api/v1/trips` | Read `trips` | Renders trip list |
| Dashboard | `Nav` | Click "Plan New" | N/A | N/A | N/A | N/A | **Client-side routing only** |
| Create Trip | `TripForm` | Click Save | `tripApi.createTrip` | POST | `/api/v1/trips` | `INSERT trips` | Routes to Itinerary Builder |
| My Trips | `TripCard` | Click Delete | `tripApi.deleteTrip` | DELETE | `/api/v1/trips/{id}` | `DELETE trips` (cascade) | Removes card from list |
| City Search | `SearchBar` | Type query | `cityApi.searchCities` | GET | `/api/v1/cities` | Read `cities` | Renders autocomplete |
| Itinerary Bldr | `StopList` | Add City | `stopApi.addStop` | POST | `/api/v1/trips/{id}/stops` | `INSERT trip_stops` | Adds city block to timeline |
| Itinerary Bldr | `StopList` | Drag reorder | `stopApi.reorderStops` | PUT | `/api/v1/trips/{id}/stops/reorder` | `UPDATE trip_stops` | Updates UI order |
| Activity Search| `FilterBar` | Apply filter | `activityApi.searchActivities`| GET | `/api/v1/activities` | Read `activities` | Renders filtered list |
| Activity Search| `ActivityCard`| Add to Trip | `tripActivityApi.addActivity`| POST | `/api/v1/stops/{id}/activities`| `INSERT trip_activities` | Success toast |
| Itinerary View | `TimelineView`| Mount | `tripApi.getTimeline` | GET | `/api/v1/trips/{id}/timeline`| Read trips/stops/acts | Renders daily view |
| Trip Budget | `Charts` | Mount | `budgetApi.getCostBreakdown`| GET | `/api/v1/trips/{id}/budget` | Read `expenses` | Renders charts/stats |
| Calendar | `DayBlock` | Drag activity | `tripActivityApi.reschedule`| PUT | `/api/v1/trip-activities/{id}`| `UPDATE trip_activities` | Updates calendar |
| Shared Itin. | `Header` | Click Copy | `shareApi.copyTrip` | POST | `/api/v1/shared-trips/{id}/copy`| `INSERT trips/stops...`| Redirects to new trip |
| Profile | `SettingsForm`| Submit Save | `profileApi.updateProfile` | PUT | `/api/v1/profile` | `UPDATE users` | Updates context |
| Profile | `DangerZone` | Delete Account| `profileApi.deleteAccount` | DELETE | `/api/v1/profile` | `DELETE users` (cascade) | Logs out, routes to login |

---

## 7. Schemas

### `TripCreateRequest`
```json
{
  "name": "string (Required, min 3)",
  "start_date": "YYYY-MM-DD (Required)",
  "end_date": "YYYY-MM-DD (Required)",
  "description": "string (Optional)",
  "cover_photo_url": "string (Optional, URL format)"
}
```

### `TripResponse`
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "string",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "description": "string",
  "cover_photo_url": "string",
  "created_at": "datetime"
}
```

### `TimelineResponse`
```json
{
  "trip_id": "uuid",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "city": {"id": "uuid", "name": "Paris"},
      "activities": [
        {
          "id": "uuid",
          "name": "Eiffel Tower Tour",
          "scheduled_time": "10:00:00",
          "cost_estimate": 45.00
        }
      ]
    }
  ]
}
```

### `BudgetBreakdownResponse`
```json
{
  "total_estimated_cost": 1250.00,
  "average_cost_per_day": 250.00,
  "breakdown": {
    "transport": 400.00,
    "stay": 500.00,
    "activities": 200.00,
    "meals": 150.00
  },
  "overbudget_alerts": ["2023-11-15"]
}
```

---

## 8. Security

* **Authentication**: All endpoints except `/auth/*` and public shared trip routes require a valid JWT.
* **Password Hashing**: Passwords stored via bcrypt/Argon2. Plaintext passwords never logged or returned.
* **Ownership Checks**: The backend MUST extract `user_id` from the JWT, never from the request body. When accessing `GET /trips/{trip_id}`, the backend validates `trip.user_id == jwt.user_id`.
* **Role-Based Authorization**: Standard users cannot access Admin Dashboard routes. Implement a `role` field (`user` vs `admin`) in the JWT.
* **Private vs Public**: Trips default to private. They only become accessible to others if a `shared_trips` record exists and `is_public = true`.

---

## 9. Transactions & Errors

**Transactional Operations (Must rollback on failure):**
1. **Trip Copying**: Copying a trip requires inserting a new trip, multiple stops, and multiple activities. If any insert fails, the entire transaction must abort to prevent orphaned records.
2. **Account Deletion**: Deleting a user requires cascading deletes to their trips, stops, activities, and expenses.
3. **Stop Reordering**: Updating the `order_index` of multiple stops simultaneously to avoid unique constraint violations or corrupted orders.

**Standard Error Mappings:**
* **400**: Missing required fields, end date before start date.
* **401**: Expired JWT, tampered JWT.
* **403**: Trying to edit a trip ID belonging to another user.
* **404**: Fetching a `trip_id` or `city_id` that doesn't exist.
* **409**: Registering an email that is already in use.
* **422**: Pydantic validation (e.g., sending a string where an integer `cost` is expected).

---

## 10. Examples + Master Table

**Example Request: Add Stop**
```http
POST /api/v1/trips/b3a1-4f9c/stops
Authorization: Bearer eyJhbG...
Content-Type: application/json

{
  "city_id": "c7d2-8e1a",
  "arrival_date": "2024-05-10",
  "departure_date": "2024-05-14",
  "order_index": 1
}
```

**Master API Contract Table**

| Method | Endpoint | Auth | React Caller | Request | Response | Main Tables |
|---|---|---|---|---|---|---|
| POST | `/api/v1/auth/register` | No | `SignupScreen` | `UserRegisterRequest` | `AuthResponse` | `users` |
| POST | `/api/v1/auth/login` | No | `LoginScreen` | `UserLoginRequest` | `AuthResponse` | `users` |
| POST | `/api/v1/trips` | Yes | `CreateTripScreen` | `TripCreateRequest` | `TripResponse` | `trips` |
| GET | `/api/v1/trips` | Yes | `MyTripsScreen` | `?page, size` | `Paginated[TripSummary]` | `trips` |
| GET | `/api/v1/trips/{id}/timeline`| Yes | `ItineraryView` | None | `TimelineResponse` | `trips, trip_stops, trip_activities` |
| POST | `/api/v1/trips/{id}/stops` | Yes | `ItineraryBuilder` | `StopCreateRequest` | `StopResponse` | `trip_stops` |
| PUT | `/api/v1/trips/{id}/stops/reorder`| Yes | `ItineraryBuilder` | `StopReorderRequest` | `200 OK` | `trip_stops` |
| GET | `/api/v1/cities` | Yes | `CitySearch` | `?q` | `Paginated[CityResponse]` | `cities` |
| GET | `/api/v1/activities` | Yes | `ActivitySearch` | `?city_id, type` | `Paginated[ActivityResponse]`| `activities` |
| POST | `/api/v1/stops/{id}/activities`| Yes | `ActivitySearch` | `TripActivityCreateRequest`| `TripActivityResponse` | `trip_activities` |
| GET | `/api/v1/trips/{id}/budget` | Yes | `TripBudgetScreen` | None | `BudgetBreakdownResponse`| `expenses` |
| POST | `/api/v1/trips/{id}/share` | Yes | `SharedItinerary` | `ShareTripRequest` | `ShareResponse` | `shared_trips` |
| POST | `/api/v1/shared-trips/{id}/copy`| Yes | `SharedItinerary` | None | `TripResponse` | `trips, trip_stops...` |
| PUT | `/api/v1/profile` | Yes | `ProfileScreen` | `ProfileUpdateRequest` | `UserResponse` | `users` |
