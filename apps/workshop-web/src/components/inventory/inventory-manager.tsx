import React, { useState, useEffect } from 'react';
import { useI18n } from '../../context/i18n-context';
import { workshopApi } from '../../api/workshop-client';

export interface CategoryItem {
  id: string;
  nameAr: string;
  nameEn?: string;
  icon?: string;
  subcategories: {
    id: string;
    nameAr: string;
    nameEn?: string;
    _count?: { items: number };
  }[];
  _count?: { items: number };
}

export interface InventoryPart {
  id: string;
  sku: string;
  oemPartNumber?: string;
  nameAr: string;
  nameEn?: string;
  brand?: string;
  qualityTier: 'OEM' | 'OES' | 'AFTERMARKET_PREMIUM' | 'AFTERMARKET_STANDARD' | 'USED_TESTED';
  unit: string;
  onHandQty: number;
  reservedQty: number;
  availableQty: number;
  reorderLevel: number;
  costPrice: number;
  sellingPrice: number;
  location?: string;
  compatibleVehicles?: any;
  descriptionAr?: string;
  supplierName?: string;
  warrantyMonths?: number;
  imageUrl?: string;
  status: string;
  isLowStock?: boolean;
  category: { id: string; nameAr: string; nameEn?: string; icon?: string };
  subcategory: { id: string; nameAr: string; nameEn?: string };
}

export interface MovementRecord {
  id: string;
  movementType: string;
  quantity: number;
  previousOnHand: number;
  newOnHand: number;
  previousReserved: number;
  newReserved: number;
  unitCost?: number | null;
  unitPrice?: number | null;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  createdAt: string;
  item: {
    id: string;
    sku: string;
    nameAr: string;
    unit: string;
    imageUrl?: string;
    category?: { nameAr: string };
    subcategory?: { nameAr: string };
  };
  actorUser?: {
    id: string;
    fullName: string;
    email?: string;
  };
}

export interface ActiveJobItem {
  id: string;
  status: string;
  customerName: string;
  customerPhone?: string;
  plateNumber: string;
  vehicleDescription: string;
  vin?: string;
}

// Pre-curated High Definition Automotive Parts Photos
const PART_PHOTO_PRESETS = [
  {
    label: 'فحمات فرامل أمامية',
    url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80',
    categoryCode: 'BRAKES',
  },
  {
    label: 'أقراص وهوبات فرامل',
    url: 'https://images.unsplash.com/photo-1600790142055-619df03207e6?auto=format&fit=crop&w=600&q=80',
    categoryCode: 'BRAKES',
  },
  {
    label: 'فلتر زيت محرك',
    url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80',
    categoryCode: 'FILTERS',
  },
  {
    label: 'فلتر مكيف كربون نشط',
    url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80',
    categoryCode: 'FILTERS',
  },
  {
    label: 'زيت محرك تخليقي 5W-30',
    url: 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&w=600&q=80',
    categoryCode: 'OILS',
  },
  {
    label: 'بطارية AGM جافة 80Ah',
    url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
    categoryCode: 'ELECTRICAL',
  },
  {
    label: 'بواجي إيريديوم ليزر',
    url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=600&q=80',
    categoryCode: 'ELECTRICAL',
  },
  {
    label: 'مساعدات هيدروليك',
    url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80',
    categoryCode: 'SUSPENSION',
  },
  {
    label: 'أسطوانة فريون R134a',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    categoryCode: 'AC',
  },
];

const DEFAULT_SYSTEM_SUPPLIERS = [
  'مجموعة الفطيم لقطع الغيار الأصلية (Al Futtaim Motors OEM)',
  'الشركة العربية لتجارة وتوزيع الزيوت (Castrol & Shell UAE)',
  'الرستماني لقطع غيار نيسان وإنفينيتي الأصلية',
  'شركة الوصل لتجارة قطع الغيار الأوروبية (Bosch & Mann)',
  'مؤسسة مشاريع قرقاش لقطع مرسيدس-بنز',
  'الشركة العامة للبطاريات والمهمات الكهربائية (VARTA & GS)',
  'الخليج لمعدات التبريد وغاز الفريون الأمريكي',
];

