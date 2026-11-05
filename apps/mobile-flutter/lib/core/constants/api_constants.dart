import 'dart:io';

class ApiConstants {
  // Use 10.0.2.2 for Android Emulator, localhost for iOS simulator/Web/Desktop
  static String get baseUrl {
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:3000/api/v1';
    }
    return 'http://localhost:3000/api/v1';
  }

  // Endpoints
  static const String loginEmail = '/auth/login/email';
  static const String registerEmail = '/auth/register/email';
  static const String requestOtp = '/auth/request-otp';
  static const String verifyOtp = '/auth/verify-otp';
  static const String googleAuth = '/auth/google';

  static const String vehicles = '/vehicles';
  static const String masterBrands = '/master-data/brands';

  static String brandModels(String brandId) => '/master-data/brands/$brandId/models';
  static String vehicleDetails(String id) => '/vehicles/$id';
  static String vehicleMileage(String id) => '/vehicles/$id/mileage';
  static String vehicleArchive(String id) => '/vehicles/$id/archive';
  static String vehicleUnarchive(String id) => '/vehicles/$id/unarchive';
  static String vehicleHistory(String id) => '/vehicles/$id/history';
}

