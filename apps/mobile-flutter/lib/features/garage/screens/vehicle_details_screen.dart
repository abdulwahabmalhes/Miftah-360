import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_theme.dart';
import '../models/vehicle_model.dart';
import '../providers/garage_provider.dart';
import '../widgets/uae_plate_widget.dart';

class VehicleDetailsScreen extends StatefulWidget {
  final VehicleModel vehicle;

  const VehicleDetailsScreen({Key? key, required this.vehicle}) : super(key: key);

  @override
  State<VehicleDetailsScreen> createState() => _VehicleDetailsScreenState();
}

class _VehicleDetailsScreenState extends State<VehicleDetailsScreen> {
  final _api = ApiClient();
  late VehicleModel _vehicle;
  List<dynamic> _history = [];
  bool _loadingHistory = true;

  @override
  void initState() {
    super.initState();
    _vehicle = widget.vehicle;
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    final list = await _api.getVehicleHistory(_vehicle.id);
    if (mounted) {
      setState(() {
        _history = list;
        _loadingHistory = false;
      });
    }
  }

  void _showUpdateMileageDialog() {
    final controller = TextEditingController(text: _vehicle.mileage.toString());
    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: const Text('تحديث قراءة العداد (كم)'),
          content: TextField(
            controller: controller,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'قراءة العداد الحالية'),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('إلغاء'),
            ),
            ElevatedButton(
              onPressed: () async {
                final newMileage = int.tryParse(controller.text.trim());
                if (newMileage != null && newMileage >= 0) {
                  await context.read<GarageProvider>().updateMileage(_vehicle.id, newMileage);
                  setState(() {
                    _vehicle = VehicleModel(
                      id: _vehicle.id,
                      brand: _vehicle.brand,
                      model: _vehicle.model,
                      year: _vehicle.year,
                      mileage: newMileage,
                      plateNumber: _vehicle.plateNumber,
                      plateCode: _vehicle.plateCode,
                      plateEmirate: _vehicle.plateEmirate,
                      vin: _vehicle.vin,
                      color: _vehicle.color,
                      status: _vehicle.status,
                      notes: _vehicle.notes,
                    );
                  });
                  Navigator.pop(ctx);
                }
              },
              child: const Text('حفظ التحديث'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _handleToggleArchive() async {
    final isArchived = _vehicle.isArchived;
    if (isArchived) {
      await context.read<GarageProvider>().unarchiveVehicle(_vehicle.id);
    } else {
      await context.read<GarageProvider>().archiveVehicle(_vehicle.id);
    }
    if (mounted) {
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('${_vehicle.brand} ${_vehicle.model}'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Vehicle Hero Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.secondary, Color(0xFF1E293B)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 12,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                children: [
                  UaePlateWidget(
                    plateNumber: _vehicle.plateNumber,
                    plateCode: _vehicle.plateCode,
                    emirate: _vehicle.plateEmirate,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    '${_vehicle.brand} ${_vehicle.model}',
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'موديل سنة ${_vehicle.year} • عداد ${_vehicle.mileage} كم',
                    style: TextStyle(fontSize: 13, color: Colors.grey.shade400),
                  ),
                  const SizedBox(height: 16),
                  OutlinedButton.icon(
                    onPressed: _showUpdateMileageDialog,
                    icon: const Icon(Icons.edit_road, size: 16, color: AppColors.primary),
                    label: const Text('تحديث قراءة العداد', style: TextStyle(color: Colors.white, fontSize: 12)),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppColors.primary),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Specifications Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('مواصفات المركبة', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textMain)),
                  const SizedBox(height: 12),
                  _specRow('الماركة والموديل', '${_vehicle.brand} ${_vehicle.model}'),
                  _specRow('سنة الصنع', '${_vehicle.year}'),
                  _specRow('قراءة العداد', '${_vehicle.mileage} كم'),
                  _specRow('رقم الهيكل (VIN)', _vehicle.vin ?? 'غير مسجل'),
                  _specRow('اللون', _vehicle.color ?? 'غير محدد'),
                  _specRow('حالة المركبة', _vehicle.isArchived ? 'في الأرشيف' : 'نشطة'),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Digital Maintenance History Placeholder
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('سجل الصيانة الرقمي', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                      Text('${_history.length} سجلات', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _loadingHistory
                      ? const Center(child: CircularProgressIndicator())
                      : _history.isEmpty
                          ? Container(
                              padding: const EdgeInsets.symmetric(vertical: 20),
                              alignment: Alignment.center,
                              child: Column(
                                children: const [
                                  Icon(Icons.history_edu, size: 36, color: Colors.grey),
                                  SizedBox(height: 8),
                                  Text(
                                    'لا توجد عمليات صيانة مسجلة بعد',
                                    style: TextStyle(fontSize: 12, color: AppColors.textMuted),
                                  ),
                                  SizedBox(height: 4),
                                  Text(
                                    'يتم توثيق الفواتير وتقارير الفحص والضمانات تلقائياً عند زيارة الورش الشريكة',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(fontSize: 10, color: Colors.grey),
                                  ),
                                ],
                              ),
                            )
                          : ListView.builder(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: _history.length,
                              itemBuilder: (ctx, i) {
                                final h = _history[i];
                                return ListTile(
                                  dense: true,
                                  title: Text(h['serviceName'] ?? 'صيانة دورية'),
                                  subtitle: Text(h['workshopName'] ?? 'ورشة معتمدة'),
                                  trailing: Text('${h['cost'] ?? 0} AED'),
                                );
                              },
                            ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Archive Button
            OutlinedButton.icon(
              onPressed: _handleToggleArchive,
              icon: Icon(_vehicle.isArchived ? Icons.unarchive : Icons.archive, size: 16),
              label: Text(_vehicle.isArchived ? 'إلغاء أرشفة المركبة وإعادتها للكراج' : 'أرشفة هذه المركبة'),
              style: OutlinedButton.styleFrom(
                foregroundColor: _vehicle.isArchived ? AppColors.success : AppColors.error,
                side: BorderSide(color: _vehicle.isArchived ? AppColors.success : AppColors.error),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _specRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
          Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textMain)),
        ],
      ),
    );
  }
}

