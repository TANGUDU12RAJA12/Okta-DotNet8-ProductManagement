# Product Management System (.NET 8 Web API + Dual Hybrid Authentication)

![.NET 8](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet)
![Okta OIDC](https://img.shields.io/badge/Okta-OIDC-007DC1?logo=okta)
![JavaScript](https://img.shields.io/badge/Frontend-Vanilla_JS_ES6+-F7DF1E?logo=javascript)
![SQL Server](https://img.shields.io/badge/Database-SQL_Server-CC292B?logo=microsoftsqlserver)

An enterprise-ready **Product Management Web Application** built with an **ASP.NET Core .NET 8 Web API** backend and a responsive **Vanilla JavaScript Single Page Application (SPA)** frontend.

The project demonstrates a real-world **Dual Hybrid Authentication Architecture**, empowering users to authenticate using either **Local Manual Credentials** (BCrypt hashed passwords) or **Enterprise Single Sign-On (SSO)** via **Okta OIDC Hosted Page**.

---

## 📖 About The Project

Modern web applications often require flexible authentication strategies:
- **Local Credentials**: For guest users, freelancers, or local administrators who create accounts directly within the system.
- **Enterprise SSO (Okta OIDC)**: For corporate employees who log in securely using their centralized Okta identity.

This project solves the challenge of supporting **both login mechanisms concurrently** without duplicating backend APIs or creating fragmented security rules. 

### 💡 Core Architectural Highlights
1. **Dynamic JWT Validation Engine**: ASP.NET Core `JwtBearer` middleware uses a custom `IssuerSigningKeyResolver` to dynamically inspect incoming Bearer tokens:
   - If issued locally (`ProducutManagementApi`), it verifies the signature using a local symmetric secret key.
   - If issued by Okta (`https://trial-5762069.okta.com/oauth2/default`), it verifies the signature against Okta's live JWKS public keys.
2. **Stateless API Protection**: All Product CRUD operations (`/api/products`) are protected by the `[Authorize]` attribute and accept valid JWT tokens from **either** login method.
3. **Public Onboarding**: Authentication endpoints (`/api/auth/register` and `/api/auth/login`) are explicitly configured with `[AllowAnonymous]` so new users can seamlessly register and sign in.

---

## 🌟 Key Features

- 🔐 **Dual Hybrid Authentication**:
  - **Local Manual Auth**: Registration (`POST /api/auth/register`) with BCrypt password hashing and sign-in (`POST /api/auth/login`) issuing local signed JWT tokens.
  - **Okta OIDC Auth**: One-click redirect to Okta Hosted Login page (`https://trial-5762069.okta.com/...`) using PKCE Authorization Code flow.
- 📦 **Product Database CRUD**: Full `Create`, `Read`, `Update`, `Delete`, and `Search by ID` operations backed by SQL Server & Entity Framework Core.
- 🎨 **Modern SPA Frontend**: Built with Vanilla JavaScript (ES6+), custom CSS3 design system, responsive card layouts, and live toast notifications.
- 📄 **Interactive Swagger Documentation**: Full OpenAPI testing UI equipped with JWT Bearer token authentication support.

---

## 🔌 API Endpoints Summary

| HTTP Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | `[AllowAnonymous]` | Registers a new local user with BCrypt hashed password |
| `POST` | `/api/auth/login` | `[AllowAnonymous]` | Authenticates local user & issues signed local JWT token |
| `GET` | `/api/products` | `[Authorize]` | Retrieves all products from SQL Server database |
| `GET` | `/api/products/{id}` | `[Authorize]` | Retrieves a specific product by Product ID |
| `POST` | `/api/products` | `[Authorize]` | Creates a new product entry in the database |
| `PUT` | `/api/products/{id}` | `[Authorize]` | Updates an existing product's details |
| `DELETE` | `/api/products/{id}` | `[Authorize]` | Deletes a product from the database |

---

## 🛠️ Tech Stack & Architecture

### Backend Architecture
- **Framework**: ASP.NET Core 8.0 Web API
- **Database & ORM**: Entity Framework Core 8.0 (SQL Server / LocalDB)
- **Security & Password Hashing**: `BCrypt.Net-Next` (v4.2.0)
- **Authentication**: `Microsoft.AspNetCore.Authentication.JwtBearer` (v8.0.11)
- **Object Mapping**: `AutoMapper` (v13.0.1)
- **API Documentation**: Swagger / Swashbuckle OpenAPI

### Frontend Architecture
- **Language**: Vanilla JavaScript (ES6+ Modules)
- **UI & Layout**: Modern CSS3 (Flexbox/Grid, Glassmorphism elements, CSS Custom Properties)
- **Identity SDK**: `@okta/okta-auth-js` (v7.5.0)

---

## 📁 Repository Directory Structure

```
ProducutManagement/
├── Controllers/
│   ├── AuthController.cs         # Public Registration & Login endpoints ([AllowAnonymous])
│   └── ProductsController.cs     # Secured Product CRUD endpoints ([Authorize])
├── Data/
│   └── AppDbContext.cs           # EF Core SQL Server Database Context
├── DTOs/
│   ├── AuthDtos.cs               # RegisterDto, LoginDto, AuthResponseDto
│   └── ProductDtos.cs            # CreateProductDto, UpdateProductDto, ProductResponseDto
├── Models/
│   ├── User.cs                   # In-Memory User Model
│   └── Product.cs                # Product Database Entity
├── Repositories/
│   ├── IUserRepository.cs        # User Repository Interface
│   ├── InMemoryUserRepository.cs # In-Memory BCrypt User Storage
│   ├── IProductRepository.cs     # Product Repository Interface
│   └── ProductRepository.cs       # EF Core Database Repository
├── Services/
│   ├── IJwtTokenService.cs       # Token Service Interface
│   └── JwtTokenService.cs        # Local JWT Generator Service
├── wwwroot/                      # Single Page Application Assets
│   ├── index.html                # Main SPA Layout & Auth Views
│   ├── style.css                 # Custom CSS Design System
│   ├── api.js                    # API & Okta SDK Integration Module
│   └── app.js                    # DOM Logic & Event Listeners
├── appsettings.json              # JWT & Okta Configuration Settings
├── Program.cs                    # Dependency Injection & Dual Auth Pipeline
└── README.md                     # Comprehensive Project Documentation
```

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [SQL Server / LocalDB](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/sql-server-express-localdb)

### 1. Clone the Repository
```bash
git clone https://github.com/TANGUDU12RAJA12/Okta-DotNet8-ProductManagement.git
cd Okta-DotNet8-ProductManagement
```

### 2. Configure `appsettings.json`
Ensure `appsettings.json` has valid database and authentication settings:
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

### 4. Open in Browser
- 🌐 **Single Page Application (UI)**: **`http://localhost:5242/index.html`**
- 📄 **Swagger Interactive API**: **`http://localhost:5242/swagger`**

---

## ⚙️ Okta Admin Console Configuration

To connect your own Okta Tenant:
1. Create a **Single-Page Application (SPA)** in Okta Admin Console.
2. Set **Client Authentication** to **`None (Use PKCE)`**.
3. Set **Sign-in / Sign-out redirect URIs** to `http://localhost:5242/index.html` and `http://localhost:5242/`.
4. Under **Security** $\rightarrow$ **API** $\rightarrow$ **Trusted Origins**, add `http://localhost:5242` with **CORS** and **Redirect** checked.

---

## 📝 License
This project is open-source and available under the [MIT License](LICENSE).
