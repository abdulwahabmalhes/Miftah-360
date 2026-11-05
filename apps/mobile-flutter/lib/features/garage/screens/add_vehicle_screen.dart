import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/garage_provider.dart';

class AddVehicleScreen extends StatefulWidget {
  const AddVehicleScreen({Key? key}) : super(key: key);

  @override
  State<AddVehicleScreen> createState() => _AddVehicleScreenState();
}

class _AddVehicleScreenState extends State<AddVehicleScreen> {
  final _api = ApiClient();

  List<dynamic> _brands = [];
  List<dynamic> _models = [];
  bool _loadingBrands = true;
  bool _loadingModels = false;

  String? _selectedBrandId;
  String? _selectedBrandName;
  String? _selectedModelId;
  String? _selectedModelName;

  final _yearController = TextEditingController(text: '2023');
  final _mileageController = TextEditingController(text: '45000');
  final _plateNumberController = TextEditingController();
  final _plateCodeController = TextEditingController();
  String _selectedEmirate = 'DUBAI';
  final _vinController = TextEditingController();
  final _colorController = TextEditingController();

  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadBrands();
  }

  Future<void> _loadBrands() async {
    try {
      final list = await _api.getMasterBrands();
      setState(() {
        _brands = list;
        _loadingBrands = false;
      });
    } catch (_) {
      setState(() => _loadingBrands = false);
    }
  }

  Future<void> _handleBrandChanged(String? brandId) async {
    if (brandId == null) return;
    final b = _brands.firstWhere((element) => element['id'] == brandId, orElse: () => null);
    setState(() {
      _selectedBrandId = brandId;
      _selectedBrandName = b != null ? (b['nameAr'] ?? b['nameEn'] ?? b['name']) : null;
      _selectedModelId = null;
      _selectedModelName = null;
      _models = [];
      _loadingModels = true;
    });

    try {
      final list = await _api.getBrandModels(brandId);
      setState(() {
        _models = list;
        _loadingModels = false;
      });
    } catch (_) {
      setState(() => _loadingModels = false);
    }
  }

  Future<void> _handleSubmit() async {
    if (_selectedBrandId == null || _selectedBrandName == null) {
      setState(() => _errorMessage = 'يرجى اختيار ماركة المركبة');
      return;
    }
    if (_selectedModelName == null || _selectedModelName!.isEmpty) {
      setState(() => _errorMessage = 'يرجى اختيار موديل المركبة');
      return;
    }
    final year = int.tryParse(_yearController.text.trim());
    if (year == null || year < 1980 || year > 2026) {
      setState(() => _errorMessage = 'يرجى إدخال سنة صنع صحيحة (1980 - 2026)');
      return;
    }
    final mileage = int.tryParse(_mileageController.text.trim());
    if (mileage == null || mileage < 0) {
      setState(() => _errorMessage = 'يرجى إدخال قراءة عداد صحيحة');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      await context.read<GarageProvider>().addVehicle({
        'brand': _selectedBrandName,
        'model': _selectedModelName,
        'year': year,
        'mileage': mileage,
        if (_plateNumberController.text.isNotEmpty) 'plateNumber': _plateNumberController.text.trim(),
        if (_plateCodeController.text.isNotEmpty) 'plateCode': _plateCodeController.text.trim(),
        'plateEmirate': _selectedEmirate,
        if (_vinController.text.isNotEmpty) 'vin': _vinController.text.trim(),
        if (_colorController.text.isNotEmpty) 'color': _colorController.text.trim(),
      });

      if (mounted) {
        Navigator.pop(context);
      }
    } catch (e: any) {
      setState(() {
        _errorMessage = e.toString();
        _isSubmitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('إضافة مركبة جديدة'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_errorMessage != null)
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.red.shade200),
                ),
                child: Text(
                  _errorMessage!,
                  style: const TextStyle(fontSize: 12, color: AppColors.error, fontWeight: FontWeight.bold),
                ),
              ),

            // Brand Dropdown
            const Text('ماركة المركبة *', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textMain)),
            const SizedBox(height: 6),
            _loadingBrands
                ? const LinearProgressIndicator()
                : DropdownButtonFormField<String>(
                    value: _selectedBrandId,
                    hint: const Text('اختر الماركة (تويوتا، نيسان، بورش...)'),
                    items: _brands.map((b) {
                      return DropdownMenuItem<String>(
                        value: b['id'],
                        child: Text(b['nameAr'] ?? b['nameEn'] ?? b['name'] ?? ''),
                      );
                    }).toList(),
                    onChanged: _handleBrandChanged,
                  ),
            const SizedBox(height: 16),

            // Model Dropdown
            const Text('موديل المركبة *', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textMain)),
            const SizedBox(height: 6),
            _loadingModels
                ? const LinearProgressIndicator()
                : DropdownButtonFormField<String>(
                    value: _selectedModelId,
                    hint: Text(_selectedBrandId == null ? 'اختر الماركة أولاً' : 'اختر الموديل'),
                    items: _models.map((m) {
                      return DropdownMenuItem<String>(
                        value: m['id'],
                        child: Text(m['nameAr'] ?? m['nameEn'] ?? m['name'] ?? ''),
                      );
                    }).toList(),
                    onChanged: _selectedBrandId == null
                        ? null
                        : (val) {
                            final m = _models.firstWhere((x) => x['id'] == val, orElse: () => null);
                            setState(() {
                              _selectedModelId = val;
                              _selectedModelName = m != null ? (m['nameAr'] ?? m['nameEn'] ?? m['name']) : null;
                            });
                          },
                  ),
            const SizedBox(height: 16),

            // Year & Mileage
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('سنة الصنع *', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _yearController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(hintText: '2023'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('قراءة العداد (كم) *', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _mileageController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(hintText: '45000'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Plate Details
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('بيانات لوحة المركبة (الإمارات)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: _selectedEmirate,
                    decoration: const InputDecoration(labelText: 'الإمارة'),
                    items: const [
                      DropdownMenuItem(value: 'DUBAI', child: Text('دبي (Dubai)')),
                      DropdownMenuItem(value: 'ABU_DHABI', child: Text('أبوظبي (Abu Dhabi)')),
                      DropdownMenuItem(value: 'SHARJAH', child: Text('الشارقة (Sharjah)')),
                      DropdownMenuItem(value: 'AJMAN', child: Text('عجمان (Ajman)')),
                    ],
                    onChanged: (val) => setState(() => _selectedEmirate = val ?? 'DUBAI'),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        flex: 1,
                        child: TextField(
                          controller: _plateCodeController,
                          textCapitalization: TextCapitalization.characters,
                          decoration: const InputDecoration(labelText: 'رمز اللوحة', hintText: 'A / 1'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 2,
                        child: TextField(
                          controller: _plateNumberController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(labelText: 'رقم اللوحة', hintText: '12345'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            ElevatedButton(
              onPressed: _isSubmitting ? null : _handleSubmit,
              child: _isSubmitting
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('حفظ المركبة في الكراج'),
            ),
          ],
        ),
      ),
    );
  }
}

