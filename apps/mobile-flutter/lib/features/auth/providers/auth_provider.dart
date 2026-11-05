import 'dart:convert';
import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/services/storage_service.dart';
import '../models/user_model.dart';

class AuthProvider extends ChangeNotifier {
  final ApiClient _api = ApiClient();
  UserModel? _user;
  bool _isLoading = true;
  String? _error;

  UserModel? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get isLoading => _isLoading;
  String? get error => _error;

  AuthProvider() {
    _api.onUnauthorized = () {
      _user = null;
      notifyListeners();
    };
    checkSession();
  }

  Future<void> checkSession() async {
    _isLoading = true;
    notifyListeners();
    try {
      final token = await StorageService.getToken();
      final userJson = await StorageService.getUserJson();
      if (token != null && userJson != null) {
        _user = UserModel.fromJson(jsonDecode(userJson));
      } else {
        _user = null;
      }
    } catch (_) {
      await StorageService.clearAuth();
      _user = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loginEmail(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.loginEmail(email, password);
      await _handleAuthSuccess(res);
    } catch (e: any) {
      _error = _extractErrorMessage(e);
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> registerEmail(String fullName, String email, String password, {String? phone}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.registerEmail(fullName, email, password, phone: phone);
      await _handleAuthSuccess(res);
    } catch (e: any) {
      _error = _extractErrorMessage(e);
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> requestOtp(String phone) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      await _api.requestOtp(phone);
    } catch (e: any) {
      _error = _extractErrorMessage(e);
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> verifyOtp(String phone, String code) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.verifyOtp(phone, code);
      await _handleAuthSuccess(res);
    } catch (e: any) {
      _error = _extractErrorMessage(e);
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await StorageService.clearAuth();
    _user = null;
    notifyListeners();
  }

  Future<void> _handleAuthSuccess(Map<String, dynamic> res) async {
    final token = res['accessToken'] ?? res['access_token'];
    final userData = res['user'];
    if (token != null && userData != null) {
      await StorageService.saveToken(token.toString());
      await StorageService.saveUserJson(jsonEncode(userData));
      _user = UserModel.fromJson(userData);
    }
  }

  String _extractErrorMessage(dynamic e) {
    if (e is Map && e['error'] != null && e['error']['message'] != null) {
      return e['error']['message'];
    }
    return e.toString();
  }
}

