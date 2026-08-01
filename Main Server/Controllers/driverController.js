const bookingService = require('../Services/bookingService');
const ratingService = require('../Services/ratingService');
const penaltyService = require('../Services/penaltyService');
const complaintService = require('../Services/complaintService');
const earningsService = require('../Services/earningsService');
const statsService = require('../Services/statsService');
const { successResponse } = require('../utils/httpResponse');
const { maskPhone, maskNationalId } = require('../utils/masking');

const getBookings = async (req, res, next) => {
  try {
    const result = await bookingService.listForDriver(req.user.id, req.query);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const result = await bookingService.getForDriver(req.user.id, req.params.booking_id);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const getRatings = async (req, res, next) => {
  try {
    const result = await ratingService.listReceived(req.user.id, req.query);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const getPenalties = async (req, res, next) => {
  try {
    const result = await penaltyService.listForDriver(req.user.id, req.query);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const getComplaints = async (req, res, next) => {
  try {
    const result = await complaintService.listForDriver(req.user.id, req.query);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const getEarnings = async (req, res, next) => {
  try {
    const result = await earningsService.aggregate(req.user.id, req.query);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const getStats = async (req, res, next) => {
  try {
    const result = await statsService.lifetime(req.user.id);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const { User, Rating, Vehicle, DriverProfile } = require('../Models');

    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: DriverProfile,
          as: 'driverProfile',
        },
      ],
    });

    const ratingCount = await Rating.count({ where: { ratee_id: req.user.id } });

    const profile = user.driverProfile || {};
    const vehicles = await Vehicle.findAll({ where: { driver_id: req.user.id } });

    const anyVerified = vehicles.some((v) => v.isVerified);
    const identityVerified = Boolean(profile.idVerified);
    const vehicleVerified = anyVerified;

    const data = {
      profile: {
        user: {
          id: user.id,
          full_name: user.fullName,
          phone: maskPhone(user.phone),
          role: user.role,
          status: user.status,
          avg_rating: Number(user.avgRating || 0),
        },
        driver: {
          id_verified: Boolean(profile.idVerified),
          license_expiry: profile.licenseExpiry || null,
          total_trips: profile.totalTrips || 0,
          total_earnings: Number(profile.totalEarnings || 0),
          response_rate: Number(profile.responseRate || 0),
          national_id: maskNationalId(profile.nationalID),
        },
        verification: {
          identity_verified: identityVerified,
          vehicle_verified: vehicleVerified,
          fully_verified: identityVerified && vehicleVerified,
        },
        vehicles: vehicles.map((v) => ({
          id: v.id,
          manufacturer: v.manufacturer,
          model: v.model,
          vehicle_type: v.vehicleType,
          model_year: v.modelYear,
          plate_number: v.plateNumber,
          color: v.color,
          seats: v.seats,
          is_verified: v.isVerified,
        })),
        ratings_summary: {
          avg: Number(user.avgRating || 0),
          count: ratingCount,
        },
      },
    };

    successResponse(res, data);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBookings,
  getBookingById,
  getRatings,
  getPenalties,
  getComplaints,
  getEarnings,
  getStats,
  getProfile,
};