export const InventoryManager: React.FC = () => {
  const { language } = useI18n();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'MOVEMENTS'>('CATALOG');

  // Server state
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [items, setItems] = useState<InventoryPart[]>([]);
  const [movements, setMovements] = useState<MovementRecord[]>([]);
  const [activeJobs, setActiveJobs] = useState<ActiveJobItem[]>([]);
  const [suppliersList, setSuppliersList] = useState<string[]>(DEFAULT_SYSTEM_SUPPLIERS);

  const [loading, setLoading] = useState(true);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filters
  const [activeCategoryId, setActiveCategoryId] = useState<string>('ALL');
  const [activeSubcategoryId, setActiveSubcategoryId] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryManagerModal, setShowCategoryManagerModal] = useState(false);
  const [categoryModalTab, setCategoryModalTab] = useState<'NEW_MAIN' | 'NEW_SUB' | 'TREE'>('NEW_MAIN');

  // Operational Lifecycle Modals
  const [stockInItem, setStockInItem] = useState<InventoryPart | null>(null);
  const [reserveItem, setReserveItem] = useState<InventoryPart | null>(null);
  const [reconcileItem, setReconcileItem] = useState<InventoryPart | null>(null);
  const [manageReservationsItem, setManageReservationsItem] = useState<InventoryPart | null>(null);
  const [activePartReservations, setActivePartReservations] = useState<any[]>([]);

  // 1. Stock In form
  const [stockInQty, setStockInQty] = useState(1);
  const [stockInCost, setStockInCost] = useState<number | ''>('');
  const [selectedSupplier, setSelectedSupplier] = useState(DEFAULT_SYSTEM_SUPPLIERS[0]);
  const [customSupplierName, setCustomSupplierName] = useState('');
  const [stockInInvoice, setStockInInvoice] = useState('');
  const [stockInNotes, setStockInNotes] = useState('');

  // 2. Reserve / Sale form
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [customCustomerInfo, setCustomCustomerInfo] = useState('');
  const [reserveQty, setReserveQty] = useState(1);
  const [reservePrice, setReservePrice] = useState<number | ''>('');
  const [reserveNotes, setReserveNotes] = useState('');

  // 3. Dispense / Return / Release
  const [dispenseQty, setDispenseQty] = useState(1);
  const [dispenseTechName, setDispenseTechName] = useState('');
  const [returnQty, setReturnQty] = useState(1);
  const [returnIsDefective, setReturnIsDefective] = useState(false);
  const [returnDefectReason, setReturnDefectReason] = useState('');
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [activeActionType, setActiveActionType] = useState<'NONE' | 'DISPENSE' | 'RETURN' | 'RELEASE'>('NONE');

  // 4. Reconciliation form
  const [reconcileCountedQty, setReconcileCountedQty] = useState<number | ''>('');
  const [reconcileReason, setReconcileReason] = useState('');

  // 5. Category Creation form
  const [newCatNameAr, setNewCatNameAr] = useState('');
  const [newCatNameEn, setNewCatNameEn] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🧰');
  const [targetParentCatId, setTargetParentCatId] = useState('');
  const [newSubNameAr, setNewSubNameAr] = useState('');
  const [newSubNameEn, setNewSubNameEn] = useState('');

  // 6. New Item Form
  const [newItem, setNewItem] = useState({
    categoryId: '',
    subcategoryId: '',
    sku: '',
    oemPartNumber: '',
    nameAr: '',
    nameEn: '',
    brand: '',
    qualityTier: 'OEM' as const,
    unit: 'قطعة',
    initialQty: 10,
    reorderLevel: 5,
    costPrice: 0,
    sellingPrice: 0,
    location: '',
    compatibleVehicles: '',
    descriptionAr: '',
    supplierName: DEFAULT_SYSTEM_SUPPLIERS[0],
    warrantyMonths: 12,
    imageUrl: PART_PHOTO_PRESETS[0].url,
  });

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Load suppliers from localStorage & system
  useEffect(() => {
    try {
      const storedSuppliers = localStorage.getItem('miftah_workshop_suppliers');
      if (storedSuppliers) {
        const parsed = JSON.parse(storedSuppliers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const names = parsed.map((s: any) => s.name).filter(Boolean);
          const combined = Array.from(new Set([...names, ...DEFAULT_SYSTEM_SUPPLIERS]));
          setSuppliersList(combined);
          setSelectedSupplier(combined[0]);
        }
      }
    } catch {
      // fallback
    }
  }, []);

  // Load backend data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [catsRes, itemsRes, movsRes, jobsRes] = await Promise.all([
        workshopApi.getInventoryCategories().catch(() => []),
        workshopApi.getInventoryItems().catch(() => []),
        workshopApi.getInventoryMovements().catch(() => []),
        workshopApi.getActiveJobs().catch(() => []),
      ]);

      setCategories(catsRes || []);
      setItems(itemsRes || []);
      setMovements(movsRes || []);
      setActiveJobs(jobsRes || []);

      if (jobsRes && jobsRes.length > 0 && !selectedJobId) {
        setSelectedJobId(jobsRes[0].id);
      }

      if (catsRes && catsRes.length > 0 && !newItem.categoryId) {
        setNewItem((prev) => ({
          ...prev,
          categoryId: catsRes[0].id,
          subcategoryId: catsRes[0].subcategories?.[0]?.id || '',
        }));
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchCategory = activeCategoryId === 'ALL' || item.category?.id === activeCategoryId;
    const matchSubcategory = activeSubcategoryId === 'ALL' || item.subcategory?.id === activeSubcategoryId;
    const matchLowStock = !filterLowStockOnly || item.isLowStock;

    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      item.nameAr.toLowerCase().includes(q) ||
      (item.nameEn && item.nameEn.toLowerCase().includes(q)) ||
      item.sku.toLowerCase().includes(q) ||
      (item.oemPartNumber && item.oemPartNumber.toLowerCase().includes(q)) ||
      (item.brand && item.brand.toLowerCase().includes(q)) ||
      (item.location && item.location.toLowerCase().includes(q));

    return matchCategory && matchSubcategory && matchLowStock && matchSearch;
  });

  // KPI Calculations
  const totalItemsCount = items.length;
  const totalOnHandUnits = items.reduce((acc, i) => acc + Number(i.onHandQty || 0), 0);
  const totalReservedUnits = items.reduce((acc, i) => acc + Number(i.reservedQty || 0), 0);
  const totalAvailableUnits = items.reduce((acc, i) => acc + Number(i.availableQty || 0), 0);
  const totalRetailValue = items.reduce((acc, i) => acc + Number(i.onHandQty || 0) * Number(i.sellingPrice || 0), 0);
  const lowStockCount = items.filter((i) => i.isLowStock).length;

  const currentCategoryObj = categories.find((c) => c.id === activeCategoryId);

  // Selected Active Job Object
  const selectedJobObj = activeJobs.find((j) => j.id === selectedJobId);

  // -------------------------------------------------------------
  // OPERATIONAL ACTION HANDLERS
  // -------------------------------------------------------------

  // 1. Submit Stock In
  const handleStockInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockInItem || stockInQty <= 0) return;

    const supplierToUse =
      selectedSupplier === 'CUSTOM' ? customSupplierName.trim() : selectedSupplier;

    try {
      await workshopApi.stockInInventoryItem(stockInItem.id, {
        quantity: Number(stockInQty),
        unitCost: stockInCost !== '' ? Number(stockInCost) : undefined,
        supplierName: supplierToUse || undefined,
        supplierInvoiceNo: stockInInvoice.trim() || undefined,
        notes: stockInNotes.trim() || undefined,
      });

      showToast(`✅ تم توريد ${stockInQty} ${stockInItem.unit} من [${supplierToUse || 'المورد'}] بنجاح!`);
      setStockInItem(null);
      setStockInQty(1);
      setStockInCost('');
      setStockInInvoice('');
      setStockInNotes('');
      await fetchData();
    } catch (err: any) {
      alert(`خطأ في التوريد: ${err.message}`);
    }
  };

  // 2. Submit Job Reservation / Customer Sale
  const handleReserveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reserveItem || reserveQty <= 0) return;

    const targetJobId =
      selectedJobId === 'DIRECT_SALE'
        ? `DIRECT-SALE-${Date.now().toString().slice(-6)}`
        : selectedJobId || activeJobs[0]?.id || 'JOB-GENERAL';

    const customerNotes =
      selectedJobId === 'DIRECT_SALE'
        ? `بيع مباشر للعميل: ${customCustomerInfo.trim() || 'كاونتر نقدي'}`
        : selectedJobObj
        ? `حجز لصيانة مركبة: ${selectedJobObj.plateNumber} (${selectedJobObj.vehicleDescription}) - العميل: ${selectedJobObj.customerName}`
        : reserveNotes.trim();

    try {
      const res = await workshopApi.reservePartForJob(reserveItem.id, {
        jobId: targetJobId,
        quantity: Number(reserveQty),
        unitPrice: reservePrice !== '' ? Number(reservePrice) : undefined,
        notes: customerNotes,
      });

      showToast(`🔒 تم حجز ${res.reservedNow} ${reserveItem.unit} بنجاح للعميل/أمر الصيانة! (المتبقي متاح: ${res.availableQty})`);
      setReserveItem(null);
      setReserveQty(1);
      setReservePrice('');
      setReserveNotes('');
      setCustomCustomerInfo('');
      await fetchData();
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('tenant') || msg.includes('assigned workshop') || msg.includes('TENANT_MISMATCH') || err?.status === 403) {
        alert('⚠️ تنبيه الجلسة: تم تحديث صلاحيات الورشة في النظام. يرجى تسجيل الدخول مجدداً بحساب الورشة (owner@workshop.local).');
        sessionStorage.clear();
        window.location.reload();
      } else {
        alert(`خطأ في الحجز: ${err.message}`);
      }
    }
  };

  // 3. Open Reservations Management Modal
  const handleOpenReservations = async (item: InventoryPart) => {
    setManageReservationsItem(item);
    setActiveActionType('NONE');
    setSelectedReservationId(null);
    try {
      const detail = await workshopApi.getInventoryItem(item.id);
      setActivePartReservations(detail.reservations || []);
    } catch (err: any) {
      console.warn('Could not load reservations:', err);
    }
  };

  // 3a. Dispense
  const handleDispenseSubmit = async (reservationId: string) => {
    if (!manageReservationsItem || dispenseQty <= 0) return;
    try {
      await workshopApi.dispensePartToTechnician(reservationId, {
        quantity: Number(dispenseQty),
        technicianName: dispenseTechName.trim() || 'الفني المناوب',
      });
      showToast(`📦 تم صرف ${dispenseQty} قطعة للفني بنجاح وخصمها من الرصيد الفعلي!`);
      setActiveActionType('NONE');
      await handleOpenReservations(manageReservationsItem);
      await fetchData();
    } catch (err: any) {
      alert(`خطأ في الصرف: ${err.message}`);
    }
  };

  // 3b. Release
  const handleReleaseSubmit = async (reservationId: string) => {
    if (!manageReservationsItem) return;
    if (!confirm('هل أنت متأكد من فك الحجز وإعادة الكمية غير المصروفة للمخزون المتاح؟')) return;
    try {
      await workshopApi.releasePartReservation(reservationId, {
        notes: 'فك حجز من لوحة الورشة',
      });
      showToast(`🔓 تم فك الحجز بنجاح وإعادة الكميات للمتاح!`);
      setActiveActionType('NONE');
      await handleOpenReservations(manageReservationsItem);
      await fetchData();
    } catch (err: any) {
      alert(`خطأ في فك الحجز: ${err.message}`);
    }
  };

  // 3c. Return
  const handleReturnSubmit = async (reservationId: string) => {
    if (!manageReservationsItem || returnQty <= 0) return;
    try {
      await workshopApi.returnPartFromJob(reservationId, {
        quantity: Number(returnQty),
        isDefective: returnIsDefective,
        defectReason: returnDefectReason.trim() || undefined,
        notes: returnIsDefective ? 'إرجاع تالف وخارج الرصيد الصالح' : 'إرجاع سليم للمستودع',
      });
      showToast(
        returnIsDefective
          ? `⚠️ تم تسجيل إرجاع قطعة تالفة على أمر الصيانة خارج الرصيد الصالح!`
          : `✅ تم إرجاع ${returnQty} قطعة صالحة بنجاح إلى رصيد المستودع!`
      );
      setActiveActionType('NONE');
      await handleOpenReservations(manageReservationsItem);
      await fetchData();
    } catch (err: any) {
      alert(`خطأ في الإرجاع: ${err.message}`);
    }
  };

  // 4. Submit Cycle Count Reconciliation
  const handleReconcileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconcileItem || reconcileCountedQty === '' || Number(reconcileCountedQty) < 0) return;
    if (!reconcileReason.trim()) {
      alert('سبب التسوية إلزامي للاعتماد والتوثيق المحاسبي');
      return;
    }

    try {
      const res = await workshopApi.reconcileInventoryItem(reconcileItem.id, {
        countedQty: Number(reconcileCountedQty),
        reason: reconcileReason.trim(),
      });

      showToast(`📊 ${res.message || 'تم اعتماد التسوية وتحديث رصيد المستودع بنجاح!'}`);
      setReconcileItem(null);
      setReconcileCountedQty('');
      setReconcileReason('');
      await fetchData();
    } catch (err: any) {
      alert(`فشل اعتماد الجرد: ${err.message}`);
    }
  };

  // 5. Submit Create New Part
  const handleCreatePartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.categoryId || !newItem.subcategoryId) {
      alert('التصنيف الرئيسي والفئة الفرعية إلزاميان لكل قطعة مخزنية');
      return;
    }
    if (!newItem.sku || !newItem.nameAr) {
      alert('رمز القطعة (SKU) واسم القطعة بالعربية حقول إلزامية');
      return;
    }

    try {
      await workshopApi.createInventoryItem({
        categoryId: newItem.categoryId,
        subcategoryId: newItem.subcategoryId,
        sku: newItem.sku.trim().toUpperCase(),
        oemPartNumber: newItem.oemPartNumber.trim() || undefined,
        nameAr: newItem.nameAr.trim(),
        nameEn: newItem.nameEn.trim() || undefined,
        brand: newItem.brand.trim() || undefined,
        qualityTier: newItem.qualityTier,
        unit: newItem.unit || 'قطعة',
        initialQty: Number(newItem.initialQty || 0),
        reorderLevel: Number(newItem.reorderLevel || 5),
        costPrice: Number(newItem.costPrice || 0),
        sellingPrice: Number(newItem.sellingPrice || 0),
        location: newItem.location.trim() || undefined,
        compatibleVehicles: newItem.compatibleVehicles.trim() || undefined,
        descriptionAr: newItem.descriptionAr.trim() || undefined,
        supplierName: newItem.supplierName || undefined,
        warrantyMonths: Number(newItem.warrantyMonths || 0),
      });

      showToast(`✨ تم إدراج القطعة الجديدة [${newItem.sku.toUpperCase()}] بنجاح في المستودع!`);
      setShowAddModal(false);
      setNewItem({
        categoryId: categories[0]?.id || '',
        subcategoryId: categories[0]?.subcategories?.[0]?.id || '',
        sku: '',
        oemPartNumber: '',
        nameAr: '',
        nameEn: '',
        brand: '',
        qualityTier: 'OEM',
        unit: 'قطعة',
        initialQty: 10,
        reorderLevel: 5,
        costPrice: 0,
        sellingPrice: 0,
        location: '',
        compatibleVehicles: '',
        descriptionAr: '',
        supplierName: suppliersList[0] || DEFAULT_SYSTEM_SUPPLIERS[0],
        warrantyMonths: 12,
        imageUrl: PART_PHOTO_PRESETS[0].url,
      });
      await fetchData();
    } catch (err: any) {
      alert(`خطأ في إضافة القطعة: ${err.message}`);
    }
  };

  // 6. Create Category / Subcategory
  const handleCreateMainCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatNameAr.trim()) return;
    try {
      await workshopApi.createInventoryCategory({
        nameAr: newCatNameAr.trim(),
        nameEn: newCatNameEn.trim() || undefined,
        icon: newCatIcon || '🧰',
      });
      showToast(`📁 تم إنشاء التصنيف الرئيسي "${newCatNameAr}" بنجاح!`);
      setNewCatNameAr('');
      setNewCatNameEn('');
      setShowCategoryManagerModal(false);
      await fetchData();
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    }
  };

  const handleCreateSubCat = async (e: React.FormEvent) => {
    e.preventDefault();
    const parentId = targetParentCatId || categories[0]?.id;
    if (!newSubNameAr.trim() || !parentId) return;
    try {
      await workshopApi.createInventorySubcategory({
        categoryId: parentId,
        nameAr: newSubNameAr.trim(),
        nameEn: newSubNameEn.trim() || undefined,
      });
      showToast(`📂 تم إنشاء الفئة الفرعية "${newSubNameAr}" بنجاح!`);
      setNewSubNameAr('');
      setNewSubNameEn('');
      setShowCategoryManagerModal(false);
      await fetchData();
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    }
  };

  // Local Image Upload Handler (Converts file to Base64)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 2 ميغابايت');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItem((prev) => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getQualityTierBadge = (tier: string) => {
    switch (tier) {
      case 'OEM':
        return <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-black rounded-lg">⭐ أصلي وكالة OEM</span>;
      case 'OES':
        return <span className="px-2.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-300 text-[10px] font-black rounded-lg">🔹 مطابق للأصل OES</span>;
      case 'AFTERMARKET_PREMIUM':
        return <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold rounded-lg">تجاري ممتازة</span>;
      case 'AFTERMARKET_STANDARD':
        return <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 border border-slate-300 text-[10px] font-bold rounded-lg">تجاري قياسي</span>;
      case 'USED_TESTED':
        return <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-bold rounded-lg">مستعمل مفحوص</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg">{tier}</span>;
    }
  };

  const getMovementTypeBadge = (type: string) => {
    switch (type) {
      case 'STOCK_IN':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 font-black text-[11px] rounded-lg">📥 توريد واستلام</span>;
      case 'INITIAL_STOCK':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-900 font-black text-[11px] rounded-lg">🏷️ رصيد افتتاحي</span>;
      case 'JOB_RESERVATION':
        return <span className="px-2.5 py-1 bg-indigo-100 text-indigo-900 font-black text-[11px] rounded-lg">🔒 حجز لعميل / أمر</span>;
      case 'JOB_DISPENSE':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-black text-[11px] rounded-lg">🛠️ صرف للفني</span>;
      case 'JOB_RETURN_GOOD':
        return <span className="px-2.5 py-1 bg-teal-100 text-teal-900 font-black text-[11px] rounded-lg">↩️ إرجاع قطعة صالحة</span>;
      case 'JOB_RETURN_DEFECTIVE':
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-900 font-black text-[11px] rounded-lg">❌ إرجاع تالف (سكراب)</span>;
      case 'RESERVATION_RELEASE':
        return <span className="px-2.5 py-1 bg-purple-100 text-purple-900 font-black text-[11px] rounded-lg">🔓 فك حجز متبقي</span>;
      case 'RECONCILIATION_ADJUSTMENT':
        return <span className="px-2.5 py-1 bg-cyan-100 text-cyan-900 font-black text-[11px] rounded-lg">📊 تسوية جرد دوري</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-lg">{type}</span>;
    }
  };

  // Helper to get image for part
  const getPartImage = (item: InventoryPart) => {
    if (item.imageUrl) return item.imageUrl;
    // fallback to preset by category
    const found = PART_PHOTO_PRESETS.find((p) =>
      item.nameAr.includes(p.label.split(' ')[0]) || item.category?.nameAr?.includes(p.label.split(' ')[0])
    );
    return found ? found.url : PART_PHOTO_PRESETS[0].url;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Toast Alert */}
      {successToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <span className="text-emerald-400 font-bold">✓</span>
          <span className="text-xs font-black">{successToast}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-mono font-black">
              INVENTORY PACK V3.1
            </span>
            <span className="px-2.5 py-1 bg-white/10 rounded-lg text-xs text-slate-300 font-bold">
              مستودع الورشة وإدارة الموردين والعملاء
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">إدارة مستودع قطع الغيار والزيوت والمواد</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            ربط مباشر مع قائمة الموردين المعتمدين، وأوامر صيانة العملاء الحالية، وصور واضحة لكل قطعة، ومعادلة رصيد ذرّية متزامنة.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setTargetParentCatId(activeCategoryId !== 'ALL' ? activeCategoryId : categories[0]?.id || '');
              setShowCategoryManagerModal(true);
            }}
            className="h-10 px-4 bg-slate-800/90 hover:bg-slate-700 text-slate-100 font-black text-xs rounded-xl shadow-xs transition flex items-center gap-2 border border-slate-700"
          >
            <span>🏷️</span>
            <span>شجرة التصنيفات ({categories.length})</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="h-10 px-5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-2"
          >
            <span className="text-sm">＋</span>
            <span>إدراج قطعة جديدة</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('CATALOG')}
          className={`h-10 px-5 rounded-xl text-xs font-black transition flex items-center gap-2 ${
            activeTab === 'CATALOG'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>📦</span>
          <span>كتالوج القطع والمستودع ({items.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('MOVEMENTS')}
          className={`h-10 px-5 rounded-xl text-xs font-black transition flex items-center gap-2 ${
            activeTab === 'MOVEMENTS'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>📜</span>
          <span>سجل الحركات المخزنية ({movements.length})</span>
        </button>
      </div>

      {/* TAB 1: CATALOG & WAREHOUSE */}
      {activeTab === 'CATALOG' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Total Items */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-bold">إجمالي الأصناف</p>
                <p className="text-xl font-black text-slate-900 mt-1">{totalItemsCount} صنف</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-bold">في {categories.length} تصنيفات رئيسية</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-xl font-bold">
                📦
              </div>
            </div>

            {/* Total On Hand */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-bold">الموجود فعلياً (On Hand)</p>
                <p className="text-xl font-black text-slate-900 mt-1">{totalOnHandUnits} قطعة</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-bold">على أرفف المستودع</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center text-xl font-bold">
                🏢
              </div>
            </div>

            {/* Total Reserved */}
            <div className="bg-white p-4 rounded-2xl border border-indigo-200 shadow-sm flex items-center justify-between bg-indigo-50/20">
              <div>
                <p className="text-[11px] text-indigo-700 font-bold">المحجوز للأوامر (Reserved)</p>
                <p className="text-xl font-black text-indigo-600 mt-1">{totalReservedUnits} قطعة</p>
                <p className="text-[10px] text-indigo-500 mt-0.5 font-bold">مخصصة لسيارات تحت العمل</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-bold">
                🔒
              </div>
            </div>

            {/* Total Available */}
            <div className="bg-white p-4 rounded-2xl border border-emerald-300 shadow-sm flex items-center justify-between bg-emerald-50/30">
              <div>
                <p className="text-[11px] text-emerald-800 font-black">المتاح للصرف (Available)</p>
                <p className="text-xl font-black text-emerald-700 mt-1">{totalAvailableUnits} قطعة</p>
                <p className="text-[10px] text-emerald-600 font-bold mt-0.5">جاهز للتخصيص والبيع</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold">
                ⚡
              </div>
            </div>

            {/* Low Stock Alerts */}
            <div
              onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
              className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between cursor-pointer transition ${
                filterLowStockOnly
                  ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-500'
                  : 'bg-white border-slate-200 hover:border-rose-300'
              }`}
            >
              <div>
                <p className="text-[11px] font-bold text-rose-700">تنبيهات النواقص</p>
                <p className="text-xl font-black text-rose-600 mt-1">{lowStockCount} أصناف</p>
                <p className="text-[10px] text-rose-500 mt-0.5 font-bold">
                  {filterLowStockOnly ? 'إلغاء الفلتر' : 'وصلت أو قاربت حد التنبيه ⚠️'}
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center text-xl font-bold">
                ⚠️
              </div>
            </div>
          </div>

          {/* Equation Strip */}
          <div className="bg-slate-900 text-slate-200 px-5 py-3 rounded-2xl text-xs flex flex-wrap items-center justify-between gap-3 shadow-xs border border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-base">📐</span>
              <span className="font-bold">معادلة الرصيد الدفتري المعتمدة:</span>
              <span className="font-mono bg-slate-800 border border-slate-700 px-3 py-1 rounded-xl text-emerald-400 font-black">
                المتاح للصرف = الموجود فعلياً − المحجوز لأوامر الصيانة
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-bold">
              * الصرف للفني يستهلك المحجوز وينقص الفعلي، وفك الحجز يعيد الكمية للمتاح للصرف فوراً.
            </span>
          </div>

          {/* CATEGORIES NAVIGATION BAR */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-black text-slate-800 flex items-center gap-2">
                <span>🏷️</span>
                <span>التصنيفات الرئيسية للمستودع (Categories)</span>
              </span>
              <button
                onClick={() => {
                  setCategoryModalTab('NEW_MAIN');
                  setShowCategoryManagerModal(true);
                }}
                className="h-8 px-3 text-[11px] font-black text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition flex items-center gap-1.5"
              >
                <span>＋</span>
                <span>تصنيف رئيسي جديد</span>
              </button>
            </div>

            {/* Main Categories Pills */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setActiveCategoryId('ALL');
                  setActiveSubcategoryId('ALL');
                }}
                className={`h-9 px-4 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                  activeCategoryId === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>🌐</span>
                <span>كافة الأصناف ({items.length})</span>
              </button>

              {categories.map((cat) => {
                const count = items.filter((i) => i.category?.id === cat.id).length;
                const active = activeCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategoryId(cat.id);
                      setActiveSubcategoryId('ALL');
                    }}
                    className={`h-9 px-4 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                      active
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{cat.icon || '📁'}</span>
                    <span>{cat.nameAr}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                        active ? 'bg-indigo-900 text-indigo-200' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Subcategories Row */}
            {currentCategoryObj && currentCategoryObj.subcategories.length > 0 && (
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 ml-1">الفئات الفرعية:</span>
                <button
                  onClick={() => setActiveSubcategoryId('ALL')}
                  className={`h-7 px-3 rounded-lg text-[11px] font-black transition ${
                    activeSubcategoryId === 'ALL'
                      ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  الكل
                </button>

                {currentCategoryObj.subcategories.map((sub) => {
                  const subCount = items.filter((i) => i.subcategory?.id === sub.id).length;
                  const active = activeSubcategoryId === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setActiveSubcategoryId(sub.id)}
                      className={`h-7 px-3 rounded-lg text-[11px] font-black transition flex items-center gap-1 ${
                        active
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{sub.nameAr}</span>
                      <span className="text-[9px] opacity-75 font-mono">({subCount})</span>
                    </button>
                  );
                })}

                <button
                  onClick={() => {
                    setTargetParentCatId(currentCategoryObj.id);
                    setCategoryModalTab('NEW_SUB');
                    setShowCategoryManagerModal(true);
                  }}
                  className="h-7 px-3 text-[11px] text-indigo-700 hover:text-indigo-900 bg-indigo-50 rounded-lg font-black border border-indigo-200 ml-auto flex items-center gap-1"
                >
                  <span>＋</span>
                  <span>فئة فرعية تابعة</span>
                </button>
              </div>
            )}
          </div>

          {/* Search Bar & View Mode Toggle */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <span className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
                🔍
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث برقم القطعة OEM، رمز SKU، الاسم، الماركة..."
                className="w-full h-11 pr-10 pl-4 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs font-bold"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 left-3 flex items-center text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => setViewMode('cards')}
                className={`h-10 px-4 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                  viewMode === 'cards'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>🪟</span>
                <span>عرض كروت متناسقة</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`h-10 px-4 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                  viewMode === 'table'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>📑</span>
                <span>عرض جدول</span>
              </button>
            </div>
          </div>

          {/* ITEMS DISPLAY */}
          {loading ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <div className="animate-spin text-3xl">⚙️</div>
              <p className="text-xs font-black text-slate-600">جاري تحميل سجلات المستودع وقواعد الأرصدة...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <div className="text-4xl">📦</div>
              <h3 className="text-base font-black text-slate-800">لا توجد قطع مطابقة للبحث أو الفلتر</h3>
              <p className="text-xs text-slate-500 font-bold">جرب تغيير كلمات البحث أو اختيار تصنيف رئيسي آخر.</p>
              <button
                onClick={() => {
                  setSearch('');
                  setActiveCategoryId('ALL');
                  setActiveSubcategoryId('ALL');
                  setFilterLowStockOnly(false);
                }}
                className="h-10 px-5 bg-slate-900 text-white text-xs font-black rounded-xl"
              >
                إعادة ضبط الفلاتر
              </button>
            </div>
          ) : viewMode === 'cards' ? (
            /* Cards View - Fully Aligned Layout with Image & Equalized Height */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredItems.map((item) => {
                const onHand = Number(item.onHandQty || 0);
                const reserved = Number(item.reservedQty || 0);
                const available = Number(item.availableQty || 0);
                const imgUrl = getPartImage(item);

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between h-full"
                  >
                    <div className="space-y-3.5">
                      {/* Image Thumbnail Container */}
                      <div className="relative h-40 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 flex items-center justify-center group">
                        <img
                          src={imgUrl}
                          alt={item.nameAr}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = PART_PHOTO_PRESETS[0].url;
                          }}
                        />

                        {/* Overlay Badges */}
                        <div className="absolute top-2.5 right-2.5 flex flex-wrap items-center gap-1.5">
                          <span className="px-2.5 py-1 bg-slate-900/90 text-white text-[10px] font-mono font-black rounded-lg backdrop-blur-xs">
                            {item.sku}
                          </span>
                          {getQualityTierBadge(item.qualityTier)}
                        </div>

                        {item.isLowStock && (
                          <div className="absolute bottom-2.5 right-2.5">
                            <span className="px-2.5 py-1 bg-rose-600/95 text-white text-[10px] font-black rounded-lg shadow-sm backdrop-blur-xs flex items-center gap-1 animate-pulse">
                              <span>⚠️</span>
                              <span>تحت حد الطلب</span>
                            </span>
                          </div>
                        )}

                        {item.location && (
                          <div className="absolute bottom-2.5 left-2.5">
                            <span className="px-2.5 py-0.5 bg-black/60 text-slate-200 text-[10px] font-bold rounded-lg backdrop-blur-xs">
                              📍 {item.location}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Part Name & Brand */}
                      <div>
                        <h3 className="text-sm font-black text-slate-900 line-clamp-2 h-10 leading-snug">
                          {item.nameAr}
                        </h3>
                        {item.nameEn && (
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">{item.nameEn}</p>
                        )}
                      </div>

                      {/* Technical Specs & Supplier */}
                      <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-bold">رقم OEM:</span>
                          <span className="font-mono font-black text-slate-800">{item.oemPartNumber || 'بدون رقم'}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-bold">الماركة:</span>
                          <span className="font-bold text-slate-700">{item.brand || 'معتمد'}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-bold">التصنيف:</span>
                          <span className="text-indigo-600 font-bold truncate max-w-[200px]">
                            {item.category?.nameAr} ← {item.subcategory?.nameAr}
                          </span>
                        </div>
                        {item.supplierName && (
                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/50">
                            <span className="text-slate-400 font-bold">المورد:</span>
                            <span className="text-slate-700 font-black truncate max-w-[200px]" title={item.supplierName}>
                              {item.supplierName}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Balances Highlight Box */}
                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-2">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-white p-2 rounded-xl border border-slate-200/70 shadow-xs">
                            <span className="text-[10px] text-slate-500 font-bold block">الموجود فعلياً</span>
                            <span className="text-base font-black text-slate-800">{onHand}</span>
                            <span className="text-[9px] text-slate-400 font-bold block">{item.unit}</span>
                          </div>

                          <div className="bg-white p-2 rounded-xl border border-indigo-100 shadow-xs">
                            <span className="text-[10px] text-indigo-600 font-bold block">المحجوز للأمر</span>
                            <span className="text-base font-black text-indigo-700">{reserved}</span>
                            <span className="text-[9px] text-indigo-400 font-bold block">{item.unit}</span>
                          </div>

                          <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-300 shadow-xs">
                            <span className="text-[10px] text-emerald-800 font-black block">المتاح للصرف</span>
                            <span className="text-base font-black text-emerald-700">{available}</span>
                            <span className="text-[9px] text-emerald-600 font-bold block">{item.unit}</span>
                          </div>
                        </div>

                        {/* Cost & Sell Prices */}
                        <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-xs px-1">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block">سعر التكلفة</span>
                            <span className="font-bold text-slate-700">AED {item.costPrice}</span>
                          </div>
                          <div className="text-left">
                            <span className="text-[10px] text-slate-400 font-bold block">سعر البيع للعميل</span>
                            <span className="font-black text-emerald-700">AED {item.sellingPrice}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Aligned 2x2 Action Button Toolbar with Consistent Dimensions */}
                    <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 mt-4">
                      {/* Button 1: Stock In */}
                      <button
                        onClick={() => {
                          setStockInItem(item);
                          setStockInCost(item.costPrice || '');
                          if (item.supplierName && suppliersList.includes(item.supplierName)) {
                            setSelectedSupplier(item.supplierName);
                          }
                        }}
                        className="h-10 px-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                        title="استلام شحنة توريد من مورد"
                      >
                        <span className="text-sm">📥</span>
                        <span>توريد</span>
                      </button>

                      {/* Button 2: Reserve / Sell to Customer */}
                      <button
                        onClick={() => {
                          setReserveItem(item);
                          setReservePrice(item.sellingPrice || '');
                        }}
                        className="h-10 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                        title="حجز كمية لأمر صيانة سيارة أو بيع للعميل"
                      >
                        <span className="text-sm">🔒</span>
                        <span>حجز / بيع</span>
                      </button>

                      {/* Button 3: Dispense / Return */}
                      <button
                        onClick={() => handleOpenReservations(item)}
                        className="h-10 px-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1"
                        title="صرف للفني أو فك حجز أو إرجاع"
                      >
                        <span className="text-sm">🛠️</span>
                        <span>صرف/إرجاع ({reserved})</span>
                      </button>

                      {/* Button 4: Reconciliation */}
                      <button
                        onClick={() => {
                          setReconcileItem(item);
                          setReconcileCountedQty(onHand);
                        }}
                        className="h-10 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl transition flex items-center justify-center gap-1 border border-slate-200"
                        title="جرد وتسوية رصيد المستودع"
                      >
                        <span className="text-sm">📊</span>
                        <span>تسوية جرد</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View - Cleanly Aligned */
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-black">
                    <tr>
                      <th className="p-3.5">القطعة والصورة</th>
                      <th className="p-3.5">التصنيف</th>
                      <th className="p-3.5 text-center">الموجود فعلياً</th>
                      <th className="p-3.5 text-center">المحجوز</th>
                      <th className="p-3.5 text-center">المتاح للصرف</th>
                      <th className="p-3.5">سعر التكلفة</th>
                      <th className="p-3.5">سعر البيع</th>
                      <th className="p-3.5">المورد والرف</th>
                      <th className="p-3.5 text-center">الإجراءات التشغيلية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={getPartImage(item)}
                              alt={item.nameAr}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <p className="font-black text-slate-900">{item.nameAr}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                                <span className="font-mono text-slate-500 font-bold">SKU: {item.sku}</span>
                                {item.oemPartNumber && (
                                  <span className="font-mono text-indigo-600 font-bold">OEM: {item.oemPartNumber}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="text-slate-800 font-bold block">{item.category?.nameAr}</span>
                          <span className="text-[10px] text-slate-400">{item.subcategory?.nameAr}</span>
                        </td>
                        <td className="p-3.5 text-center font-bold text-slate-800">
                          {item.onHandQty} {item.unit}
                        </td>
                        <td className="p-3.5 text-center font-bold text-indigo-600">
                          {item.reservedQty} {item.unit}
                        </td>
                        <td className="p-3.5 text-center font-black text-emerald-700 bg-emerald-50/60">
                          {item.availableQty} {item.unit}
                        </td>
                        <td className="p-3.5 font-bold text-slate-600">AED {item.costPrice}</td>
                        <td className="p-3.5 font-black text-emerald-700">AED {item.sellingPrice}</td>
                        <td className="p-3.5 text-slate-500">
                          <p className="font-bold text-slate-700 truncate max-w-[120px]">{item.supplierName || '—'}</p>
                          <p className="text-[10px] text-slate-400">{item.location || '—'}</p>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setStockInItem(item);
                                setStockInCost(item.costPrice || '');
                                if (item.supplierName && suppliersList.includes(item.supplierName)) {
                                  setSelectedSupplier(item.supplierName);
                                }
                              }}
                              className="h-8 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-black"
                            >
                              📥 توريد
                            </button>
                            <button
                              onClick={() => {
                                setReserveItem(item);
                                setReservePrice(item.sellingPrice || '');
                              }}
                              className="h-8 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-black"
                            >
                              🔒 حجز
                            </button>
                            <button
                              onClick={() => handleOpenReservations(item)}
                              className="h-8 px-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-[11px] font-black"
                            >
                              🛠️ صرف ({item.reservedQty})
                            </button>
                            <button
                              onClick={() => {
                                setReconcileItem(item);
                                setReconcileCountedQty(item.onHandQty);
                              }}
                              className="h-8 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold border border-slate-200"
                            >
                              📊 جرد
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AUDIT MOVEMENTS LEDGER */}
      {activeTab === 'MOVEMENTS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>📜</span>
                <span>سجل الحركات المخزنية المعتمد (Immutable Audit Ledger)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                سجل موثق بالوقت والموظف ورقم المرجع لكافة عمليات الاستلام، الحجز، الصرف، الإرجاع، والتسويات.
              </p>
            </div>
            <button
              onClick={fetchData}
              className="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl flex items-center gap-1.5 self-start sm:self-auto border border-slate-200"
            >
              <span>🔄</span>
              <span>تحديث السجل</span>
            </button>
          </div>

          {movements.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-3xl mb-2">📜</p>
              <p className="text-xs font-bold">لا توجد حركات مخزنية مسجلة حتى الآن</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-black">
                  <tr>
                    <th className="p-3">التاريخ والوقت</th>
                    <th className="p-3">نوع الحركة</th>
                    <th className="p-3">القطعة والتصنيف</th>
                    <th className="p-3 text-center">الكمية</th>
                    <th className="p-3 text-center">الفعلي (قبل ← بعد)</th>
                    <th className="p-3 text-center">المحجوز (قبل ← بعد)</th>
                    <th className="p-3">المرجع</th>
                    <th className="p-3">الموظف / المنفذ</th>
                    <th className="p-3">الملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition font-sans">
                      <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(m.createdAt).toLocaleString('ar-AE', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-3 whitespace-nowrap">{getMovementTypeBadge(m.movementType)}</td>
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{m.item?.nameAr}</span>
                        <span className="text-[10px] text-slate-400 font-mono">SKU: {m.item?.sku}</span>
                      </td>
                      <td className="p-3 text-center font-black text-sm">
                        <span
                          className={
                            m.movementType === 'STOCK_IN' || m.movementType === 'INITIAL_STOCK' || m.movementType === 'JOB_RETURN_GOOD'
                              ? 'text-emerald-600 font-mono'
                              : m.movementType === 'JOB_DISPENSE'
                              ? 'text-rose-600 font-mono'
                              : 'text-indigo-600 font-mono'
                          }
                        >
                          {m.quantity} {m.item?.unit}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {m.previousOnHand} ← <span className="font-bold text-slate-900">{m.newOnHand}</span>
                      </td>
                      <td className="p-3 text-center font-mono text-[11px] text-indigo-700 whitespace-nowrap">
                        {m.previousReserved} ← <span className="font-bold">{m.newReserved}</span>
                      </td>
                      <td className="p-3 text-[11px] font-mono text-slate-600">
                        {m.referenceType ? `${m.referenceType}: ${m.referenceId?.slice(0, 8) || ''}` : '—'}
                      </td>
                      <td className="p-3 text-slate-700 font-bold text-[11px]">
                        {m.actorUser?.fullName || 'مسؤول المخزون'}
                      </td>
                      <td className="p-3 text-slate-500 text-[11px] max-w-xs truncate" title={m.notes || ''}>
                        {m.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 1: STOCK IN (استلام توريد مع اختيار المورد من السيستم) */}
      {/* ============================================================= */}
      {stockInItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📥</span>
                <div>
                  <h3 className="text-base font-black text-slate-900">استلام توريد قطع غيار (Stock In)</h3>
                  <p className="text-xs text-slate-500">إدخال شحنة وزيادة الرصيد الفعلي في المستودع</p>
                </div>
              </div>
              <button onClick={() => setStockInItem(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <p className="text-xs font-black text-slate-900">{stockInItem.nameAr}</p>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                <span>SKU: <strong className="font-mono text-slate-800">{stockInItem.sku}</strong></span>
                <span>الموجود حالياً: <strong className="text-slate-800">{stockInItem.onHandQty} {stockInItem.unit}</strong></span>
              </div>
            </div>

            <form onSubmit={handleStockInSubmit} className="space-y-3.5">
              {/* Supplier Selection from System */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">
                  اختر المورد من المسجلين في النظام *
                </label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full h-11 p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  {suppliersList.map((sup, idx) => (
                    <option key={idx} value={sup}>
                      🏢 {sup}
                    </option>
                  ))}
                  <option value="CUSTOM">➕ إدخال اسم مورد جديد...</option>
                </select>

                {selectedSupplier === 'CUSTOM' && (
                  <input
                    type="text"
                    required
                    value={customSupplierName}
                    onChange={(e) => setCustomSupplierName(e.target.value)}
                    placeholder="اكتب اسم المورد الجديد هنا..."
                    className="w-full h-11 mt-2 p-2.5 bg-white border border-indigo-300 rounded-xl text-xs font-bold"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الكمية المستلمة *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={stockInQty}
                    onChange={(e) => setStockInQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full h-11 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">سعر التكلفة للوحدة (AED)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={stockInCost}
                    onChange={(e) => setStockInCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder={`الحالي: ${stockInItem.costPrice}`}
                    className="w-full h-11 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم فاتورة / سند التوريد</label>
                <input
                  type="text"
                  value={stockInInvoice}
                  onChange={(e) => setStockInInvoice(e.target.value)}
                  placeholder="مثال: INV-2026-9021"
                  className="w-full h-11 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات التوريد</label>
                <input
                  type="text"
                  value={stockInNotes}
                  onChange={(e) => setStockInNotes(e.target.value)}
                  placeholder="مثال: استلام دفعة الصيانة الدورية"
                  className="w-full h-11 p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setStockInItem(null)}
                  className="h-10 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md"
                >
                  اعتماد التوريد بالمستودع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 2: RESERVE FOR JOB / CUSTOMER (اختيار العميل وأمر الصيانة) */}
      {/* ============================================================= */}
      {reserveItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔒</span>
                <div>
                  <h3 className="text-base font-black text-slate-900">حجز وصرف لعميل / أمر صيانة</h3>
                  <p className="text-xs text-slate-500">اختر العميل أو السيارة من المسجلين بالورشة لحجز القطعة</p>
                </div>
              </div>
              <button onClick={() => setReserveItem(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
              <p className="text-xs font-black text-slate-900">{reserveItem.nameAr}</p>
              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span>الموجود فعلياً: <strong className="text-slate-800">{reserveItem.onHandQty}</strong></span>
                <span>المحجوز مسبقاً: <strong className="text-indigo-600">{reserveItem.reservedQty}</strong></span>
                <span>المتاح للصرف: <strong className="text-emerald-700 font-black">{reserveItem.availableQty} {reserveItem.unit}</strong></span>
              </div>
            </div>

            <form onSubmit={handleReserveSubmit} className="space-y-3.5">
              {/* Select Customer / Job Order from System */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">
                  اختر العميل وأمر الصيانة من النظام *
                </label>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full h-11 p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  {activeJobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      🚗 {j.plateNumber} ({j.vehicleDescription}) — العميل: {j.customerName}
                    </option>
                  ))}
                  <option value="DIRECT_SALE">🏷️ بيع مباشر كاونتر / عميل خارجي بدون أمر صيانة</option>
                </select>

                {selectedJobId === 'DIRECT_SALE' && (
                  <input
                    type="text"
                    required
                    value={customCustomerInfo}
                    onChange={(e) => setCustomCustomerInfo(e.target.value)}
                    placeholder="اسم العميل ورقم هاتفه (مثال: عبدالله الهاشمي 0501234567)..."
                    className="w-full h-11 mt-2 p-2.5 bg-white border border-indigo-300 rounded-xl text-xs font-bold"
                  />
                )}

                {/* Display Selected Job Customer Card */}
                {selectedJobObj && selectedJobId !== 'DIRECT_SALE' && (
                  <div className="mt-2.5 p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">العميل: {selectedJobObj.customerName}</span>
                      <span className="font-mono text-slate-500">{selectedJobObj.customerPhone}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-indigo-900 font-bold">
                      <span>المركبة: {selectedJobObj.vehicleDescription}</span>
                      <span className="bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                        لوحة: {selectedJobObj.plateNumber}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الكمية المطلوبة *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={reserveQty}
                    onChange={(e) => setReserveQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full h-11 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-900"
                  />
                  {reserveQty > reserveItem.availableQty && (
                    <p className="text-[10px] text-amber-600 font-bold mt-1">
                      ⚠️ المطلوب ({reserveQty}) يتجاوز المتاح ({reserveItem.availableQty})، سيتم حجز المتاح وتسجيل عجز ({reserveQty - reserveItem.availableQty}).
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">سعر بيع البند للعميل (AED)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={reservePrice}
                    onChange={(e) => setReservePrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder={`الافتراضي: ${reserveItem.sellingPrice}`}
                    className="w-full h-11 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات الحجز</label>
                <input
                  type="text"
                  value={reserveNotes}
                  onChange={(e) => setReserveNotes(e.target.value)}
                  placeholder="مثال: حجز فحمات للتركيب الفوري بالورشة"
                  className="w-full h-11 p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setReserveItem(null)}
                  className="h-10 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md"
                >
                  تأكيد الحجز الذري للعميل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 3: DISPENSE / RETURN / RELEASE (صرف للفني / فك حجز / إرجاع) */}
      {/* ============================================================= */}
      {manageReservationsItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛠️</span>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    إدارة حجوزات وصرف وإرجاع: {manageReservationsItem.nameAr}
                  </h3>
                  <p className="text-xs text-slate-500">
                    المحجوز كلياً: {manageReservationsItem.reservedQty} | الموجود فعلياً: {manageReservationsItem.onHandQty}
                  </p>
                </div>
              </div>
              <button onClick={() => setManageReservationsItem(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>

            {activePartReservations.length === 0 ? (
              <div className="bg-slate-50 p-8 rounded-2xl text-center text-slate-500 space-y-2">
                <p className="text-3xl">🔍</p>
                <p className="text-xs font-black">لا توجد حجوزات نشطة حالياً لهذه القطعة على أي أمر صيانة.</p>
                <p className="text-[11px] text-slate-400 font-bold">يمكنك إنشاء حجز جديد من كرت القطعة بزر "حجز / بيع".</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-black text-slate-800">قائمة أوامر الصيانة الحاجزة لهذه القطعة:</p>

                {activePartReservations.map((res: any) => {
                  const unissued = Number(res.reservedQty) - Number(res.dispensedQty);
                  const netDispensed = Number(res.dispensedQty) - Number(res.returnedQty);

                  return (
                    <div
                      key={res.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-mono font-black text-xs text-slate-900">
                            أمر صيانة #{res.jobId.slice(0, 8)}
                          </span>
                          {res.job?.vehicle?.plateNumber && (
                            <span className="mr-2 px-2.5 py-0.5 bg-slate-200 text-slate-800 text-[10px] font-bold rounded-md">
                              🚗 لوحة: {res.job.vehicle.plateNumber}
                            </span>
                          )}
                        </div>
                        <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-900 text-[10px] font-bold rounded-lg">
                          الحالة: {res.status}
                        </span>
                      </div>

                      {/* Quantities Breakdown */}
                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 font-bold block">المطلوب</span>
                          <span className="font-black text-slate-800 text-sm">{res.requestedQty}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                          <span className="text-[10px] text-indigo-600 font-bold block">المحجوز</span>
                          <span className="font-black text-indigo-700 text-sm">{res.reservedQty}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                          <span className="text-[10px] text-amber-700 font-bold block">المصروف</span>
                          <span className="font-black text-amber-800 text-sm">{res.dispensedQty}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-teal-100">
                          <span className="text-[10px] text-teal-700 font-bold block">المرتجع</span>
                          <span className="font-black text-teal-800 text-sm">{res.returnedQty}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-2">
                        {unissued > 0 && (
                          <button
                            onClick={() => {
                              setSelectedReservationId(res.id);
                              setActiveActionType('DISPENSE');
                              setDispenseQty(unissued);
                            }}
                            className="h-9 px-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs"
                          >
                            📦 صرف للفني (متبقي: {unissued})
                          </button>
                        )}

                        {unissued > 0 && (
                          <button
                            onClick={() => handleReleaseSubmit(res.id)}
                            className="h-9 px-3.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-black text-xs rounded-xl"
                          >
                            🔓 فك حجز ({unissued})
                          </button>
                        )}

                        {netDispensed > 0 && (
                          <button
                            onClick={() => {
                              setSelectedReservationId(res.id);
                              setActiveActionType('RETURN');
                              setReturnQty(netDispensed);
                            }}
                            className="h-9 px-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl shadow-xs"
                          >
                            ↩️ إرجاع من الأمر (صافي المصروف: {netDispensed})
                          </button>
                        )}
                      </div>

                      {/* Sub-form: Dispense */}
                      {selectedReservationId === res.id && activeActionType === 'DISPENSE' && (
                        <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 space-y-2 mt-2">
                          <p className="text-xs font-black text-amber-900">تسليم القطعة للفني للتركيب:</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-amber-800">الكمية المصروفة</label>
                              <input
                                type="number"
                                min="1"
                                max={unissued}
                                value={dispenseQty}
                                onChange={(e) => setDispenseQty(parseInt(e.target.value) || 1)}
                                className="w-full h-10 p-2 bg-white border border-amber-300 rounded-lg text-xs font-black"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-amber-800">اسم الفني المستلم</label>
                              <input
                                type="text"
                                value={dispenseTechName}
                                onChange={(e) => setDispenseTechName(e.target.value)}
                                placeholder="مثال: فني الميكانيكا راشد"
                                className="w-full h-10 p-2 bg-white border border-amber-300 rounded-lg text-xs"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setActiveActionType('NONE')}
                              className="h-8 px-3 bg-white text-slate-600 text-xs font-bold rounded-lg border border-slate-200"
                            >
                              إلغاء
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDispenseSubmit(res.id)}
                              className="h-8 px-4 bg-amber-600 text-white text-xs font-black rounded-lg"
                            >
                              تأكيد الصرف
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Sub-form: Return */}
                      {selectedReservationId === res.id && activeActionType === 'RETURN' && (
                        <div className="bg-teal-50 p-3.5 rounded-xl border border-teal-200 space-y-2 mt-2">
                          <p className="text-xs font-black text-teal-900">إرجاع قطعة من أمر الصيانة:</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-teal-800">الكمية المرتجعة</label>
                              <input
                                type="number"
                                min="1"
                                max={netDispensed}
                                value={returnQty}
                                onChange={(e) => setReturnQty(parseInt(e.target.value) || 1)}
                                className="w-full h-10 p-2 bg-white border border-teal-300 rounded-lg text-xs font-black"
                              />
                            </div>
                            <div className="flex items-center pt-4">
                              <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-rose-800">
                                <input
                                  type="checkbox"
                                  checked={returnIsDefective}
                                  onChange={(e) => setReturnIsDefective(e.target.checked)}
                                  className="w-4 h-4 text-rose-600 rounded"
                                />
                                <span>القطعة تالفة (خارج الرصيد الصالح)</span>
                              </label>
                            </div>
                          </div>

                          {returnIsDefective && (
                            <div>
                              <label className="block text-[11px] font-bold text-rose-800">سبب التلف</label>
                              <input
                                type="text"
                                value={returnDefectReason}
                                onChange={(e) => setReturnDefectReason(e.target.value)}
                                placeholder="مثال: كسر أثناء التركيب، عيب مصنعي"
                                className="w-full h-10 p-2 bg-white border border-rose-300 rounded-lg text-xs"
                              />
                            </div>
                          )}

                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setActiveActionType('NONE')}
                              className="h-8 px-3 bg-white text-slate-600 text-xs font-bold rounded-lg border border-slate-200"
                            >
                              إلغاء
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReturnSubmit(res.id)}
                              className="h-8 px-4 bg-teal-700 text-white text-xs font-black rounded-lg"
                            >
                              تأكيد الإرجاع
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 4: CYCLE COUNT RECONCILIATION (تسوية جرد دوري) */}
      {/* ============================================================= */}
      {reconcileItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📊</span>
                <div>
                  <h3 className="text-base font-black text-slate-900">جرد وتسوية مخزنية (Cycle Count)</h3>
                  <p className="text-xs text-slate-500">مطابقة الرصيد الفعلي بالرصيد الدفتري واعتماد الفروقات</p>
                </div>
              </div>
              <button onClick={() => setReconcileItem(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
              <p className="text-xs font-black text-slate-900">{reconcileItem.nameAr}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">الرصيد الدفتري الحالي:</span>
                  <span className="font-black text-slate-800">{reconcileItem.onHandQty} {reconcileItem.unit}</span>
                </div>
                <div>
                  <span className="text-[10px] text-indigo-500 font-bold block">المحجوز لأوامر نشطة:</span>
                  <span className="font-black text-indigo-600">{reconcileItem.reservedQty} {reconcileItem.unit}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleReconcileSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الكمية الفعلية المعدودة على الرف *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={reconcileCountedQty}
                  onChange={(e) => setReconcileCountedQty(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                  className="w-full h-11 p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900"
                />
              </div>

              {/* Calculated Difference */}
              {reconcileCountedQty !== '' && (
                <div className="p-3 rounded-xl border bg-slate-50 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600">فرق الجرد (الفعلي − الدفتري):</span>
                  <span
                    className={`font-black text-sm font-mono ${
                      Number(reconcileCountedQty) - Number(reconcileItem.onHandQty) >= 0
                        ? 'text-emerald-700'
                        : 'text-rose-600'
                    }`}
                  >
                    {Number(reconcileCountedQty) - Number(reconcileItem.onHandQty) >= 0 ? '+' : ''}
                    {Number(reconcileCountedQty) - Number(reconcileItem.onHandQty)} {reconcileItem.unit}
                  </span>
                </div>
              )}

              {/* Blocking Conflict Warning */}
              {reconcileCountedQty !== '' && Number(reconcileCountedQty) < Number(reconcileItem.reservedQty) && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-bold">
                  ⛔ تعارض في الجرد: الكمية الفعلية المعدودة ({reconcileCountedQty}) أقل من الكمية المحجوزة حالياً لأوامر الصيانة النشطة ({reconcileItem.reservedQty}).
                  يرجى فك أو إلغاء الحجوزات غير اللازمة قبل اعتماد التسوية.
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">سبب التسوية الإلزامي *</label>
                <input
                  type="text"
                  required
                  value={reconcileReason}
                  onChange={(e) => setReconcileReason(e.target.value)}
                  placeholder="مثال: جرد دوري لشهر نوفمبر، تلف طبيعي، تصحيح إدخال"
                  className="w-full h-11 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setReconcileItem(null)}
                  className="h-10 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={reconcileCountedQty !== '' && Number(reconcileCountedQty) < Number(reconcileItem.reservedQty)}
                  className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md"
                >
                  اعتماد التسوية وتوثيق الفرق
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 5: ADD NEW INVENTORY ITEM WITH IMAGE SUPPORT & SUPPLIERS */}
      {/* ============================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">إدراج قطعة غيار / منتج جديد</h3>
                <p className="text-xs text-slate-500">التصنيف الرئيسي والفئة الفرعية وصورة القطعة والمورد</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePartSubmit} className="space-y-4">
              {/* IMAGE SELECTION & LIVE PREVIEW */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <span>📸</span>
                  <span>صورة كرت القطعة (Image & Photo Presets)</span>
                </span>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Live Image Preview */}
                  <div className="w-28 h-28 rounded-2xl overflow-hidden bg-slate-200 border-2 border-indigo-200 shrink-0 shadow-xs">
                    {newItem.imageUrl ? (
                      <img src={newItem.imageUrl} alt="معاينة" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-2xl font-bold">
                        📷
                      </div>
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <label className="block text-[11px] font-bold text-slate-600">
                      رابط الصورة (URL) أو ارفع صورة من جهازك:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={newItem.imageUrl}
                        onChange={(e) => setNewItem({ ...newItem, imageUrl: e.target.value })}
                        placeholder="https://example.com/part.jpg"
                        className="flex-1 h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold"
                      />
                      <label className="h-10 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer shrink-0">
                        <span>📁</span>
                        <span>رفع صورة</span>
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </div>

                    {/* Quick Photo Presets Gallery */}
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold mb-1">
                        أو اختر صورة جاهزة عالية الدقة بنقرة واحدة:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {PART_PHOTO_PRESETS.map((preset, idx) => (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => setNewItem({ ...newItem, imageUrl: preset.url })}
                            className={`px-2 py-1 rounded-lg text-[10px] font-black border transition ${
                              newItem.imageUrl === preset.url
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category & Subcategory Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1">التصنيف الرئيسي (Category) *</label>
                  <select
                    required
                    value={newItem.categoryId}
                    onChange={(e) => {
                      const selCat = categories.find((c) => c.id === e.target.value);
                      setNewItem({
                        ...newItem,
                        categoryId: e.target.value,
                        subcategoryId: selCat?.subcategories?.[0]?.id || '',
                      });
                    }}
                    className="w-full h-11 p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon || '📁'} {c.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1">الفئة الفرعية (Subcategory) *</label>
                  <select
                    required
                    value={newItem.subcategoryId}
                    onChange={(e) => setNewItem({ ...newItem, subcategoryId: e.target.value })}
                    className="w-full h-11 p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900"
                  >
                    {categories
                      .find((c) => c.id === newItem.categoryId)
                      ?.subcategories.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nameAr}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* SKU & OEM Part Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رمز القطعة الداخلي (SKU) *</label>
                  <input
                    type="text"
                    required
                    value={newItem.sku}
                    onChange={(e) => setNewItem({ ...newItem, sku: e.target.value.toUpperCase() })}
                    placeholder="مثال: BRK-CAM-01"
                    className="w-full h-11 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم المصنع OEM / Part Number</label>
                  <input
                    type="text"
                    value={newItem.oemPartNumber}
                    onChange={(e) => setNewItem({ ...newItem, oemPartNumber: e.target.value })}
                    placeholder="مثال: 04465-33471"
                    className="w-full h-11 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم القطعة بالعربية *</label>
                  <input
                    type="text"
                    required
                    value={newItem.nameAr}
                    onChange={(e) => setNewItem({ ...newItem, nameAr: e.target.value })}
                    placeholder="مثال: فحمات فرامل أمامية كامري"
                    className="w-full h-11 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الاسم بالإنجليزية</label>
                  <input
                    type="text"
                    value={newItem.nameEn}
                    onChange={(e) => setNewItem({ ...newItem, nameEn: e.target.value })}
                    placeholder="Front Brake Pads Camry"
                    className="w-full h-11 p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Brand & Quality & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">العلامة التجارية / الماركة</label>
                  <input
                    type="text"
                    value={newItem.brand}
                    onChange={(e) => setNewItem({ ...newItem, brand: e.target.value })}
                    placeholder="Toyota Genuine, Bosch..."
                    className="w-full h-11 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">درجة الجودة</label>
                  <select
                    value={newItem.qualityTier}
                    onChange={(e: any) => setNewItem({ ...newItem, qualityTier: e.target.value })}
                    className="w-full h-11 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black"
                  >
                    <option value="OEM">⭐ أصلي وكالة (OEM)</option>
                    <option value="OES">🔹 مطابق للأصل (OES)</option>
                    <option value="AFTERMARKET_PREMIUM">تجاري درجة أولى ممتازة</option>
                    <option value="AFTERMARKET_STANDARD">تجاري قياسي</option>
                    <option value="USED_TESTED">مستعمل مفحوص ومضمون</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">وحدة القياس</label>
                  <input
                    type="text"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    placeholder="قطعة، طقم، لتر، علبة"
                    className="w-full h-11 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              {/* Initial Qty, Reorder Level, Shelf Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الرصيد الافتتاحي المستلم</label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.initialQty}
                    onChange={(e) => setNewItem({ ...newItem, initialQty: parseInt(e.target.value) || 0 })}
                    className="w-full h-11 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">حد التنبيه (Reorder Level)</label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.reorderLevel}
                    onChange={(e) => setNewItem({ ...newItem, reorderLevel: parseInt(e.target.value) || 5 })}
                    className="w-full h-11 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">مكان الرف / المستودع</label>
                  <input
                    type="text"
                    value={newItem.location}
                    onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                    placeholder="مستودع أ - رف 2"
                    className="w-full h-11 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              {/* Prices & Supplier Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">سعر التكلفة (AED)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItem.costPrice}
                    onChange={(e) => setNewItem({ ...newItem, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full h-11 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">سعر البيع للعميل (AED)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItem.sellingPrice}
                    onChange={(e) => setNewItem({ ...newItem, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full h-11 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1">المورد المعتمد</label>
                  <select
                    value={newItem.supplierName}
                    onChange={(e) => setNewItem({ ...newItem, supplierName: e.target.value })}
                    className="w-full h-11 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  >
                    {suppliersList.map((sup, idx) => (
                      <option key={idx} value={sup}>
                        {sup}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Vehicles Compatibility */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">السيارات والموديلات المتوافقة</label>
                <input
                  type="text"
                  value={newItem.compatibleVehicles}
                  onChange={(e) => setNewItem({ ...newItem, compatibleVehicles: e.target.value })}
                  placeholder="Toyota Camry 2018-2024, Avalon 2019+"
                  className="w-full h-11 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-10 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md"
                >
                  حفظ وإدراج القطعة في المستودع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 6: CATEGORIES & SUBCATEGORIES MANAGER */}
      {/* ============================================================= */}
      {showCategoryManagerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚙️</span>
                <div>
                  <h3 className="text-base font-black text-slate-900">إدارة تصنيفات المستودع (Categories)</h3>
                  <p className="text-xs text-slate-500">هيكلة التصنيفات الرئيسية والفئات الفرعية</p>
                </div>
              </div>
              <button
                onClick={() => setShowCategoryManagerModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <button
                onClick={() => setCategoryModalTab('NEW_MAIN')}
                className={`h-9 px-3.5 rounded-xl text-xs font-black transition ${
                  categoryModalTab === 'NEW_MAIN' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                }`}
              >
                ＋ تصنيف رئيسي جديد
              </button>
              <button
                onClick={() => setCategoryModalTab('NEW_SUB')}
                className={`h-9 px-3.5 rounded-xl text-xs font-black transition ${
                  categoryModalTab === 'NEW_SUB' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                }`}
              >
                ＋ فئة فرعية جديدة
              </button>
              <button
                onClick={() => setCategoryModalTab('TREE')}
                className={`h-9 px-3.5 rounded-xl text-xs font-black transition ${
                  categoryModalTab === 'TREE' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                }`}
              >
                📋 شجرة التصنيفات ({categories.length})
              </button>
            </div>

            {/* Tab 1: New Main Category */}
            {categoryModalTab === 'NEW_MAIN' && (
              <form onSubmit={handleCreateMainCat} className="space-y-3.5 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم التصنيف الرئيسي (عربي) *</label>
                  <input
                    type="text"
                    required
                    value={newCatNameAr}
                    onChange={(e) => setNewCatNameAr(e.target.value)}
                    placeholder="مثال: ناقل الحركة والدفرنس"
                    className="w-full h-11 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">الاسم بالإنجليزية</label>
                    <input
                      type="text"
                      value={newCatNameEn}
                      onChange={(e) => setNewCatNameEn(e.target.value)}
                      placeholder="Transmission & Differential"
                      className="w-full h-11 p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">الأيقونة / الرمز</label>
                    <input
                      type="text"
                      value={newCatIcon}
                      onChange={(e) => setNewCatIcon(e.target.value)}
                      className="w-full h-11 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-center text-lg"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowCategoryManagerModal(false)}
                    className="h-10 px-5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md"
                  >
                    إنشاء التصنيف الرئيسي
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: New Subcategory */}
            {categoryModalTab === 'NEW_SUB' && (
              <form onSubmit={handleCreateSubCat} className="space-y-3.5 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التصنيف الرئيسي التابع له *</label>
                  <select
                    value={targetParentCatId || categories[0]?.id}
                    onChange={(e) => setTargetParentCatId(e.target.value)}
                    className="w-full h-11 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon || '📁'} {c.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم الفئة الفرعية (عربي) *</label>
                  <input
                    type="text"
                    required
                    value={newSubNameAr}
                    onChange={(e) => setNewSubNameAr(e.target.value)}
                    placeholder="مثال: فلاتر قير أوتوماتيك"
                    className="w-full h-11 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الاسم بالإنجليزية</label>
                  <input
                    type="text"
                    value={newSubNameEn}
                    onChange={(e) => setNewSubNameEn(e.target.value)}
                    placeholder="Automatic Transmission Filters"
                    className="w-full h-11 p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowCategoryManagerModal(false)}
                    className="h-10 px-5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md"
                  >
                    إنشاء الفئة الفرعية
                  </button>
                </div>
              </form>
            )}

            {/* Tab 3: Tree View */}
            {categoryModalTab === 'TREE' && (
              <div className="space-y-3 pt-1">
                {categories.map((c) => (
                  <div key={c.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-slate-800 flex items-center gap-1.5">
                        <span className="text-base">{c.icon || '📁'}</span>
                        <span>{c.nameAr}</span>
                        {c.nameEn && <span className="text-[10px] text-slate-400 font-mono">({c.nameEn})</span>}
                      </span>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full font-mono font-bold">
                        {c._count?.items ?? items.filter((i) => i.category?.id === c.id).length} قطع
                      </span>
                    </div>

                    <div className="pr-4 flex flex-wrap gap-1.5 border-t border-slate-200/60 pt-2">
                      {c.subcategories.map((s) => (
                        <span
                          key={s.id}
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700 font-black shadow-xs"
                        >
                          {s.nameAr}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
