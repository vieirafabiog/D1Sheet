# Cloudflare D1 OData Gateway

A high-performance, production-ready **OData v2/v4 compatible gateway** for **Cloudflare D1 (SQLite)** databases, built on Cloudflare Workers and TypeScript. Secured by **HTTP Basic Authentication**, fully configurable via `wrangler.toml` and Cloudflare secrets.

---

## 📖 Table of Contents

- [Overview & Architecture](#-overview--architecture)
- [Features](#-features)
- [Configuration Guide](#-configuration-guide)
  - [wrangler.toml](#wranglertoml)
  - [Secrets](#secrets)
- [API Specification & Examples](#-api-specification--examples)
  - [Authentication](#authentication)
  - [Service Document & Metadata](#service-document--metadata)
  - [Querying Entity Sets](#querying-entity-sets)
  - [OData Query Options Matrix](#odata-query-options-matrix)
  - [Single Entity Queries](#single-entity-queries)
  - [Count Queries](#count-queries)
  - [Pagination & NextLink](#pagination--nextlink)
- [Client Integration](#-client-integration)
  - [cURL](#curl)
  - [Power BI / Power Query](#power-bi--power-query)
  - [Postman](#postman)
- [Local Development & Testing](#-local-development--testing)
- [Deployment Instructions](#-deployment-instructions)
- [License](#-license)

---

## 🏛 Overview & Architecture

This gateway allows analytics tools, business intelligence platforms (such as Microsoft Power BI, Excel, Tableau), and external enterprise applications to query Cloudflare D1 databases using standard OData v2/v4 protocols over HTTPS.

```
┌─────────────────────────────────┐
│ Client (Power BI, Excel, cURL)  │
└────────────────┬────────────────┘
                 │ HTTPS (Basic Auth)
                 ▼
┌─────────────────────────────────┐
│ Cloudflare Worker Gateway       │
│  ├─ Timing-Safe Auth Middleware │
│  ├─ CORS & OData Error Handler  │
│  ├─ OData AST Query Parser      │
│  ├─ Parameterized SQL Compiler  │
│  └─ EDMX XML Schema Generator   │
└────────────────┬────────────────┘
                 │ Bound SQLite Queries
                 ▼
┌─────────────────────────────────┐
│ Cloudflare D1 (SQLite Database) │
└─────────────────────────────────┘
```

### Architecture Highlights

- **Zero-Allocation Safety**: Utilizes a recursive descent parser for `$filter` to build a strictly typed Abstract Syntax Tree (AST), rejecting invalid tokens before query construction.
- **100% Parameterized SQL**: All filter literals are converted to positional parameter markers (`?`) to prevent SQL injection.
- **Identifier Validation**: Table and column names are validated against strict alphanumeric identifiers (`/^[a-zA-Z_][a-zA-Z0-9_]*$/`) and double-quoted.
- **Dynamic Schema Reflection**: Inspects SQLite's `sqlite_master` and `PRAGMA table_info` to generate dynamic OData v4 EDMX metadata XML documents without code regeneration.
- **Server-Driven Pagination**: Adheres to OData specifications by computing `@odata.nextLink` containing preserved filters and incremented `$skip` offsets.

---

## ✨ Features

- **Protocol Compatibility**: OData v4.0 with backwards-compatible features (such as `$inlinecount`).
- **Security**:
  - HTTP Basic Authentication evaluated using constant-time SHA-256 byte comparisons to protect against timing attacks.
  - Granular CORS control for browser-based OData clients.
  - Detailed, standardized OData error payloads (`{"error": {"code": "...", "message": "..."}}`).
- **Query Capabilities**:
  - `$filter`: Comparison (`eq`, `ne`, `gt`, `ge`, `lt`, `le`), logical (`and`, `or`, `not`), null checks (`IS NULL`), and string functions (`contains`, `startswith`, `endswith`, `tolower`, `toupper`).
  - `$select`: Column projection with validation.
  - `$orderby`: Multi-column ordering (`asc`, `desc`).
  - `$top` and `$skip`: Offset-based pagination with configurable ceilings.
  - `$count`: Count inline (`@odata.count`) and raw count (`/$count`).
- **Automatic Type Mapping**: SQLite types (`INTEGER`, `REAL`, `BOOLEAN`, `DATETIME`, `TEXT`) map cleanly to EDM types (`Edm.Int32`, `Edm.Int64`, `Edm.Double`, `Edm.Boolean`, `Edm.DateTimeOffset`, `Edm.String`).

---

## ⚙️ Configuration Guide

### `wrangler.toml`

Configure your worker name, compatibility date, database binding, and environment variables:

```toml
name = "d1-odata-gateway"
main = "src/index.ts"
compatibility_date = "2024-09-23"

# Cloudflare D1 Database Binding
[[d1_databases]]
binding = "DB"
database_name = "YOUR_D1_DATABASE_NAME"
database_id = "YOUR_D1_DATABASE_ID"

# Public environment variables
[vars]
ODATA_SERVICE_ROOT = "/odata"
DEFAULT_PAGE_SIZE = "100"
MAX_PAGE_SIZE = "1000"
BASIC_AUTH_USER = "admin"
```

| Variable | Description | Default |
|---|---|---|
| `DB` | Cloudflare D1 database binding name | `DB` |
| `ODATA_SERVICE_ROOT` | Base path for OData endpoints | `/odata` |
| `DEFAULT_PAGE_SIZE` | Default number of records per page when `$top` is omitted | `100` |
| `MAX_PAGE_SIZE` | Maximum allowed value for `$top` to prevent memory exhaustion | `1000` |
| `BASIC_AUTH_USER` | Expected username for Basic Authentication | `admin` |

### Secrets

Passwords should **never** be stored in plain text inside `wrangler.toml`. Set the gateway password via Cloudflare Secrets:

```bash
# Set production password
npx wrangler secret put BASIC_AUTH_PASS
```

For **local development**, define `BASIC_AUTH_PASS` inside `.dev.vars` (which is excluded from Git):

```ini
BASIC_AUTH_PASS=your_local_secret_password
```

---

## 📡 API Specification & Examples

### Authentication

All endpoints (except CORS `OPTIONS` preflights) require an `Authorization: Basic <base64(user:password)>` header.

If missing or invalid:
```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Basic realm="OData D1 Gateway", charset="UTF-8"
Content-Type: application/json; charset=utf-8
OData-Version: 4.0

{
  "error": {
    "code": "Unauthorized",
    "message": "Authentication is required to access this resource."
  }
}
```

---

### Service Document & Metadata

#### 1. Service Document
Returns available entity sets for discovery by clients like Power BI.

- **Request**: `GET /odata`
- **Response**:
```json
{
  "@odata.context": "https://gateway.example.com/odata/$metadata",
  "value": [
    { "name": "Customers", "kind": "EntitySet", "url": "Customers" },
    { "name": "Products", "kind": "EntitySet", "url": "Products" },
    { "name": "Orders", "kind": "EntitySet", "url": "Orders" }
  ]
}
```

#### 2. Metadata Document (`$metadata`)
Dynamically inspects the D1 SQLite schema and returns standard OData EDMX XML.

- **Request**: `GET /odata/$metadata`
- **Response Header**: `Content-Type: application/xml;charset=utf-8`
- **Response Body**:
```xml
<?xml version="1.0" encoding="utf-8"?>
<edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">
  <edmx:DataServices>
    <Schema Namespace="D1Gateway" xmlns="http://docs.oasis-open.org/odata/ns/edm">
      <EntityType Name="Customers">
        <Key>
          <PropertyRef Name="Id" />
        </Key>
        <Property Name="Id" Type="Edm.Int32" Nullable="false" />
        <Property Name="Name" Type="Edm.String" Nullable="false" />
        <Property Name="Email" Type="Edm.String" Nullable="true" />
        <Property Name="IsVip" Type="Edm.Boolean" Nullable="true" />
        <Property Name="Balance" Type="Edm.Double" Nullable="true" />
      </EntityType>
      <EntityContainer Name="DefaultContainer">
        <EntitySet Name="Customers" EntityType="D1Gateway.Customers" />
      </EntityContainer>
    </Schema>
  </edmx:DataServices>
</edmx:Edmx>
```

---

### Querying Entity Sets

#### Basic Collection Request
- **Request**: `GET /odata/Customers`
- **Response**:
```json
{
  "@odata.context": "https://gateway.example.com/odata/$metadata#Customers",
  "value": [
    {
      "Id": 1,
      "Name": "Alice Johnson",
      "Email": "alice@corp.com",
      "IsVip": true,
      "Balance": 1450.75
    }
  ]
}
```

---

### OData Query Options Matrix

| Parameter | Example | SQLite Equivalent |
|---|---|---|
| `$select` | `$select=Id,Name,Balance` | `SELECT "Id", "Name", "Balance" FROM ...` |
| `$filter` (relational) | `$filter=Balance gt 500.0 and IsVip eq true` | `WHERE ("Balance" > ? AND "IsVip" = ?)` |
| `$filter` (strings) | `$filter=contains(Email, '@corp.com')` | `WHERE (INSTR("Email", ?) > 0)` |
| `$filter` (prefix) | `$filter=startswith(Name, 'Dr.')` | `WHERE (INSTR("Name", ?) = 1)` |
| `$filter` (suffix) | `$filter=endswith(Email, '.org')` | `WHERE ("Email" LIKE ('%' \|\| ?))` |
| `$filter` (nulls) | `$filter=Email ne null and City eq null` | `WHERE ("Email" IS NOT NULL AND "City" IS NULL)` |
| `$orderby` | `$orderby=Balance desc, Name asc` | `ORDER BY "Balance" DESC, "Name" ASC` |
| `$top` | `$top=25` | `LIMIT ?` (capped to `MAX_PAGE_SIZE`) |
| `$skip` | `$skip=50` | `OFFSET ?` |
| `$count` | `$count=true` | Inlines `"@odata.count": 142` in envelope |

---

### Single Entity Queries

Retrieve a specific row by primary key using standard OData parenthesis syntax or REST-style slash syntax:

- `GET /odata/Customers(1)`
- `GET /odata/Customers('ALFKI')`
- `GET /odata/Customers/1`

**Response:**
```json
{
  "@odata.context": "https://gateway.example.com/odata/$metadata#Customers/$entity",
  "Id": 1,
  "Name": "Alice Johnson",
  "Email": "alice@corp.com",
  "IsVip": true,
  "Balance": 1450.75
}
```

---

### Count Queries

Retrieve the total record count matching a filter as plain text:

- **Request**: `GET /odata/Customers/$count?$filter=IsVip eq true`
- **Response Header**: `Content-Type: text/plain;charset=utf-8`
- **Response Body**:
```
42
```

---

### Pagination & NextLink

When the number of returned records satisfies the requested `$top` limit, `@odata.nextLink` is automatically included with all search filters preserved and `$skip` incremented:

- **Request**: `GET /odata/Customers?$filter=IsVip eq true&$top=2`
- **Response**:
```json
{
  "@odata.context": "https://gateway.example.com/odata/$metadata#Customers",
  "@odata.nextLink": "https://gateway.example.com/odata/Customers?$filter=IsVip+eq+true&$skip=2&$top=2",
  "value": [
    { "Id": 1, "Name": "Alice Johnson", "IsVip": true },
    { "Id": 3, "Name": "Charlie Brown", "IsVip": true }
  ]
}
```

---

## 💻 Client Integration

### cURL

```bash
# 1. Fetch Service Document
curl -u admin:password123 https://gateway.example.com/odata

# 2. Fetch Schema Metadata
curl -u admin:password123 https://gateway.example.com/odata/\$metadata

# 3. Query filtered and sorted records with pagination
curl -u admin:password123 \
  "https://gateway.example.com/odata/Customers?\$filter=Balance%20gt%201000&\$orderby=Balance%20desc&\$top=10&\$count=true"
```

---

### Power BI / Power Query

1. Open **Power BI Desktop**.
2. Click **Get Data** > **OData feed**.
3. In the URL field, enter your gateway service root:
   ```
   https://<your-worker-subdomain>.workers.dev/odata
   ```
4. When prompted for authentication:
   - Select **Basic** on the left menu.
   - Enter your `BASIC_AUTH_USER` (e.g., `admin`).
   - Enter your `BASIC_AUTH_PASS`.
   - Set the level to the root URL.
5. Click **Connect**. Power BI will read `$metadata` and display all D1 database tables in the **Navigator** pane with automated relationship detection and query delegation.

---

### Postman

1. Create a new collection.
2. Under the **Authorization** tab, select **Basic Auth**.
3. Set **Username** and **Password**.
4. Send requests to `{{base_url}}/odata/TableName`.

---

## 🛠 Local Development & Testing

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Local Secrets
Copy the sample variables file:
```bash
cp .dev.vars.example .dev.vars
```
Edit `.dev.vars` with your local development credentials:
```ini
BASIC_AUTH_PASS=admin123
```

### 3. Initialize Local D1 Database
Execute the included sample schema against your local SQLite database:
```bash
npm run db:init:local
```

### 4. Run Automated Test Suite
Run the 25+ automated integration and unit tests:
```bash
npm test
```

### 5. Type-Check
Ensure TypeScript has zero compiler errors:
```bash
npm run typecheck
```

### 6. Start Local Development Server
```bash
npm run dev
```

The gateway will be available at `http://localhost:8787/odata`.

---

## 🚀 Deployment Instructions

### Step 1: Create a Cloudflare D1 Database
If you do not have an existing D1 database, create one with the Wrangler CLI:
```bash
npx wrangler d1 create d1-odata-db
```
Wrangler will output the configuration snippet, for example:
```toml
[[d1_databases]]
binding = "DB"
database_name = "d1-odata-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### Step 2: Update `wrangler.toml`
Paste your `database_name` and `database_id` into `wrangler.toml`.

### Step 3: Populate Database Schema (Optional)
If deploying initial tables and seed data to your remote Cloudflare database:
```bash
npm run db:init:remote
```

### Step 4: Configure the Production Password Secret
Store your gateway password securely in Cloudflare Secret storage:
```bash
npx wrangler secret put BASIC_AUTH_PASS
```
*(Enter your chosen strong password when prompted).*

### Step 5: Deploy the Worker
Deploy your OData gateway to Cloudflare's global edge network:
```bash
npm run deploy
```

Your OData gateway is live and ready for production consumption!

---

## 📄 License

MIT License. Designed and implemented for high-throughput, enterprise-grade Cloudflare D1 deployments.
