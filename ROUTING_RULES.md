# Mashriq Routing & Architecture Rules
# قواعد البنية والمسارات لمنصة مشرق

---

## 🎯 Core Principle: Strict Separation

```
Frontend Routes:  /app/*  → HTML / CSS / JS / Static Files
Backend Routes:   /api/*  → JSON Only
```

---

## ✅ DO (مسموح)

### 1. API Endpoint Naming
```javascript
// ✅ CORRECT - All API endpoints start with /api/
app.get('/api/services', ...)
app.post('/api/auth/login', ...)
app.use('/api/orders', orderRoutes)
```

### 2. Frontend Navigation
```javascript
// ✅ CORRECT - window.location uses /app/* routes
window.location.href = '/app/login.html';
window.location.href = CONFIG.ROUTES.LOGIN;
```

### 3. API Calls
```javascript
// ✅ CORRECT - fetch uses /api/* endpoints
await fetch('/api/services');
await API.services.getAll();
```

### 4. 404 Handling
```javascript
// ✅ CORRECT - Separate 404 for API and Frontend
app.use('/api/*', (req, res) => {
  return error(res, 'API endpoint not found', 'ENDPOINT_NOT_FOUND', 404);
});

app.get('/app/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'app', 'index.html'));
});
```

### 5. Config Naming
```javascript
// ✅ CORRECT - ROUTES for pages, ENDPOINTS for API
CONFIG.ROUTES.LOGIN = '/app/login.html';
CONFIG.ENDPOINTS.LOGIN = '/auth/login';
```

---

## ❌ DON'T (ممنوع)

### 1. Generic Catch-All
```javascript
// ❌ WRONG - Catches everything including frontend
app.use((req, res) => {
  return error(res, 'Not found', 'NOT_FOUND', 404);
});
```

### 2. API Without /api/ Prefix
```javascript
// ❌ WRONG - Missing /api/ prefix
app.get('/services', ...)
app.post('/auth/login', ...)
```

### 3. Frontend Redirect to API
```javascript
// ❌ WRONG - Redirecting to API endpoint
window.location.href = '/api/auth/login';
```

### 4. fetch() to Frontend Route
```javascript
// ❌ WRONG - fetch should only call API
await fetch('/app/services.html');
```

### 5. Mixed Endpoint Names
```javascript
// ❌ WRONG - Inconsistent naming
ENDPOINTS.SERVICES = '/services'      // Missing /
ENDPOINTS.LOGIN = '/api/auth/login'   // Has /api/ (redundant with API_BASE_URL)
```

---

## 📋 Routing Order in server.js

The order MUST be:

```javascript
// 1. CORS & Trust Proxy
app.set('trust proxy', 1);
app.use(cors(corsOptions));

// 2. Static Files (before anything else)
app.use('/app', express.static(...));

// 3. Body Parsing
app.use(express.json());

// 4. Security Headers
app.use((req, res, next) => { ... });

// 5. Request Logging
app.use((req, res, next) => { console.log(...); next(); });

// 6. API Routes (all under /api/*)
app.get('/api/health', ...);
app.post('/api/auth/login', ...);
app.use('/api/orders', orderRoutes);
// ... all API routes ...

// 7. API Error Handler (only for /api/*)
app.use('/api', (err, req, res, next) => { ... });

// 8. API 404 (only for /api/*)
app.use('/api/*', (req, res) => { return error(...) });

// 9. Frontend Catch-All (for SPA routing)
app.get('/app/*', (req, res) => { res.sendFile('index.html') });

// 10. Ultimate Fallback
app.use((req, res) => { res.redirect('/app/') });
```

---

## 🔍 Endpoint Contract Checklist

Before adding any new endpoint:

1. **Backend**: Does it exist in `server.js` or `routes/*.js`?
2. **Config**: Is it added to `CONFIG.ENDPOINTS`?
3. **API Client**: Is it added to `api.js` with proper wrapper?
4. **Frontend**: Is the page using `API.xxx.method()` not raw `fetch()`?

---

## 🧪 Testing Checklist

### Production URL Tests:

| URL | Expected Behavior |
|-----|------------------|
| `/` | Redirect to `/app/` |
| `/app/` | Show index.html |
| `/app/login.html` | Show login page |
| `/app/buyer/orders.html` | Show buyer orders |
| `/app/nonexistent.html` | Show index.html (SPA fallback) |
| `/api/services` | JSON response |
| `/api/nonexistent` | JSON 404 error |

---

## 🔐 Auth Pattern

### Frontend Guards:
```javascript
// At page load
if (!Auth.requireAuth()) return;  // Redirect to login if not authenticated
if (!Auth.isSeller()) return;     // Redirect if not seller
```

### Backend Guards:
```javascript
// Route-level
app.get('/api/protected', authenticateToken, ...);
app.post('/api/services', authenticateToken, requireSeller, ...);
```

---

## 📁 File Structure

```
/public/app/
├── index.html
├── login.html
├── register.html
├── explore.html
├── service.html
├── checkout.html
├── order.html
├── profile.html
├── buyer/
│   ├── dashboard.html
│   ├── orders.html
│   └── order.html
├── seller/
│   ├── dashboard.html
│   ├── services.html
│   ├── add-service.html
│   ├── edit-service.html
│   └── orders.html
├── assets/
│   ├── css/
│   │   ├── main.css
│   │   └── pages/*.css
│   └── images/
└── js/
    ├── config.js      ← All constants
    ├── utils.js       ← Helper functions
    ├── auth.js        ← Auth state management
    ├── api.js         ← API client
    ├── components/    ← Reusable UI components
    └── pages/         ← Page-specific logic
```

---

## 🚀 Deployment Notes (Railway)

1. **Environment Variables Required:**
   - `MONGO_URI` - MongoDB Atlas connection string
   - `JWT_SECRET` - Secret for JWT signing
   - `PORT` - Auto-set by Railway

2. **No Build Step** - Vanilla JS, served as static

3. **Health Check:** `/api/health`

---

Last Updated: 2025-12-26
