-- Sample schema for testing OData D1 Gateway

CREATE TABLE IF NOT EXISTS Customers (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Email TEXT UNIQUE,
    City TEXT,
    IsVip BOOLEAN DEFAULT 0,
    Balance REAL DEFAULT 0.0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Products (
    ProductId INTEGER PRIMARY KEY AUTOINCREMENT,
    Title TEXT NOT NULL,
    Category TEXT,
    Price REAL NOT NULL,
    StockQuantity INTEGER DEFAULT 0,
    IsActive BOOLEAN DEFAULT 1
);

CREATE TABLE IF NOT EXISTS Orders (
    OrderId INTEGER PRIMARY KEY AUTOINCREMENT,
    CustomerId INTEGER NOT NULL,
    TotalAmount REAL NOT NULL,
    Status TEXT DEFAULT 'Pending',
    OrderDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CustomerId) REFERENCES Customers(Id)
);

-- Seed Data
INSERT OR IGNORE INTO Customers (Id, Name, Email, City, IsVip, Balance) VALUES
(1, 'Alice Johnson', 'alice@corp.com', 'New York', 1, 1450.75),
(2, 'Bob Smith', 'bob@example.com', 'London', 0, 320.00),
(3, 'Charlie Brown', 'charlie@peanuts.com', 'São Paulo', 1, 4890.50),
(4, 'Diana Prince', 'diana@amazon.com', 'Themyscira', 0, 75.25),
(5, 'Edward Norton', 'edward@cinema.com', 'Boston', 0, 500.00);

INSERT OR IGNORE INTO Products (ProductId, Title, Category, Price, StockQuantity, IsActive) VALUES
(1, 'Ergonomic Mechanical Keyboard', 'Electronics', 129.99, 45, 1),
(2, 'UltraWide Gaming Monitor 34"', 'Electronics', 499.50, 12, 1),
(3, 'Noise-Cancelling Wireless Headphones', 'Audio', 199.00, 30, 1),
(4, 'Standing Desk Converter', 'Furniture', 249.90, 8, 1),
(5, 'USB-C Multi-Port Hub', 'Accessories', 39.99, 120, 1);

INSERT OR IGNORE INTO Orders (OrderId, CustomerId, TotalAmount, Status) VALUES
(1001, 1, 629.49, 'Completed'),
(1002, 1, 39.99, 'Shipped'),
(1003, 2, 199.00, 'Pending'),
(1004, 3, 749.40, 'Completed'),
(1005, 4, 129.99, 'Cancelled');
