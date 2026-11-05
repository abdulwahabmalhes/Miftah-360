import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/vehicle_model.dart';
import '../providers/garage_provider.dart';
import '../widgets/uae_plate_widget.dart';
import 'add_vehicle_screen.dart';
import 'vehicle_details_screen.dart';

class GarageScreen extends StatefulWidget {
  const GarageScreen({Key? key}) : super(key: key);

  @override
  State<GarageScreen> createState() => _GarageScreenState();
}

class _GarageScreenState extends State<GarageScreen> {
  int _activeTab = 0; // 0: Active, 1: Archived

  @override
  Widget build(BuildContext context) {
    final garage = context.watch<GarageProvider>();
    final auth = context.watch<AuthProvider>();
    final displayed = _activeTab == 0 ? garage.activeVehicles : garage.archivedVehicles;

    return Scaffold(
      appBar: AppBar(
        title: const Text('كراج المركبات'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, size: 20),
            onPressed: () => garage.loadVehicles(),
          ),
          IconButton(
            icon: const Icon(Icons.logout, size: 20, color: AppColors.error),
            onPressed: () => auth.logout(),
          ),
        ],
      ),
      body: Column(
        children: [
          // User Banner & Add CTA
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      auth.user?.fullName ?? 'مالك المركبة',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textMain),
                    ),
                    Text(
                      'إجمالي المركبات: ${garage.vehicles.length}',
                      style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                    ),
                  ],
                ),
                ElevatedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const AddVehicleScreen()),
                    );
                  },
                  icon: const Icon(Icons.add, size: 16),
                  label: const Text('إضافة مركبة', style: TextStyle(fontSize: 12)),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  ),
                ),
              ],
            ),
          ),

          // Tabs: Active vs Archived
          Container(
            margin: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () => setState(() => _activeTab = 0),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: _activeTab == 0 ? AppColors.secondary : Colors.transparent,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        'المركبات النشطة (${garage.activeVehicles.length})',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: _activeTab == 0 ? Colors.white : AppColors.textMuted,
                        ),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: InkWell(
                    onTap: () => setState(() => _activeTab = 1),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: _activeTab == 1 ? AppColors.secondary : Colors.transparent,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        'الأرشيف (${garage.archivedVehicles.length})',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: _activeTab == 1 ? Colors.white : AppColors.textMuted,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Vehicles List
          Expanded(
            child: garage.isLoading
                ? const Center(child: CircularProgressIndicator())
                : displayed.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text('🚗', style: TextStyle(fontSize: 48)),
                            const SizedBox(height: 12),
                            Text(
                              _activeTab == 0 ? 'كراجك فارغ حالياً!' : 'لا توجد مركبات في الأرشيف',
                              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textMain),
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'أضف سيارتك الأولى لبدء طلبات الصيانة وعروض الأسعار',
                              style: TextStyle(fontSize: 12, color: AppColors.textMuted),
                            ),
                            const SizedBox(height: 16),
                            if (_activeTab == 0)
                              ElevatedButton.icon(
                                onPressed: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(builder: (_) => const AddVehicleScreen()),
                                  );
                                },
                                icon: const Icon(Icons.add, size: 16),
                                label: const Text('إضافة مركبة جديدة'),
                              ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: displayed.length,
                        itemBuilder: (context, index) {
                          final v = displayed[index];
                          return _buildVehicleCard(context, v);
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildVehicleCard(BuildContext context, VehicleModel v) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => VehicleDetailsScreen(vehicle: v)),
            );
          },
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Row: Brand & Model + Plate
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${v.brand} ${v.model}',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textMain),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'موديل سنة ${v.year}',
                          style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                        ),
                      ],
                    ),
                    UaePlateWidget(
                      plateNumber: v.plateNumber,
                      plateCode: v.plateCode,
                      emirate: v.plateEmirate,
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                const Divider(height: 1, color: AppColors.border),
                const SizedBox(height: 12),

                // Bottom Row: Mileage & Details Link
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.speed, size: 16, color: AppColors.primary),
                        const SizedBox(width: 6),
                        Text(
                          '${v.mileage} كم',
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: AppColors.textMain),
                        ),
                      ],
                    ),
                    Row(
                      children: const [
                        Text('عرض التفاصيل', style: TextStyle(fontSize: 12, color: AppColors.primaryDark, fontWeight: FontWeight.bold)),
                        SizedBox(width: 4),
                        Icon(Icons.arrow_forward_ios, size: 12, color: AppColors.primaryDark),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

