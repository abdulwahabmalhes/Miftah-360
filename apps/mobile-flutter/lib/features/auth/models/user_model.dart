class UserModel {
  final String id;
  final String fullName;
  final String? email;
  final String? phoneE164;
  final List<String> roles;

  UserModel({
    required this.id,
    required this.fullName,
    this.email,
    this.phoneE164,
    required this.roles,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? '',
      fullName: json['fullName'] ?? json['full_name'] ?? 'مستخدم مفتاح',
      email: json['email'],
      phoneE164: json['phoneE164'] ?? json['phone_e164'],
      roles: (json['roles'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? ['CAR_OWNER'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullName': fullName,
      'email': email,
      'phoneE164': phoneE164,
      'roles': roles,
    };
  }
}

