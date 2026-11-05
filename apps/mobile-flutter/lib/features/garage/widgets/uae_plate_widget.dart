import 'package:flutter/material.dart';

class UaePlateWidget extends StatelessWidget {
  final String? plateNumber;
  final String? plateCode;
  final String? emirate;

  const UaePlateWidget({
    Key? key,
    this.plateNumber,
    this.plateCode,
    this.emirate = 'DUBAI',
  }) : super(key: key);

  String get _emirateLabelAr {
    switch (emirate?.toUpperCase()) {
      case 'DUBAI':
        return 'دبي';
      case 'ABU_DHABI':
        return 'أبوظبي';
      case 'SHARJAH':
        return 'الشارقة';
      case 'AJMAN':
        return 'عجمان';
      default:
        return 'دبي';
    }
  }

  String get _emirateLabelEn {
    switch (emirate?.toUpperCase()) {
      case 'DUBAI':
        return 'DUBAI';
      case 'ABU_DHABI':
        return 'A.DHABI';
      case 'SHARJAH':
        return 'SHARJAH';
      case 'AJMAN':
        return 'AJMAN';
      default:
        return 'DUBAI';
    }
  }

  @override
  Widget build(BuildContext context) {
    if (plateNumber == null || plateNumber!.isEmpty) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.grey.shade100,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: Colors.grey.shade300),
        ),
        child: const Text(
          'بدون لوحة',
          style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold),
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.black, width: 2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Emirate Ribbon
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: const BoxDecoration(
              color: Colors.black,
              borderRadius: BorderRadius.only(
                topRight: Radius.circular(5),
                bottomRight: Radius.circular(5),
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  _emirateLabelAr,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    height: 1.1,
                  ),
                ),
                Text(
                  _emirateLabelEn,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 7,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),

          // Code
          if (plateCode != null && plateCode!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Text(
                plateCode!,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w900,
                  color: Colors.black,
                  fontFamily: 'monospace',
                ),
              ),
            ),

          // Separator
          Container(width: 1.5, height: 20, color: Colors.grey.shade300),

          // Number
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
            child: Text(
              plateNumber!,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w900,
                color: Colors.black,
                letterSpacing: 2,
                fontFamily: 'monospace',
              ),
            ),
          ),
        ],
      ),
    );
  }
}

