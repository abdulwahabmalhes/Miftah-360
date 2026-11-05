import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../models/vehicle_model.dart';

class GarageProvider extends ChangeNotifier {
  final ApiClient _api = ApiClient();

  List<VehicleModel> _vehicles = [];
  bool _isLoading = true;
  String? _error;

  List<VehicleModel> get vehicles => _vehicles;
  List<VehicleModel> get activeVehicles => _vehicles.where((v) => !v.isArchived).toList();
  List<VehicleModel> get archivedVehicles => _vehicles.where((v) => v.isArchived).toList();
  bool get isLoading => _isLoading;
  String? get error => _error;

  GarageProvider() {
    loadVehicles();
  }

  Future<void> loadVehicles() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final list = await _api.getVehicles(includeArchived: true);
      _vehicles = list.map((json) => VehicleModel.fromJson(json)).toList();
    } catch (e: any) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> addVehicle(Map<String, dynamic> data) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _api.createVehicle(data);
      await loadVehicles();
    } catch (e: any) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updateMileage(String id, int mileage) async {
    try {
      await _api.updateVehicleMileage(id, mileage);
      await loadVehicles();
    } catch (e: any) {
      _error = e.toString();
      rethrow;
    }
  }

  Future<void> archiveVehicle(String id) async {
    try {
      await _api.archiveVehicle(id);
      await loadVehicles();
    } catch (e: any) {
      _error = e.toString();
      rethrow;
    }
  }

  Future<void> unarchiveVehicle(String id) async {
    try {
      await _api.unarchiveVehicle(id);
      await loadVehicles();
    } catch (e: any) {
      _error = e.toString();
      rethrow;
    }
  }
}

