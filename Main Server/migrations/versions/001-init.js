'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "users", deps: []
 * createTable "uploaded_images", deps: []
 * createTable "audit_logs", deps: []
 * createTable "subscription_transactions", deps: []
 * createTable "vehicles", deps: [uploaded_images, uploaded_images, uploaded_images, uploaded_images, users]
 * createTable "driver_profiles", deps: [uploaded_images, uploaded_images, uploaded_images, uploaded_images, uploaded_images, users]
 * createTable "passenger_profiles", deps: [users]
 * createTable "trips", deps: [users, vehicles]
 * createTable "trip_attributes", deps: [trips]
 * createTable "trip_stops", deps: [trips]
 * createTable "bookings", deps: [users, trips]
 * createTable "ride_requests", deps: [users]
 * createTable "request_offers", deps: [users, trips, ride_requests]
 * createTable "ratings", deps: [users, users, bookings]
 * createTable "delay_events", deps: [bookings]
 * createTable "complaints", deps: [users, users]
 * createTable "penalties", deps: [users, complaints]
 * createTable "support_tickets", deps: [users]
 * createTable "notifications", deps: [users]
 * createTable "favorite_drivers", deps: [users, users]
 * createTable "favorite_routes", deps: [users]
 * addIndex "trip_attributes_trip_id_attr_key" to table "trip_attributes"
 * addIndex "favorite_drivers_passenger_id_driver_id" to table "favorite_drivers"
 * addIndex "favorite_routes_passenger_id_origin_city_destination_city" to table "favorite_routes"
 *
 **/

var info = {
    "revision": 1,
    "name": "init",
    "created": "2026-07-27T15:49:48.337Z",
    "comment": ""
};

