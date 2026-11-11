<div align="center">

# 🗄️ D1Sheet

**Turn your Cloudflare D1 database into an instant, serverless OData API for Google AppSheet, Power BI, Excel, and enterprise tools.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020.svg?style=flat-square&logo=cloudflare)](https://workers.cloudflare.com/)
[![Cloudflare D1](https://img.shields.io/badge/Database-Cloudflare%20D1-orange.svg?style=flat-square&logo=sqlite)](https://developers.cloudflare.com/d1/)
[![OData v4](https://img.shields.io/badge/Protocol-OData%20v4.0-0078D4.svg?style=flat-square)](https://www.odata.org/)
[![Tests Passing](https://img.shields.io/badge/Tests-33%2F33%20Passing-success.svg?style=flat-square)]()
[![License MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

<br/>

[![Visit Project Website & Simulator](https://img.shields.io/badge/🌐_Project_Website_%26_Interactive_Simulator-Open_Site-F38020?style=for-the-badge)](https://vieirafabiog.github.io/D1Sheet/)

<p align="center">
  <a href="https://vieirafabiog.github.io/D1Sheet/"><strong>🌐 Website & Simulator</strong></a> •
  <a href="#-why-d1sheet">Why D1Sheet?</a> •
  <a href="#-how-it-works">How It Works</a> •
  <a href="#-zero-to-live-in-5-minutes">5-Minute Deploy</a> •
  <a href="#-connecting-to-google-appsheet">AppSheet Setup</a> •
  <a href="#-connecting-to-power-bi--excel">Power BI & Excel</a> •
  <a href="#-api-reference">API Reference</a> •
  <a href="#-local-development">Local Dev</a>
</p>

</div>

> [!TIP]
> **🌐 Official Project Website & Live OData-to-SQLite Simulator:** **[https://vieirafabiog.github.io/D1Sheet/](https://vieirafabiog.github.io/D1Sheet/)** *(Available in English & Portuguese)*

---

## 💡 Why D1Sheet?

### The Problem
[Google AppSheet](https://about.appsheet.com/) is hands-down one of the best no-code platforms for building mobile and web apps. But when your app outgrows basic spreadsheets, storing production data presents a dilemma:
- **Google Sheets** slows down significantly once you hit a few thousand rows and doesn't offer relational integrity or concurrency.
- **Traditional SQL (PostgreSQL, MySQL, SQL Server)** requires running servers 24/7, paying for idle database instances, managing static IPs, and opening firewall ports to Google Cloud.
- **Cloudflare D1** is the holy grail: a globally distributed, serverless SQLite database with blistering edge performance and an incredible free tier (5 million reads/day for free). However, D1 has no direct TCP database port — it only speaks HTTP via Cloudflare's Edge. AppSheet cannot connect directly to D1.

### The Breakthrough
AppSheet has native, first-class support for the enterprise **OData protocol**!

### The Solution: D1Sheet
**D1Sheet** is the missing bridge. Running as an ultra-fast Cloudflare Worker, it transforms your Cloudflare D1 database into an authentic, production-ready **OData v4 gateway**.

Now, AppSheet connects directly to D1 with zero hassle, instant synchronization, and enterprise security.

> **Note:** While created with AppSheet in mind, **D1Sheet is a 100% standard OData v4 gateway**. You can connect it to **Microsoft Power BI**, **Excel (Power Query)**, **Tableau**, **SAP**, **Zapier**, or any custom client!

---

## 🏗 How It Works

```
┌────────────────────────────────────────────────────────┐
│               Clients & Consumers                      │
│                                                        │
│  📱 Google AppSheet   📊 Power BI / Excel   🌐 REST    │
└───────────────────────────┬────────────────────────────┘
                            │
                            │ HTTPS (Basic Auth)
                            │ Standard OData v4 URL Parameters
                            ▼
┌────────────────────────────────────────────────────────┐
│           🗄️ D1Sheet (Cloudflare Worker)               │
│                                                        │
│  🔒 Timing-Safe HTTP Basic Authentication              │
│  🔍 Dynamic Schema Introspection ($metadata EDMX)      │
│  🛡️ OData AST Parser (zero SQL injection risks)         │
│  ⚙️ Parameterized SQLite Compiler                      │
│  📄 Automatic Pagination & NextLink Calculation        │
└───────────────────────────┬────────────────────────────┘
                            │
                            │ Native Fast Worker Binding
                            ▼
┌────────────────────────────────────────────────────────┐
│       🗄️ Cloudflare D1 (Serverless SQLite Engine)      │
└────────────────────────────────────────────────────────┘
```

1. **Client sends an OData request** (e.g. `GET /odata/Customers?$filter=Balance gt 1000&$top=25`).
2. **D1Sheet validates credentials** using constant-time crypto comparison to prevent timing attacks.
3. **The AST Query Parser** parses filters, select clauses, order rules, and pagination.
4. **Parameterized SQL Compiler** generates safe SQLite statements (`SELECT ... WHERE "Balance" > ? LIMIT ? OFFSET ?`).
5. **D1 executes the query** directly on Cloudflare's edge network in single-digit milliseconds.
6. **D1Sheet formats the response** into standard OData JSON with `@odata.context` and `@odata.nextLink`.

---

## 🚀 Zero to Live in 5 Minutes

Deploy your own live OData gateway to Cloudflare with 6 straightforward steps.

### Prerequisites
- Node.js 18+ installed.
- A free [Cloudflare Account](https://dash.cloudflare.com/sign-up).

---

### Step 1: Clone and Install
```bash
git clone https://github.com/vieirafabiog/D1Sheet.git
cd D1Sheet
npm install
```

### Step 2: Create your Cloudflare D1 Database
Log in to Cloudflare through Wrangler CLI (only needed once):
```bash
npx wrangler login
```
Create a new D1 database:
```bash
npx wrangler d1 create d1sheet-db
```
Wrangler will output something like:
```toml
[[d1_databases]]
binding = "DB"
database_name = "d1sheet-db"
database_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

### Step 3: Configure `wrangler.toml`
Open `wrangler.toml` and update the `database_name` and `database_id` with the values printed in Step 2:
```toml
name = "d1sheet"
main = "src/index.ts"
compatibility_date = "2024-09-23"

[[d1_databases]]
binding = "DB"
database_name = "d1sheet-db"
database_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

[vars]
ODATA_SERVICE_ROOT = "/odata"
DEFAULT_PAGE_SIZE = "100"
MAX_PAGE_SIZE = "1000"
BASIC_AUTH_USER = "admin"
```

### Step 4: Seed Sample Tables (Optional)
We included a clean sample schema (`schema.sql`) with `Customers`, `Products`, and `Orders` tables:
```bash
npm run db:init:remote
```
*(You can also run your own `.sql` migration files using `npx wrangler d1 execute DB --remote --file=your_schema.sql`)*.

### Step 5: Set Your Production Password
Store your gateway password securely in Cloudflare Secrets:
```bash
npx wrangler secret put BASIC_AUTH_PASS
```
Type your strong password when prompted and press Enter.

### Step 6: Deploy!
```bash
npm run deploy
```

🎉 **That's it!** Wrangler will output your live URL:
```
https://d1sheet.<your-subdomain>.workers.dev
```
Your OData service root is live at:
```
https://d1sheet.<your-subdomain>.workers.dev/odata
```

---

## 📱 Connecting to Google AppSheet

Connect AppSheet to your new D1 database in under 2 minutes:

### 1. Add Data Source in AppSheet
1. Open your [AppSheet Account](https://www.appsheet.com/account).
2. Go to the **Integrations** / **Sources** tab.
3. Click **+ New Data Source**.
4. Choose **OData** from the list of connectors.

<div align="center">
  <kbd><img src="https://raw.githubusercontent.com/fabiovier/assets/main/appsheet-odata-icon.png" width="80" alt="AppSheet OData" onerror="this.style.display='none'"/></kbd>
</div>

### 2. Enter Connection Details
Fill in the connection form with your D1Sheet information:

| Setting | Value |
|---|---|
| **Source Name** | `Cloudflare D1` (or any label you prefer) |
| **OData Service Root URL** | `https://d1sheet.<your-subdomain>.workers.dev/odata` |
| **Authentication Type** | `Basic` |
| **Username** | `admin` (or the value set in `BASIC_AUTH_USER`) |
| **Password** | Your `BASIC_AUTH_PASS` secret |
| **OData Version** | `OData v4.0` |

### 3. Build Your App!
1. Create a new AppSheet app or open an existing one.
2. In the app editor, navigate to **Data** > **Tables** > **+ Add Table**.
3. Select your **Cloudflare D1** data source.
4. AppSheet will read `$metadata` and display all tables (`Customers`, `Products`, `Orders`, etc.).
5. Click **Add Table**. AppSheet automatically detects:
   - Primary Keys (`Key` columns).
   - Column data types (Numbers, Text, Booleans, Dates).
   - Read/Write capabilities.

You now have a real-time, low-latency mobile and desktop app backed directly by Cloudflare D1! 🚀

---

## 📊 Connecting to Power BI & Excel

D1Sheet supports full OData query delegation in Microsoft tools.

### Microsoft Power BI
1. In Power BI Desktop, click **Get Data** > **OData feed**.
2. Enter the URL:
   ```
   https://d1sheet.<your-subdomain>.workers.dev/odata
   ```
3. Select **Basic** authentication and input your username (`admin`) and secret password.
4. Click **Connect**. Power BI will display all tables with schemas, types, and relationships.
5. All Power BI visual filters and queries will be translated into edge SQL queries on D1!

### Microsoft Excel (Power Query)
1. Go to the **Data** tab > **Get Data** > **From Other Sources** > **From OData Feed**.
2. Paste `https://d1sheet.<your-subdomain>.workers.dev/odata`.
3. Provide Basic Auth credentials and click **Load**.

---

## 📚 API Reference & Supported Queries

All endpoints (except CORS preflights) require the `Authorization: Basic <base64>` header.

### 1. Service Document (Discovery)
Lists all available database tables.
```http
GET /odata
```
```json
{
  "@odata.context": "https://d1sheet.workers.dev/odata/$metadata",
  "value": [
    { "name": "Customers", "kind": "EntitySet", "url": "Customers" },
    { "name": "Products", "kind": "EntitySet", "url": "Products" },
    { "name": "Orders", "kind": "EntitySet", "url": "Orders" }
  ]
}
```

### 2. Schema Metadata (`$metadata`)
Dynamically generates standard OData EDMX XML schema from SQLite table definitions:
```http
GET /odata/$metadata
```

### 3. Querying Records
```http
GET /odata/{TableName}
```

#### Supported Query Parameters

| Parameter | Example | SQLite Translation |
|---|---|---|
| **`$select`** | `?$select=Id,Name,Balance` | `SELECT "Id", "Name", "Balance" FROM ...` |
| **`$filter` (Relational)** | `?$filter=Balance ge 1000 and IsVip eq true` | `WHERE ("Balance" >= ? AND "IsVip" = ?)` |
| **`$filter` (Null Checks)** | `?$filter=Email ne null and City eq null` | `WHERE ("Email" IS NOT NULL AND "City" IS NULL)` |
| **`$filter` (Functions)** | `?$filter=contains(Email, '@corp.com')` | `WHERE (INSTR("Email", ?) > 0)` |
| **`$filter` (Prefix/Suffix)** | `?$filter=startswith(Name, 'Dr.')` | `WHERE (INSTR("Name", ?) = 1)` |
| **`$filter` (Case Fold)** | `?$filter=tolower(City) eq 'london'` | `WHERE (LOWER("City") = ?)` |
| **`$orderby`** | `?$orderby=Balance desc, Name asc` | `ORDER BY "Balance" DESC, "Name" ASC` |
| **`$top`** | `?$top=20` | `LIMIT ?` (capped to `MAX_PAGE_SIZE`) |
| **`$skip`** | `?$skip=40` | `OFFSET ?` |
| **`$count`** | `?$count=true` | Appends `"@odata.count": 128` |

### 4. Single Record by Key
Supports both standard OData parenthesis syntax and REST slash syntax:
```http
GET /odata/Customers(1)
GET /odata/Customers(Id=1)
GET /odata/Customers('CUST-001')
GET /odata/Customers/1
```

### 5. Creating Records (POST — AppSheet Adds)
Inserts a new record into the SQLite database. Supports Cloudflare D1's native `RETURNING *` to immediately provide generated IDs and default values:

- **Request**: `POST /odata/Customers`
- **Headers**:
  ```http
  Content-Type: application/json
  Authorization: Basic <credentials>
  ```
- **Body**:
  ```json
  {
    "Name": "Diana Prince",
    "Email": "diana@amazon.com",
    "IsVip": true,
    "Balance": 1250.00
  }
  ```
- **Response**: `201 Created`
- **Response Headers**:
  - `Location: https://d1sheet.workers.dev/odata/Customers(5)`
  - `Preference-Applied: return=representation`
- **Response Body**:
  ```json
  {
    "@odata.context": "https://d1sheet.workers.dev/odata/$metadata#Customers/$entity",
    "Id": 5,
    "Name": "Diana Prince",
    "Email": "diana@amazon.com",
    "IsVip": true,
    "Balance": 1250.0,
    "CreatedAt": "2024-01-15T10:00:00Z"
  }
  ```

### 6. Updating Records (PATCH / PUT — AppSheet Updates)
Updates specific columns of an existing record:

- **Request**: `PATCH /odata/Customers(5)` or `PATCH /odata/Customers(Id=5)`
- **Body**:
  ```json
  {
    "Balance": 1800.50,
    "IsVip": false
  }
  ```
- **Response**: `200 OK` with updated entity representation.

### 7. Deleting Records (DELETE — AppSheet Deletes)
Removes the record identified by its primary key:

- **Request**: `DELETE /odata/Customers(5)` or `DELETE /odata/Customers/5`
- **Response**: `204 No Content`

### 8. Raw Count Endpoint
Returns matching record count in `text/plain`:
```http
GET /odata/Customers/$count?$filter=IsVip eq true
```

### 9. Automatic Pagination (`@odata.nextLink`)
When a query returns a full page of records, D1Sheet automatically attaches `@odata.nextLink` containing the preserved filters and incremented offset:
```json
{
  "@odata.context": "https://d1sheet.workers.dev/odata/$metadata#Customers",
  "@odata.nextLink": "https://d1sheet.workers.dev/odata/Customers?$filter=IsVip+eq+true&$skip=25&$top=25",
  "value": [ ... ]
}
```

---

## 💻 cURL Examples

```bash
# Get service document
curl -u admin:password123 https://d1sheet.workers.dev/odata

# Fetch schema XML
curl -u admin:password123 https://d1sheet.workers.dev/odata/\$metadata

# Filtered and sorted query with count and limit
curl -u admin:password123 \
  "https://d1sheet.workers.dev/odata/Customers?\$filter=Balance%20gt%20500&\$orderby=Balance%20desc&\$top=10&\$count=true"

# Query single entity by ID
curl -u admin:password123 https://d1sheet.workers.dev/odata/Customers(1)
```

---

## 🛠 Local Development & Testing

You can develop, modify, and test D1Sheet 100% locally on your machine without even touching Cloudflare servers.

### 1. Set Up Local Secrets
```bash
cp .dev.vars.example .dev.vars
```
Inside `.dev.vars`, define your local password:
```ini
BASIC_AUTH_PASS=admin123
```

### 2. Populate Local SQLite Database
```bash
npm run db:init:local
```
This executes `schema.sql` against `.wrangler/state/v3/d1` on your local filesystem.

### 3. Run the Automated Test Suite
Run the 25 built-in unit and integration tests:
```bash
npm test
```

### 4. Type Check
Verify TypeScript typing:
```bash
npm run typecheck
```

### 5. Start the Local Server
```bash
npm run dev
```
Your local gateway is ready at `http://localhost:8787/odata`!

---

## 🔒 Security Best Practices

- **Constant-Time Comparison**: D1Sheet uses SHA-256 byte hashing and bitwise XOR to verify Basic Auth credentials without leaking password length or timing info.
- **SQL Injection Proof**: Every literal value in `$filter` is strictly parameterized as a positional SQLite argument (`?`).
- **Identifier Whitelisting**: Table and column names are checked against `/^[a-zA-Z_][a-zA-Z0-9_]*$/` before inclusion in quotes.
- **DDoS & Scraping Protection**: Default page size (`100`) and maximum page size (`1000`) safeguard your worker memory and D1 read operations.

---

## 🗺 Roadmap

- [x] OData v4 Read Queries (`$filter`, `$select`, `$orderby`, `$top`, `$skip`, `$count`)
- [x] Dynamic EDMX `$metadata` Generation
- [x] Automatic `@odata.nextLink` pagination
- [x] Full Google AppSheet & Power BI Compatibility
- [x] OData v4 Write Operations (`POST`, `PATCH`, `PUT`, `DELETE`) with `RETURNING *`
- [ ] Multi-tenant database routing via headers or subpaths

---

## 📄 License

MIT License © 2026. Made with ❤️ for developers building with Cloudflare Workers and Google AppSheet.
