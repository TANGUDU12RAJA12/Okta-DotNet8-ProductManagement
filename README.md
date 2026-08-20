# Product Management System (.NET 8 Web API + Dual Hybrid Authentication)

![.NET 8](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet)
![Okta OIDC](https://img.shields.io/badge/Okta-OIDC-007DC1?logo=okta)
![JavaScript](https://img.shields.io/badge/Frontend-Vanilla_JS_ES6+-F7DF1E?logo=javascript)
![SQL Server](https://img.shields.io/badge/Database-SQL_Server-CC292B?logo=microsoftsqlserver)

A full-stack Product Management web application built with **ASP.NET Core .NET 8 Web API** and a **Vanilla JavaScript Single Page Application (SPA)**. 

The application implements **Dual Hybrid Authentication**, allowing users to sign in either via **Local Manual Account Credentials** (with BCrypt password hashing) or via **Okta OIDC Hosted Page Authentication**.

---

## 🌟 Key Features

- **Dual Hybrid Authentication**:
  - **Local Manual Auth**: User registration (`POST /api/auth/register`) with BCrypt password hashing and login (`POST /api/auth/login`) issuing local symmetric JWT tokens.
  - **Okta OIDC Auth**: Sign in via Okta hosted page (`https://trial-5762069.okta.com/...`) using PKCE Authorization Code flow.
- **Dynamic JWT Validation**: ASP.NET Core `JwtBearer` middleware validates both local symmetric tokens and Okta JWKS public keys.
- **`[AllowAnonymous]` & `[Authorize]` Scoping**:
  - Public access for registration and login endpoints.
  - Token-protected CRUD access for Product management endpoints.
- **Product Catalog Database CRUD**: Full `Create`, `Read`, `Update`, `Delete`, and `Search by ID` operations backed by SQL Server & Entity Framework Core.
- **Interactive SPA Frontend**: Responsive UI built with Vanilla JavaScript, modern CSS3 design system, live toast notifications, and tabs navigation.
- **Swagger / OpenAPI Documentation**: Interactive API testing playground with JWT Bearer authorization support.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: ASP.NET Core 8.0 Web API
- **Database / ORM**: Entity Framework Core 8.0 (SQL Server)
- **Authentication**: `Microsoft.AspNetCore.Authentication.JwtBearer`
- **Security / Password Hashing**: `BCrypt.Net-Next`
- **Object Mapping**: `AutoMapper` 13.0
- **API Documentation**: Swagger / Swashbuckle OpenAPI

### Frontend
- **Framework**: Vanilla JavaScript (ES6+ Modules)
- **Styling**: Modern CSS3 (Flexbox/Grid, CSS Custom Properties)
- **Identity SDK**: `@okta/okta-auth-js@7.5.0`

---

## 📁 Repository Project Structure

```
ProducutManagement/
├── Controllers/
│   ├── AuthController.cs         # Registration & Login endpoints ([AllowAnonymous])
│   └── ProductsController.cs     # Protected Product CRUD endpoints ([Authorize])
├── Data/
│   └── AppDbContext.cs           # EF Core Database Context
├── DTOs/
│   ├── AuthDtos.cs               # RegisterDto, LoginDto, AuthResponseDto
│   └── ProductDtos.cs            # CreateProductDto, UpdateProductDto, ProductResponseDto
├── Models/
│   ├── User.cs                   # In-memory User Model
│   └── Product.cs                # Product Database Entity
├── Repositories/
│   ├── IUserRepository.cs        # User Repository Interface
│   ├── InMemoryUserRepository.cs # In-Memory BCrypt User Store
│   ├── IProductRepository.cs     # Product Repository Interface
│   └── ProductRepository.cs       # EF Core Database Implementation
├── Services/
│   ├── IJwtTokenService.cs       # Token Service Interface
│   └── JwtTokenService.cs        # Local JWT Generator
├── wwwroot/                      # Single Page Application Assets
│   ├── index.html                # Main SPA Layout
│   ├── style.css                 # Custom Design System & CSS
│   ├── api.js                    # API & Okta SDK Service Module
│   └── app.js                    # DOM Controller & Event Handlers
├── appsettings.json              # JWT & Okta Settings
├── Program.cs                    # Dependency Injection & Dual Auth Middleware Pipeline
└── README.md                     # Documentation
```

---

## 🚀 Getting Started

### Prerequisites
- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [SQL Server / LocalDB](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/sql-server-express-localdb)

### 1. Clone the Repository
```bash
git clone https://github.com/TANGUDU12RAJA12/Okta-DotNet8-ProductManagement.git
cd Okta-DotNet8-ProductManagement
```

### 2. Configure `appsettings.json`
Verify connection strings and Okta settings in `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=EmployeeManagement_LearningDb;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Issuer": "ProducutManagementApi",
    "Audience": "ProducutManagementApp",
    "SecretKey": "SuperSecretKey_For_JWT_Authentication_DotNet8_2026_Minimum32Bytes_LongSecurityKey!",
    "TokenExpiryMinutes": 60
  },
  "Okta": {
    "Domain": "https://trial-5762069.okta.com",
    "Authority": "https://trial-5762069.okta.com/oauth2/default",
    "Audience": "api://employee-management-api",
    "ClientId": "0oa16kyxhc2WWyWKS698"
  }
}
```

### 3. Build & Run the Application
```bash
dotnet build
dotnet run --urls "http://localhost:5242"
```

### 4. Access the Application
- **Frontend SPA**: `http://localhost:5242/index.html`
- **Swagger Docs**: `http://localhost:5242/swagger`

---

## ⚙️ Okta Setup Checklist

To connect your own Okta tenant:
1. Create a **Single-Page Application (SPA)** in Okta Admin Console.
2. Set **Client Authentication** to **`None (Use PKCE)`**.
3. Add `http://localhost:5242/index.html` and `http://localhost:5242/` to **Sign-in / Sign-out redirect URIs**.
4. Add `http://localhost:5242` under **Security** $\rightarrow$ **API** $\rightarrow$ **Trusted Origins** with **CORS** and **Redirect** checked.

---

## 📝 License
This project is open-source under the [MIT License](LICENSE).