var migrationCommands = [{
        fn: "createTable",
        params: [
            "users",
            {
                "id": {
                    "type": Sequelize.UUID,
                    "field": "id",
                    "primaryKey": true,
                    "defaultValue": Sequelize.UUIDV4
                },
                "fullName": {
                    "type": Sequelize.STRING(120),
                    "field": "full_name",
                    "allowNull": true
                },
                "countryCode": {
                    "type": Sequelize.STRING(5),
                    "field": "country_code",
                    "allowNull": true
                },
                "phone": {
                    "type": Sequelize.STRING(20),
                    "field": "phone",
                    "unique": true,
                    "allowNull": false
                },
                "email": {
                    "type": Sequelize.STRING(160),
                    "field": "email",
                    "unique": true,
                    "allowNull": true
                },
                "role": {
                    "type": Sequelize.ENUM('passenger', 'driver', 'admin', 'support', 'moderator'),
                    "field": "role",
                    "allowNull": false
                },
                "gender": {
                    "type": Sequelize.ENUM('male', 'female'),
                    "field": "gender",
                    "defaultValue": "male",
                    "allowNull": true
                },
                "passwordHash": {
                    "type": Sequelize.STRING(255),
                    "field": "password_hash",
                    "allowNull": false
                },
                "age": {
                    "type": Sequelize.DECIMAL(3),
                    "field": "age",
                    "allowNull": true
                },
                "avatarUrl": {
                    "type": Sequelize.TEXT,
                    "field": "avatar_url",
                    "allowNull": true
                },
                "isVerified": {
                    "type": Sequelize.BOOLEAN,
                    "field": "is_verified",
                    "defaultValue": false,
                    "allowNull": false
                },
                "avgRating": {
                    "type": Sequelize.DECIMAL(2, 1),
                    "field": "avg_rating",
                    "defaultValue": 0
                },
                "strikes": {
                    "type": Sequelize.SMALLINT,
                    "field": "strikes",
                    "defaultValue": 0,
                    "allowNull": false
                },
                "locale": {
                    "type": Sequelize.STRING(5),
                    "field": "locale",
                    "defaultValue": "ar",
                    "allowNull": false
                },
                "status": {
                    "type": Sequelize.ENUM('active', 'warned', 'suspended', 'banned'),
                    "field": "status",
                    "defaultValue": "active",
                    "allowNull": false
                },
                "fcmToken": {
                    "type": Sequelize.TEXT,
                    "field": "fcm_token",
                    "allowNull": true
                },
                "lastLoginAt": {
                    "type": Sequelize.DATE,
                    "field": "last_login_at",
                    "allowNull": true
                },
                "createdat": {
                    "type": Sequelize.DATE,
                    "field": "createdat",
                    "allowNull": false
                },
                "updatedat": {
                    "type": Sequelize.DATE,
                    "field": "updatedat",
                    "allowNull": false
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "uploaded_images",
            {
                "id": {
                    "type": Sequelize.INTEGER,
                    "field": "id",
                    "primaryKey": true,
                    "autoIncrement": true
                },
                "hash": {
                    "type": Sequelize.STRING(64),
                    "field": "hash",
                    "unique": true,
                    "allowNull": false
                },
                "url": {
                    "type": Sequelize.TEXT,
                    "field": "url",
                    "allowNull": false
                },
                "filename": {
                    "type": Sequelize.TEXT,
                    "field": "filename",
                    "allowNull": false
                },
                "mimetype": {
                    "type": Sequelize.TEXT,
                    "field": "mimetype",
                    "allowNull": false
                },
                "size": {
                    "type": Sequelize.INTEGER,
                    "field": "size",
                    "allowNull": true
                },
                "provider": {
                    "type": Sequelize.TEXT,
                    "field": "provider",
                    "allowNull": true
                },
                "createdat": {
                    "type": Sequelize.DATE,
                    "field": "createdat",
                    "allowNull": false
                },
                "updatedat": {
                    "type": Sequelize.DATE,
                    "field": "updatedat",
                    "allowNull": false
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "audit_logs",
            {
                "id": {
                    "type": Sequelize.UUID,
                    "field": "id",
                    "primaryKey": true,
                    "defaultValue": Sequelize.UUIDV4
                },
                "tableName": {
                    "type": Sequelize.STRING(50),
                    "field": "table_name",
                    "allowNull": false
                },
                "recordId": {
                    "type": Sequelize.UUID,
                    "field": "record_id",
                    "allowNull": false
                },
                "action": {
                    "type": Sequelize.ENUM('INSERT', 'UPDATE', 'DELETE'),
                    "field": "action",
                    "allowNull": false
                },
                "oldData": {
                    "type": Sequelize.JSONB,
                    "field": "old_data",
                    "allowNull": true
                },
                "newData": {
                    "type": Sequelize.JSONB,
                    "field": "new_data",
                    "allowNull": true
                },
                "performedBy": {
                    "type": Sequelize.UUID,
                    "field": "performed_by",
                    "allowNull": true
                },
                "ipAddress": {
                    "type": Sequelize.INET,
                    "field": "ip_address",
                    "allowNull": true
                },
                "userAgent": {
                    "type": Sequelize.TEXT,
                    "field": "user_agent",
                    "allowNull": true
                },
                "createdat": {
                    "type": Sequelize.DATE,
                    "field": "createdat",
                    "allowNull": false
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "subscription_transactions",
            {
                "id": {
                    "type": Sequelize.UUID,
                    "field": "id",
                    "primaryKey": true,
                    "defaultValue": Sequelize.UUIDV4
                },
                "driverId": {
                    "type": Sequelize.UUID,
                    "field": "driver_id",
                    "allowNull": false
                },
                "tier": {
                    "type": Sequelize.STRING(20),
                    "field": "tier",
                    "allowNull": false
                },
                "amount": {
                    "type": Sequelize.DECIMAL(10, 2),
                    "field": "amount",
                    "allowNull": false
                },
                "currency": {
                    "type": Sequelize.STRING(3),
                    "field": "currency",
                    "defaultValue": "JOD",
                    "allowNull": true
                },
                "paymentMethod": {
                    "type": Sequelize.STRING(20),
                    "field": "payment_method",
                    "allowNull": false
                },
                "status": {
                    "type": Sequelize.STRING(15),
                    "field": "status",
                    "defaultValue": "pending",
                    "allowNull": true
                },
                "providerTransactionId": {
                    "type": Sequelize.STRING(255),
                    "field": "provider_transaction_id",
                    "allowNull": true
                },
                "expiresAt": {
                    "type": Sequelize.DATE,
                    "field": "expires_at",
                    "allowNull": false
                },
                "createdat": {
                    "type": Sequelize.DATE,
                    "field": "createdat",
                    "allowNull": false
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "vehicles",
            {
                "id": {
                    "type": Sequelize.UUID,
                    "field": "id",
                    "primaryKey": true,
                    "defaultValue": Sequelize.UUIDV4
                },
                "driverId": {
                    "type": Sequelize.UUID,
                    "field": "driver_id",
                    "allowNull": false
                },
                "manufacturer": {
                    "type": Sequelize.STRING(80),
                    "field": "manufacturer",
                    "allowNull": false
                },
                "model": {
                    "type": Sequelize.STRING(80),
                    "field": "model",
                    "allowNull": false
                },
                "vehicleType": {
                    "type": Sequelize.ENUM('sedan', 'suv', 'van', 'bus', 'hatchback'),
                    "field": "vehicle_type",
                    "allowNull": false
                },
                "modelYear": {
                    "type": Sequelize.SMALLINT,
                    "field": "model_year",
                    "allowNull": true
                },
                "plateNumber": {
                    "type": Sequelize.STRING(20),
                    "field": "plate_number",
                    "unique": true,
                    "allowNull": false
                },
                "codeNumber": {
                    "type": Sequelize.STRING(20),
                    "field": "code_number",
                    "allowNull": true
                },
                "color": {
                    "type": Sequelize.STRING(30),
                    "field": "color",
                    "allowNull": true
                },
                "seats": {
                    "type": Sequelize.SMALLINT,
                    "field": "seats",
                    "allowNull": false
                },
                "registrationDocFront": {
                    "type": Sequelize.INTEGER,
                    "field": "registration_doc_front",
                    "references": {
                        "model": "uploaded_images",
                        "key": "id"
                    },
                    "allowNull": true
                },
                "registrationDocBack": {
                    "type": Sequelize.INTEGER,
                    "field": "registration_doc_back",
                    "references": {
                        "model": "uploaded_images",
                        "key": "id"
                    },
                    "allowNull": true
                },
                "vehiclePhotoFront": {
                    "type": Sequelize.INTEGER,
                    "field": "vehicle_photo_front",
                    "references": {
                        "model": "uploaded_images",
                        "key": "id"
                    },
                    "allowNull": true
                },
                "vehiclePhotoBack": {
                    "type": Sequelize.INTEGER,
                    "field": "vehicle_photo_back",
                    "references": {
                        "model": "uploaded_images",
                        "key": "id"
                    },
                    "allowNull": true
                },
                "isVerified": {
                    "type": Sequelize.BOOLEAN,
                    "field": "is_verified",
                    "defaultValue": false,
                    "allowNull": false
                },
                "verificationNotes": {
                    "type": Sequelize.TEXT,
                    "field": "verification_notes",
                    "allowNull": true
                },
                "verifiedBy": {
                    "type": Sequelize.UUID,
                    "field": "verified_by",
                    "allowNull": true
                },
                "verifiedAt": {
                    "type": Sequelize.DATE,
                    "field": "verified_at",
                    "allowNull": true
                },
                "createdat": {
                    "type": Sequelize.DATE,
                    "field": "createdat",
                    "allowNull": false
                },
                "updatedat": {
                    "type": Sequelize.DATE,
                    "field": "updatedat",
                    "allowNull": false
                },
                "driver_id": {
                    "type": Sequelize.UUID,
                    "field": "driver_id",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "users",
                        "key": "id"
                    },
                    "allowNull": true
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "driver_profiles",
            {
                "id": {
                    "type": Sequelize.UUID,
                    "field": "id",
                    "primaryKey": true,
                    "defaultValue": Sequelize.UUIDV4
                },
                "driverId": {
                    "type": Sequelize.UUID,
                    "field": "driver_id",
                    "unique": true,
                    "allowNull": false
                },
                "userIdentificationFront": {
                    "type": Sequelize.INTEGER,
                    "field": "user_identification_front",
                    "references": {
                        "model": "uploaded_images",
                        "key": "id"
                    },
                    "allowNull": true
                },
                "userIdentificationBack": {
                    "type": Sequelize.INTEGER,
                    "field": "user_identification_back",
                    "references": {
                        "model": "uploaded_images",
                        "key": "id"
                    },
                    "allowNull": true
                },
                "linceseFront": {
                    "type": Sequelize.INTEGER,
                    "field": "lincese_front",
                    "references": {
                        "model": "uploaded_images",
                        "key": "id"
                    },
                    "allowNull": true
                },
                "linceseBack": {
                    "type": Sequelize.INTEGER,
                    "field": "lincese_back",
                    "references": {
                        "model": "uploaded_images",
                        "key": "id"
                    },
                    "allowNull": true
                },
                "personalImageWithId": {
                    "type": Sequelize.INTEGER,
                    "field": "personal_image_with_id",
                    "references": {
                        "model": "uploaded_images",
                        "key": "id"
                    },
                    "allowNull": true
                },
                "nationalID": {
                    "type": Sequelize.STRING(30),
                    "field": "national_i_d",
                    "allowNull": true
                },
                "idVerified": {
                    "type": Sequelize.BOOLEAN,
                    "field": "id_verified",
                    "defaultValue": false,
                    "allowNull": true
                },
                "licenseNumber": {
                    "type": Sequelize.STRING(50),
                    "field": "license_number",
                    "allowNull": true
                },
                "licenseExpiry": {
                    "type": Sequelize.DATEONLY,
                    "field": "license_expiry",
                    "allowNull": true
                },
                "subscriptionTier": {
                    "type": Sequelize.ENUM('free', 'pro_monthly', 'pro_annual'),
                    "field": "subscription_tier",
                    "defaultValue": "free",
                    "allowNull": true
                },
                "subscriptionExpiresAt": {
                    "type": Sequelize.DATE,
                    "field": "subscription_expires_at",
                    "allowNull": true
                },
                "totalTrips": {
                    "type": Sequelize.INTEGER,
                    "field": "total_trips",
                    "defaultValue": 0,
                    "allowNull": true
                },
                "totalEarnings": {
                    "type": Sequelize.DECIMAL(12, 2),
                    "field": "total_earnings",
                    "defaultValue": 0,
                    "allowNull": true
                },
                "responseRate": {
                    "type": Sequelize.DECIMAL(5, 2),
                    "field": "response_rate",
                    "defaultValue": 100,
                    "allowNull": true
                },
                "bio": {
                    "type": Sequelize.TEXT,
                    "field": "bio",
                    "allowNull": true
                },
                "createdat": {
                    "type": Sequelize.DATE,
                    "field": "createdat",
                    "allowNull": false
                },
                "updatedat": {
                    "type": Sequelize.DATE,
                    "field": "updatedat",
                    "allowNull": false
                },
                "driver_id": {
                    "type": Sequelize.UUID,
                    "field": "driver_id",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "users",
                        "key": "id"
                    },
                    "allowNull": true
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "passenger_profiles",
            {
                "id": {
                    "type": Sequelize.UUID,
                    "field": "id",
                    "primaryKey": true,
                    "defaultValue": Sequelize.UUIDV4
                },
                "passengerId": {
                    "type": Sequelize.UUID,
                    "field": "passenger_id",
                    "unique": true,
                    "allowNull": false
                },
                "preferredGender": {
                    "type": Sequelize.ENUM('male', 'female', 'any'),
                    "field": "preferred_gender",
                    "defaultValue": "any",
                    "allowNull": true
                },
                "smokingPreference": {
                    "type": Sequelize.ENUM('no_preference', 'non_smoking', 'smoking_allowed'),
                    "field": "smoking_preference",
                    "defaultValue": "no_preference",
                    "allowNull": true
                },
                "savedRoutes": {
                    "type": Sequelize.JSONB,
                    "field": "saved_routes",
                    "defaultValue": [],
                    "allowNull": true
                },
                "emergencyContacts": {
                    "type": Sequelize.JSONB,
                    "field": "emergency_contacts",
                    "defaultValue": [],
                    "allowNull": true
                },
                "createdat": {
                    "type": Sequelize.DATE,
                    "field": "createdat",
                    "allowNull": false
                },
                "updatedat": {
                    "type": Sequelize.DATE,
                    "field": "updatedat",
                    "allowNull": false
                },
                "passenger_id": {
                    "type": Sequelize.UUID,
                    "field": "passenger_id",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "users",
                        "key": "id"
                    },
                    "allowNull": true
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "trips",
            {
                "id": {
                    "type": Sequelize.UUID,
                    "field": "id",
                    "primaryKey": true,
                    "defaultValue": Sequelize.UUIDV4
                },
                "driverId": {
                    "type": Sequelize.UUID,
                    "field": "driver_id",
                    "allowNull": false
                },
                "vehicleId": {
                    "type": Sequelize.UUID,
                    "field": "vehicle_id",
                    "allowNull": false
                },
                "originCity": {
                    "type": Sequelize.STRING(80),
                    "field": "origin_city",
                    "allowNull": false
                },
                "originAddress": {
                    "type": Sequelize.STRING(255),
                    "field": "origin_address",
                    "allowNull": true
                },
                "originLat": {
                    "type": Sequelize.DECIMAL(10, 8),
                    "field": "origin_lat",
                    "allowNull": true
                },
                "originLng": {
                    "type": Sequelize.DECIMAL(11, 8),
                    "field": "origin_lng",
                    "allowNull": true
                },
                "destinationCity": {
                    "type": Sequelize.STRING(80),
                    "field": "destination_city",
                    "allowNull": false
                },
                "destinationAddress": {
                    "type": Sequelize.STRING(255),
                    "field": "destination_address",
                    "allowNull": true
                },
                "destinationLat": {
                    "type": Sequelize.DECIMAL(10, 8),
                    "field": "destination_lat",
                    "allowNull": true
                },
                "destinationLng": {
                    "type": Sequelize.DECIMAL(11, 8),
                    "field": "destination_lng",
                    "allowNull": true
                },
                "departureTime": {
                    "type": Sequelize.DATE,
                    "field": "departure_time",
                    "allowNull": false
                },
                "arrivalTime": {
                    "type": Sequelize.DATE,
                    "field": "arrival_time",
                    "allowNull": true
                },
                "totalSeats": {
                    "type": Sequelize.SMALLINT,
                    "field": "total_seats",
                    "allowNull": false
                },
                "availableSeats": {
                    "type": Sequelize.SMALLINT,
                    "field": "available_seats",
                    "allowNull": false
                },
                "farePerSeat": {
                    "type": Sequelize.DECIMAL(10, 2),
                    "field": "fare_per_seat",
                    "allowNull": false
                },
                "currency": {
                    "type": Sequelize.STRING(3),
                    "field": "currency",
                    "defaultValue": "JOD",
                    "allowNull": true
                },
                "isRecurring": {
                    "type": Sequelize.BOOLEAN,
                    "field": "is_recurring",
                    "defaultValue": false,
                    "allowNull": false
                },
                "recurrencePattern": {
                    "type": Sequelize.JSONB,
                    "field": "recurrence_pattern",
                    "allowNull": true
                },
                "status": {
                    "type": Sequelize.ENUM('published', 'full', 'ongoing', 'completed', 'cancelled'),
                    "field": "status",
                    "defaultValue": "published",
                    "allowNull": false
                },
                "isFeatured": {
                    "type": Sequelize.BOOLEAN,
                    "field": "is_featured",
                    "defaultValue": false,
                    "allowNull": true
                },
                "featuredUntil": {
                    "type": Sequelize.DATE,
                    "field": "featured_until",
                    "allowNull": true
                },
                "createdat": {
                    "type": Sequelize.DATE,
                    "field": "createdat",
                    "allowNull": false
                },
                "updatedat": {
                    "type": Sequelize.DATE,
                    "field": "updatedat",
                    "allowNull": false
                },
                "driver_id": {
                    "type": Sequelize.UUID,
                    "field": "driver_id",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "users",
                        "key": "id"
                    },
                    "allowNull": true
                },
                "is_moderated":{
                    "type": Sequelize.BOOLEAN,
                    "field": "is_moderated",
                    "defaultValue": false,
                    "allowNull": false
                },
                "vehicle_id": {
                    "type": Sequelize.UUID,
                    "field": "vehicle_id",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "vehicles",
                        "key": "id"
                    },
                    "allowNull": true
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "trip_attributes",
            {
                "id": {
                    "type": Sequelize.UUID,
                    "field": "id",
                    "primaryKey": true,
                    "defaultValue": Sequelize.UUIDV4
                },
                "tripId": {
                    "type": Sequelize.UUID,
                    "field": "trip_id",
                    "allowNull": false
                },
                "attrKey": {
                    "type": Sequelize.STRING(30),
                    "field": "attr_key",
                    "allowNull": false
                },
                "attrValue": {
                    "type": Sequelize.STRING(30),
                    "field": "attr_value",
                    "allowNull": false
                },
                "trip_id": {
                    "type": Sequelize.UUID,
                    "field": "trip_id",
                    "onUpdate": "CASCADE",
                    "onDelete": "CASCADE",
                    "references": {
                        "model": "trips",
                        "key": "id"
                    },
                    "allowNull": true
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "trip_stops",
            {
                "id": {
                    "type": Sequelize.UUID,
                    "field": "id",
                    "primaryKey": true,
                    "defaultValue": Sequelize.UUIDV4
                },
                "tripId": {
                    "type": Sequelize.UUID,
                    "field": "trip_id",
                    "allowNull": false
                },
                "stopOrder": {
                    "type": Sequelize.SMALLINT,
                    "field": "stop_order",
                    "allowNull": false
                },
                "city": {
                    "type": Sequelize.STRING(80),
                    "field": "city",
                    "allowNull": false
                },
                "address": {
                    "type": Sequelize.STRING(255),
                    "field": "address",
                    "allowNull": true
                },
                "lat": {
                    "type": Sequelize.DECIMAL(10, 8),
                    "field": "lat",
                    "allowNull": true
                },
                "lng": {
                    "type": Sequelize.DECIMAL(11, 8),
                    "field": "lng",
                    "allowNull": true
                },
                "stopType": {
                    "type": Sequelize.ENUM('pickup', 'dropoff', 'both'),
                    "field": "stop_type",
                    "allowNull": false
                },
                "estimatedArrival": {
                    "type": Sequelize.DATE,
                    "field": "estimated_arrival",
                    "allowNull": true
                },
                "createdat": {
                    "type": Sequelize.DATE,
                    "field": "createdat",
                    "allowNull": false
                },
                "trip_id": {
                    "type": Sequelize.UUID,
                    "field": "trip_id",
                    "onUpdate": "CASCADE",
                    "onDelete": "CASCADE",
                    "references": {
                        "model": "trips",
                        "key": "id"
                    },
                    "allowNull": true
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "bookings",
            {
                "id": {
                    "type": Sequelize.UUID,
                    "field": "id",
                    "primaryKey": true,
                    "defaultValue": Sequelize.UUIDV4
                },
                "tripId": {
                    "type": Sequelize.UUID,
                    "field": "trip_id",
                    "allowNull": false
                },
                "passengerId": {
                    "type": Sequelize.UUID,
                    "field": "passenger_id",
                    "allowNull": false
                },
                "seatNumber": {
                    "type": Sequelize.SMALLINT,
                    "field": "seat_number",
                    "allowNull": true
                },
                "seatsBooked": {
                    "type": Sequelize.SMALLINT,
                    "field": "seats_booked",
                    "defaultValue": 1,
                    "allowNull": false
                },
                "agreedFare": {
                    "type": Sequelize.DECIMAL(10, 2),
                    "field": "agreed_fare",
                    "allowNull": false
                },
                "currency": {
                    "type": Sequelize.STRING(3),
                    "field": "currency",
                    "defaultValue": "JOD",
                    "allowNull": true
                },
                "dropoffPlace": {
                    "type": Sequelize.STRING(120),
                    "field": "dropoff_place",
                    "allowNull": true
                },
                "dropoffDeadline": {
                    "type": Sequelize.DATE,
                    "field": "dropoff_deadline",
                    "allowNull": true
                },
                "dropoffOrder": {
                    "type": Sequelize.SMALLINT,
                    "field": "dropoff_order",
                    "allowNull": true
                },
                "status": {
                    "type": Sequelize.ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show'),
                    "field": "status",
                    "defaultValue": "confirmed",
                    "allowNull": false
                },
                "referenceCode": {
                    "type": Sequelize.STRING(12),
                    "field": "reference_code",
                    "unique": true,
                    "allowNull": false
                },
                "cancellationReason": {
                    "type": Sequelize.TEXT,
                    "field": "cancellation_reason",
                    "allowNull": true
                },
                "cancelledBy": {
                    "type": Sequelize.UUID,
                    "field": "cancelled_by",
                    "allowNull": true
                },
                "cancelledAt": {
                    "type": Sequelize.DATE,
                    "field": "cancelled_at",
                    "allowNull": true
                },
                "paymentStatus": {
                    "type": Sequelize.ENUM('pending', 'paid_cash', 'paid_other', 'disputed'),
                    "field": "payment_status",
                    "defaultValue": "pending",
                    "allowNull": true
                },
                "createdat": {
                    "type": Sequelize.DATE,
                    "field": "createdat",
                    "allowNull": false
                },
                "updatedat": {
                    "type": Sequelize.DATE,
                    "field": "updatedat",
                    "allowNull": false
                },
                "passenger_id": {
                    "type": Sequelize.UUID,
                    "field": "passenger_id",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "users",
                        "key": "id"
                    },
                    "allowNull": true
                },
                "trip_id": {
                    "type": Sequelize.UUID,
                    "field": "trip_id",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "trips",
                        "key": "id"
                    },
                    "allowNull": true
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "ride_requests",
            {
                "id": {
                    "type": Sequelize.UUID,
                    "field": "id",
                    "primaryKey": true,
                    "defaultValue": Sequelize.UUIDV4
                },
                "passengerId": {
                    "type": Sequelize.UUID,
                    "field": "passenger_id",
                    "allowNull": false
                },
                "originPlace": {
                    "type": Sequelize.STRING(120),
                    "field": "origin_place",
                    "allowNull": false
                },
                "originCity": {
                    "type": Sequelize.STRING(80),
                    "field": "origin_city",
                    "allowNull": false
                },
                "originLat": {
                    "type": Sequelize.DECIMAL(10, 8),
                    "field": "origin_lat",
                    "allowNull": true
                },
                "originLng": {
                    "type": Sequelize.DECIMAL(11, 8),
                    "field": "origin_lng",
                    "allowNull": true
                },
                "originTime": {
                    "type": Sequelize.DATE,
                    "field": "origin_time",
                    "allowNull": false
                },
                "destinationPlace": {
                    "type": Sequelize.STRING(120),
                    "field": "destination_place",
                    "allowNull": false
                },
                "destinationCity": {
                    "type": Sequelize.STRING(80),
                    "field": "destination_city",
                    "allowNull": false
                },
                "destinationLat": {
                    "type": Sequelize.DECIMAL(10, 8),
                    "field": "destination_lat",
                    "allowNull": true
                },
                "destinationLng": {
                    "type": Sequelize.DECIMAL(11, 8),
                    "field": "destination_lng",
                    "allowNull": true
                },
                "arrivalDeadline": {
                    "type": Sequelize.DATE,
                    "field": "arrival_deadline",
                    "allowNull": true
                },
                "seatsNeeded": {
                    "type": Sequelize.SMALLINT,
                    "field": "seats_needed",
                    "defaultValue": 1,
                    "allowNull": false
                },
                "maxBudget": {
                    "type": Sequelize.DECIMAL(10, 2),
                    "field": "max_budget",
                    "allowNull": true
                },
                "currency": {
                    "type": Sequelize.STRING(3),
                    "field": "currency",
                    "defaultValue": "JOD",
                    "allowNull": true
                },
                "attributesPreferred": {
                    "type": Sequelize.JSONB,
                    "field": "attributes_preferred",
                    "defaultValue": Sequelize.Object,
                    "allowNull": true
                },
                "status": {
                    "type": Sequelize.ENUM('open', 'offered', 'accepted', 'expired', 'cancelled'),
                    "field": "status",
                    "defaultValue": "open",
                    "allowNull": false
                },
                "expiresAt": {
                    "type": Sequelize.DATE,
                    "field": "expires_at",
                    "allowNull": false
                },
                "createdat": {
                    "type": Sequelize.DATE,
                    "field": "createdat",
                    "allowNull": false
                },
                "updatedat": {
                    "type": Sequelize.DATE,
                    "field": "updatedat",
                    "allowNull": false
                },
                "passenger_id": {
                    "type": Sequelize.UUID,
                    "field": "passenger_id",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "users",
                        "key": "id"
                    },
                    "allowNull": true
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "request_offers",
            {
                "id": {
                    "type": Sequelize.UUID,
                    "field": "id",
                    "primaryKey": true,
                    "defaultValue": Sequelize.UUIDV4
                },
                "requestId": {
                    "type": Sequelize.UUID,
                    "field": "request_id",
                    "allowNull": false
                },
                "driverId": {
                    "type": Sequelize.UUID,
                    "field": "driver_id",
                    "allowNull": false
                },
                "tripId": {
                    "type": Sequelize.UUID,
                    "field": "trip_id",
                    "allowNull": true
                },
                "offeredFare": {
                    "type": Sequelize.DECIMAL(10, 2),
                    "field": "offered_fare",
                    "allowNull": true
                },
                "message": {
                    "type": Sequelize.TEXT,
                    "field": "message",
                    "allowNull": true
                },
                "status": {
                    "type": Sequelize.ENUM('sent', 'accepted', 'declined', 'expired'),
                    "field": "status",
                    "defaultValue": "sent",
                    "allowNull": false
                },
                "createdat": {
                    "type": Sequelize.DATE,
                    "field": "createdat",
                    "allowNull": false
                },
                "updatedat": {
                    "type": Sequelize.DATE,
                    "field": "updatedat",
                    "allowNull": false
                },
                "driver_id": {
                    "type": Sequelize.UUID,
                    "field": "driver_id",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "users",
                        "key": "id"
                    },
                    "allowNull": true
                },
                "trip_id": {
                    "type": Sequelize.UUID,
                    "field": "trip_id",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "trips",
                        "key": "id"
                    },
                    "allowNull": true
                },
                "request_id": {
                    "type": Sequelize.UUID,
                    "field": "request_id",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "ride_requests",
                        "key": "id"
                    },
                    "allowNull": true
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "ratings",
            {
                "id": {
                    "type": Sequelize.UUID,
                    "field": "id",
                    "primaryKey": true,
                    "defaultValue": Sequelize.UUIDV4
                },
                "bookingId": {
                    "type": Sequelize.UUID,
                    "field": "booking_id",
                    "allowNull": false
                },
                "raterId": {
                    "type": Sequelize.UUID,
                    "field": "rater_id",
                    "allowNull": false
                },
                "rateeId": {
                    "type": Sequelize.UUID,
                    "field": "ratee_id",
                    "allowNull": false
                },
                "stars": {
                    "type": Sequelize.SMALLINT,
                    "field": "stars",
                    "allowNull": false
                },
                "wasLate": {
                    "type": Sequelize.BOOLEAN,
                    "field": "was_late",
                    "defaultValue": false,
                    "allowNull": true
                },
                "lateMinutes": {
                    "type": Sequelize.SMALLINT,
                    "field": "late_minutes",
                    "defaultValue": 0,
                    "allowNull": true
                },
                "review": {
                    "type": Sequelize.TEXT,
                    "field": "review",
                    "allowNull": true
                },
                "tags": {
                    "type": Sequelize.ARRAY(Sequelize.TEXT),
                    "field": "tags",
                    "allowNull": true
                },
                "isVisible": {
                    "type": Sequelize.BOOLEAN,
                    "field": "is_visible",
                    "defaultValue": true,
                    "allowNull": true
                },
                "createdat": {
                    "type": Sequelize.DATE,
                    "field": "createdat",
                    "allowNull": false
                },
                "rater_id": {
                    "type": Sequelize.UUID,
                    "field": "rater_id",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "users",
                        "key": "id"
                    },
                    "allowNull": true
                },
                "ratee_id": {
                    "type": Sequelize.UUID,
                    "field": "ratee_id",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "users",
                        "key": "id"
                    },
                    "allowNull": true
                },
                "booking_id": {
                    "type": Sequelize.UUID,
                    "field": "booking_id",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "bookings",
                        "key": "id"
                    },
                    "allowNull": true
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "delay_events",
            {
                "id": {
                    "type": Sequelize.UUID,
                    "field": "id",
                    "primaryKey": true,
                    "defaultValue": Sequelize.UUIDV4
                },
                "bookingId": {
                    "type": Sequelize.UUID,
                    "field": "booking_id",
                    "allowNull": false
                },
                "party": {
                    "type": Sequelize.ENUM('driver', 'passenger'),
                    "field": "party",
                    "allowNull": false
                },
                "delayMinutes": {
                    "type": Sequelize.SMALLINT,
                    "field": "delay_minutes",
                    "allowNull": false
                },
                "reason": {
                    "type": Sequelize.TEXT,
                    "field": "reason",
                    "allowNull": true
                },
                "reportedBy": {
                    "type": Sequelize.UUID,
                    "field": "reported_by",
                    "allowNull": false
                },
                "createdat": {
                    "type": Sequelize.DATE,
                    "field": "createdat",
                    "allowNull": false
                },
                "booking_id": {
                    "type": Sequelize.UUID,
                    "field": "booking_id",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "bookings",
                        "key": "id"
                    },
                    "allowNull": true
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "complaints",
            {
                "id": {
                    "type": Sequelize.UUID,
                    "field": "id",
                    "primaryKey": true,
                    "defaultValue": Sequelize.UUIDV4
                },
                "bookingId": {
                    "type": Sequelize.UUID,
                    "field": "booking_id",
                    "allowNull": true
                },
                "reporterId": {
                    "type": Sequelize.UUID,
                    "field": "reporter_id",
                    "allowNull": false
                },
                "accusedId": {
                    "type": Sequelize.UUID,
                    "field": "accused_id",
                    "allowNull": false
                },
                "category": {
                    "type": Sequelize.STRING(30),
                    "field": "category",
                    "allowNull": false
                },
                "description": {
                    "type": Sequelize.TEXT,
                    "field": "description",
                    "allowNull": false
                },
                "evidenceUrls": {
                    "type": Sequelize.ARRAY(Sequelize.TEXT),
                    "field": "evidence_urls",
                    "allowNull": true
                },
                "status": {
                    "type": Sequelize.ENUM('open', 'reviewing', 'resolved', 'dismissed'),
                    "field": "status",
                    "defaultValue": "open",
                    "allowNull": false
                },
                "resolution": {
                    "type": Sequelize.TEXT,
                    "field": "resolution",
                    "allowNull": true
                },
                "resolvedBy": {
                    "type": Sequelize.UUID,
                    "field": "resolved_by",
                    "allowNull": true
                },
                "resolvedAt": {
                    "type": Sequelize.DATE,
                    "field": "resolved_at",
                    "allowNull": true
                },
                "createdat": {
                    "type": Sequelize.DATE,
                    "field": "createdat",
                    "allowNull": false
                },
                "updatedat": {
                    "type": Sequelize.DATE,
                    "field": "updatedat",
                    "allowNull": false
                },
                "reporter_id": {
                    "type": Sequelize.UUID,
                    "field": "reporter_id",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "users",
                        "key": "id"
                    },
                    "allowNull": true
                },
                "accused_id": {
                    "type": Sequelize.UUID,
                    "field": "accused_id",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "users",
                        "key": "id"
                    },
                    "allowNull": true
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "penalties",
            {
                "id": {
                    "type": Sequelize.UUID,
                    "field": "id",
                    "primaryKey": true,
                    "defaultValue": Sequelize.UUIDV4
                },
                "userId": {
                    "type": Sequelize.UUID,
                    "field": "user_id",
                    "allowNull": false
                },
                "complaintId": {
                    "type": Sequelize.UUID,
                    "field": "complaint_id",
                    "allowNull": true
                },
                "type": {
                    "type": Sequelize.ENUM('warning', 'suspension', 'ban'),
                    "field": "type",
                    "allowNull": false
                },
                "reason": {
                    "type": Sequelize.TEXT,
                    "field": "reason",
                    "allowNull": false
                },
                "startsAt": {
                    "type": Sequelize.DATE,
                    "field": "starts_at",
                    "defaultValue": Sequelize.NOW,
                    "allowNull": false
                },
                "endsAt": {
                    "type": Sequelize.DATE,
                    "field": "ends_at",
                    "allowNull": true
                },
                "issuedBy": {
                    "type": Sequelize.UUID,
                    "field": "issued_by",
                    "allowNull": true
                },
                "isAppealed": {
                    "type": Sequelize.BOOLEAN,
                    "field": "is_appealed",
                    "defaultValue": false,
                    "allowNull": true
                },
                "appealReason": {
                    "type": Sequelize.TEXT,
                    "field": "appeal_reason",
                    "allowNull": true
                },
                "appealResolvedAt": {
                    "type": Sequelize.DATE,
                    "field": "appeal_resolved_at",
                    "allowNull": true
                },
                "createdat": {
                    "type": Sequelize.DATE,
                    "field": "createdat",
                    "allowNull": false
                },
                "user_id": {
                    "type": Sequelize.UUID,
                    "field": "user_id",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "users",
                        "key": "id"
                    },
                    "allowNull": true
                },
                "complaint_id": {
                    "type": Sequelize.UUID,
                    "field": "complaint_id",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "complaints",
                        "key": "id"
                    },
                    "allowNull": true
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "support_tickets",
            {
                "id": {
                    "type": Sequelize.UUID,
                    "field": "id",
                    "primaryKey": true,
                    "defaultValue": Sequelize.UUIDV4
                },
                "userId": {
                    "type": Sequelize.UUID,
                    "field": "user_id",
                    "allowNull": false
                },
                "category": {
                    "type": Sequelize.STRING(30),
                    "field": "category",
                    "allowNull": false
                },
                "subject": {
                    "type": Sequelize.STRING(255),
                    "field": "subject",
                    "allowNull": false
                },
                "description": {
                    "type": Sequelize.TEXT,
                    "field": "description",
                    "allowNull": false
                },
                "priority": {
                    "type": Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
                    "field": "priority",
                    "defaultValue": "medium",
                    "allowNull": true
                },
                "status": {
                    "type": Sequelize.ENUM('open', 'in_progress', 'resolved', 'closed'),
                    "field": "status",
                    "defaultValue": "open",
                    "allowNull": true
                },
                "assignedTo": {
                    "type": Sequelize.UUID,
                    "field": "assigned_to",
                    "allowNull": true
                },
                "resolutionNotes": {
                    "type": Sequelize.TEXT,
                    "field": "resolution_notes",
                    "allowNull": true
                },
                "createdat": {
                    "type": Sequelize.DATE,
                    "field": "createdat",
                    "allowNull": false
                },
                "updatedat": {
                    "type": Sequelize.DATE,
                    "field": "updatedat",
                    "allowNull": false
                },
                "user_id": {
                    "type": Sequelize.UUID,
                    "field": "user_id",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "users",
                        "key": "id"
                    },
                    "allowNull": true
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "notifications",
            {
                "id": {
                    "type": Sequelize.UUID,
                    "field": "id",
                    "primaryKey": true,
                    "defaultValue": Sequelize.UUIDV4
                },
                "userId": {
                    "type": Sequelize.UUID,
                    "field": "user_id",
                    "allowNull": false
                },
                "type": {
                    "type": Sequelize.STRING(30),
                    "field": "type",
                    "allowNull": false
                },
                "title": {
                    "type": Sequelize.STRING(255),
                    "field": "title",
                    "allowNull": false
                },
                "body": {
                    "type": Sequelize.TEXT,
                    "field": "body",
                    "allowNull": false
                },
                "data": {
                    "type": Sequelize.JSONB,
                    "field": "data",
                    "defaultValue": Sequelize.Object,
                    "allowNull": true
                },
                "isRead": {
                    "type": Sequelize.BOOLEAN,
                    "field": "is_read",
                    "defaultValue": false,
                    "allowNull": true
                },
                "sentVia": {
                    "type": Sequelize.ARRAY(Sequelize.STRING),
                    "field": "sent_via",
                    "defaultValue": ["push"],
                    "allowNull": true
                },
                "createdat": {
                    "type": Sequelize.DATE,
                    "field": "createdat",
                    "allowNull": false
                },
                "user_id": {
                    "type": Sequelize.UUID,
                    "field": "user_id",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "users",
                        "key": "id"
                    },
                    "allowNull": true
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "favorite_drivers",
            {
                "id": {
                    "type": Sequelize.UUID,
                    "field": "id",
                    "primaryKey": true,
                    "defaultValue": Sequelize.UUIDV4
                },
                "passengerId": {
                    "type": Sequelize.UUID,
                    "field": "passenger_id",
                    "allowNull": false
                },
                "driverId": {
                    "type": Sequelize.UUID,
                    "field": "driver_id",
                    "allowNull": false
                },
                "createdat": {
                    "type": Sequelize.DATE,
                    "field": "createdat",
                    "allowNull": false
                },
                "passenger_id": {
                    "type": Sequelize.UUID,
                    "field": "passenger_id",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "users",
                        "key": "id"
                    },
                    "allowNull": true
                },
                "driver_id": {
                    "type": Sequelize.UUID,
                    "field": "driver_id",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "users",
                        "key": "id"
                    },
                    "allowNull": true
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "favorite_routes",
            {
                "id": {
                    "type": Sequelize.UUID,
                    "field": "id",
                    "primaryKey": true,
                    "defaultValue": Sequelize.UUIDV4
                },
                "passengerId": {
                    "type": Sequelize.UUID,
                    "field": "passenger_id",
                    "allowNull": false
                },
                "originCity": {
                    "type": Sequelize.STRING(80),
                    "field": "origin_city",
                    "allowNull": false
                },
                "destinationCity": {
                    "type": Sequelize.STRING(80),
                    "field": "destination_city",
                    "allowNull": false
                },
                "label": {
                    "type": Sequelize.STRING(50),
                    "field": "label",
                    "allowNull": true
                },
                "createdat": {
                    "type": Sequelize.DATE,
                    "field": "createdat",
                    "allowNull": false
                },
                "passenger_id": {
                    "type": Sequelize.UUID,
                    "field": "passenger_id",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "users",
                        "key": "id"
                    },
                    "allowNull": true
                }
            },
            {}
        ]
    },
    {
        fn: "addIndex",
        params: [
            "trip_attributes",
            ["trip_id", "attr_key"],
            {
                "indexName": "trip_attributes_trip_id_attr_key",
                "indicesType": "UNIQUE"
            }
        ]
    },
    {
        fn: "addIndex",
        params: [
            "favorite_drivers",
            ["passenger_id", "driver_id"],
            {
                "indexName": "favorite_drivers_passenger_id_driver_id",
                "indicesType": "UNIQUE"
            }
        ]
    },
    {
        fn: "addIndex",
        params: [
            "favorite_routes",
            ["passenger_id", "origin_city", "destination_city"],
            {
                "indexName": "favorite_routes_passenger_id_origin_city_destination_city",
                "indicesType": "UNIQUE"
            }
        ]
    }
];

module.exports = {
    pos: 0,
    migrationCommands,
    up: function(queryInterface, Sequelize)
    {
        var index = this.pos;
        return new Promise(function(resolve, reject) {
            function next() {
                if (index < migrationCommands.length)
                {
                    let command = migrationCommands[index];
                    console.log("[#"+index+"] execute: " + command.fn);
                    index++;
                    queryInterface[command.fn].apply(queryInterface, command.params).then(next, reject);
                }
                else
                    resolve();
            }
            next();
        });
    },
    info: info
};
