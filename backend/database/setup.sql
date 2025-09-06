
-- Enable spatial extensions (if not already enabled)
INSTALL SONAME 'ha_spatial';
INSTALL SONAME 'libgeom.so';

-- Create users table with spatial support
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('user', 'admin', 'guardian') DEFAULT 'user',
    location GEOMETRY SRID 4326,
    isActive BOOLEAN DEFAULT TRUE,
    lastSeen DATETIME,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    SPATIAL INDEX (location)
);

-- Create location_updates table
CREATE TABLE IF NOT EXISTS location_updates (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    userId INT UNSIGNED NOT NULL,
    destination VARCHAR(255),
    startLocationLat DECIMAL(10, 8),
    startLocationLng DECIMAL(11, 8),
    startLocationAddress VARCHAR(255),
    currentLocationLat DECIMAL(10, 8),
    currentLocationLng DECIMAL(11, 8),
    currentLocationAddress VARCHAR(255),
    currentLocationTimestamp DATETIME,
    eta INT NOT NULL,
    checkInInterval INT DEFAULT 5,
    progress INT DEFAULT 0,
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    trustedContacts JSON,
    notes TEXT,
    startedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    completedAt DATETIME,
    cancelledAt DATETIME,
    routePolyline TEXT,
    routeDistance INT,
    routeDuration INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    INDEX (userId, status),
    INDEX (status, createdAt),
    CHECK (progress >= 0 AND progress <= 100)
);

-- Insert sample data for testing
INSERT INTO users (name, email, password, phone, role, location) VALUES
('Alice Johnson', 'alice@example.com', 'hashed_password1', '+60123456789', 'user', ST_GeomFromText('POINT(101.6869 3.1390)')),
('Bob Lee', 'bob@example.com', 'hashed_password2', '+60198765432', 'user', ST_GeomFromText('POINT(101.6868 3.1391)')),
('Guardian Smith', 'guardian@example.com', 'hashed_password3', '+60111223344', 'guardian', ST_GeomFromText('POINT(101.6870 3.1392)'));

INSERT INTO location_updates (userId, destination, currentLocationLat, currentLocationLng, eta, status) VALUES
(1, 'Home', 3.1390, 101.6869, 15, 'active'),
(2, 'Office', 3.1391, 101.6868, 30, 'active');