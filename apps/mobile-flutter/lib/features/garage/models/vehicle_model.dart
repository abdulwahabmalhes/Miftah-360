class VehicleModel {
  final String id;
  final String brand;
  final String model;
  final int year;
  final int mileage;
  final String? plateNumber;
  final String? plateCode;
  final String? plateEmirate;
  final String? vin;
  final String? color;
  final String status;
  final String? notes;

  VehicleModel({
    required this.id,
    required this.brand,
    required this.model,
    required this.year,
    required this.mileage,
    this.plateNumber,
    this.plateCode,
    this.plateEmirate,
    this.vin,
    this.color,
    required this.status,
    this.notes,
  });

  bool get isArchived => status == 'ARCHIVED';

  factory VehicleModel.fromJson(Map<String, dynamic> json) {
    return VehicleModel(
      id: json['id'] ?? '',
      brand: json['brand'] is Map ? (json['brand']['nameAr'] ?? json['brand']['name'] ?? '') : (json['brand'] ?? ''),
      model: json['model'] is Map ? (json['model']['nameAr'] ?? json['model']['name'] ?? '') : (json['model'] ?? ''),
      year: json['year'] is int ? json['year'] : int.tryParse(json['year'].toString()) ?? 2022,
      mileage: json['mileage'] is int ? json['mileage'] : int.tryParse(json['mileage'].toString()) ?? 0,
      plateNumber: json['plateNumber'] ?? json['plate_number'],
      plateCode: json['plateCode'] ?? json['plate_code'],
      plateEmirate: json['plateEmirate'] ?? json['plate_emirate'] ?? 'DUBAI',
      vin: json['vin'],
      color: json['color'],
      status: json['status'] ?? 'ACTIVE',
      notes: json['notes'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'brand': brand,
      'model': model,
      'year': year,
      'mileage': mileage,
      'plateNumber': plateNumber,
      'plateCode': plateCode,
      'plateEmirate': plateEmirate,
      'vin': vin,
      'color': color,
      'status': status,
      'notes': notes,
    };
  }
}

