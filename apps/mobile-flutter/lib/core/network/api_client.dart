import 'dart:convert';
import 'package:dio/dio.dart';
import '../constants/api_constants.dart';
import '../services/storage_service.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late final Dio dio;
  Function()? onUnauthorized;

  ApiClient._internal() {
    dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await StorageService.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          if (error.response?.statusCode == 401) {
            await StorageService.clearAuth();
            if (onUnauthorized != null) {
              onUnauthorized!();
            }
          }
          return handler.next(error);
        },
      ),
    );
  }

  // Auth Methods
  Future<Map<String, dynamic>> loginEmail(String email, String password) async {
    final res = await dio.post(
      ApiConstants.loginEmail,
      data: {'email': email, 'password': password},
    );
    return res.data;
  }

  Future<Map<String, dynamic>> registerEmail(String fullName, String email, String password, {String? phone}) async {
    final res = await dio.post(
      ApiConstants.registerEmail,
      data: {
        'fullName': fullName,
        'email': email,
        'password': password,
        if (phone != null && phone.isNotEmpty) 'phoneE164': phone,
      },
    );
    return res.data;
  }

  Future<Map<String, dynamic>> requestOtp(String phone) async {
    final res = await dio.post(
      ApiConstants.requestOtp,
      data: {'phoneE164': phone},
    );
    return res.data;
  }

  Future<Map<String, dynamic>> verifyOtp(String phone, String code) async {
    final res = await dio.post(
      ApiConstants.verifyOtp,
      data: {'phoneE164': phone, 'code': code},
    );
    return res.data;
  }

  // Vehicles
  Future<List<dynamic>> getVehicles({bool includeArchived = true}) async {
    final res = await dio.get(
      ApiConstants.vehicles,
      queryParameters: {'includeArchived': includeArchived},
    );
    return res.data is List ? res.data : [];
  }

  Future<Map<String, dynamic>> getVehicleDetails(String id) async {
    final res = await dio.get(ApiConstants.vehicleDetails(id));
    return res.data;
  }

  Future<Map<String, dynamic>> createVehicle(Map<String, dynamic> data) async {
    final res = await dio.post(ApiConstants.vehicles, data: data);
    return res.data;
  }

  Future<Map<String, dynamic>> updateVehicleMileage(String id, int mileage) async {
    final res = await dio.patch(
      ApiConstants.vehicleMileage(id),
      data: {'mileage': mileage},
    );
    return res.data;
  }

  Future<void> archiveVehicle(String id, {String? reason}) async {
    await dio.post(
      ApiConstants.vehicleArchive(id),
      data: {'reason': reason ?? 'USER_REQUESTED'},
    );
  }

  Future<void> unarchiveVehicle(String id) async {
    await dio.post(ApiConstants.vehicleUnarchive(id));
  }

  Future<List<dynamic>> getVehicleHistory(String id) async {
    try {
      final res = await dio.get(ApiConstants.vehicleHistory(id));
      return res.data is List ? res.data : [];
    } catch (_) {
      return [];
    }
  }

  // Master Data
  Future<List<dynamic>> getMasterBrands() async {
    final res = await dio.get(ApiConstants.masterBrands);
    return res.data is List ? res.data : [];
  }

  Future<List<dynamic>> getBrandModels(String brandId) async {
    final res = await dio.get(ApiConstants.brandModels(brandId));
    return res.data is List ? res.data : [];
  }
}

