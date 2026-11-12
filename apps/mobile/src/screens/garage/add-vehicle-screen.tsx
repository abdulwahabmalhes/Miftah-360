import React, { useState, useEffect } from 'react';
import { useI18n } from '../../context/i18n-context';
import { mobileApi } from '../../api/mobile-client';
import { Emirate } from '@miftah/contracts';

interface AddVehicleScreenProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddVehicleScreen: React.FC<AddVehicleScreenProps> = ({ onSuccess, onCancel }) => {
  const { t, language } = useI18n();

  // Brands & Models Master Data
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string>('');

  // Required Fields
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [mileage, setMileage] = useState<number>(10000);

  // Optional Accordion & Fields
  const [showOptional, setShowOptional] = useState(false);
  const [trim, setTrim] = useState('');
  const [fuelType, setFuelType] = useState<string>('PETROL');
  const [transmission, setTransmission] = useState<string>('AUTOMATIC');
  const [vin, setVin] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [plateEmirate, setPlateEmirate] = useState<Emirate>(Emirate.DUBAI);
  const [registrationExpiry, setRegistrationExpiry] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBrands = async () => {
      try {
        setLoading(true);
        const data = await mobileApi.getBrands();
        setBrands(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load vehicle brands');
      } finally {
        setLoading(false);
      }
    };
    loadBrands();
  }, []);

  const handleBrandChange = async (brandId: string) => {
    setSelectedBrandId(brandId);
    setSelectedModelId('');
    if (!brandId) {
      setModels([]);
      return;
    }
    try {
      const data = await mobileApi.getModels(brandId);
      setModels(data || []);
    } catch (e) {
      console.error('Failed to load models for brand:', e);
      setModels([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrandId || !selectedModelId || !year || mileage === undefined) {
      setError(language === 'ar' ? 'يرجى إكمال الحقول الإلزامية' : 'Please complete all required fields');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await mobileApi.createVehicle({
        brandId: selectedBrandId,
        modelId: selectedModelId,
        year: Number(year),
        mileage: Number(mileage),
        trim: trim.trim() || undefined,
        fuelType: fuelType || undefined,
        transmission: transmission || undefined,
        vin: vin.trim() || undefined,
        plateNumber: plateNumber.trim() || undefined,
        emirate: plateEmirate || undefined,
        registrationExpiry: registrationExpiry ? new Date(registrationExpiry).toISOString() : undefined,
        insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry).toISOString() : undefined,
        notes: notes.trim() || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 p-4 flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">{t('vehicle.addTitle')}</h2>
        <button
          onClick={onCancel}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          {t('common.cancel')}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 pb-6">
        {/* Required Fields Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <span className="text-[11px] font-bold text-[#0E7C86] uppercase tracking-wider block">
            {t('vehicle.requiredSection')}
          </span>

          {/* Brand Picker */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {t('vehicle.brand')} *
            </label>
            <select
              required
              value={selectedBrandId}
              onChange={(e) => handleBrandChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0E7C86]"
            >
              <option value="">-- {t('vehicle.selectBrand')} --</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Model Picker */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {t('vehicle.model')} *
            </label>
            <select
              required
              disabled={!selectedBrandId}
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0E7C86] disabled:bg-slate-50"
            >
              <option value="">-- {t('vehicle.selectModel')} --</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Year & Mileage Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t('vehicle.year')} *
              </label>
              <input
                type="number"
                required
                min={1980}
                max={new Date().getFullYear() + 1}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0E7C86]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t('vehicle.mileage')} *
              </label>
              <input
                type="number"
                required
                min={0}
                step={100}
                value={mileage}
                onChange={(e) => setMileage(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0E7C86]"
              />
            </div>
          </div>
        </div>

        {/* Optional Fields Accordion */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowOptional(!showOptional)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition"
          >
            <span className="text-xs font-bold text-slate-800">
              {t('vehicle.optionalSection')}
            </span>
            <span className="text-xs text-slate-400 font-bold">{showOptional ? '▲' : '▼'}</span>
          </button>

          {showOptional && (
            <div className="p-4 pt-0 space-y-3 border-t border-slate-100">
              {/* Trim */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t('vehicle.trim')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. V8, Platinum, Sport"
                  value={trim}
                  onChange={(e) => setTrim(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0E7C86]"
                />
              </div>

              {/* Fuel & Transmission */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {t('vehicle.fuelType')}
                  </label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0E7C86]"
                  >
                    <option value="PETROL">Petrol (بنزين)</option>
                    <option value="DIESEL">Diesel (ديزل)</option>
                    <option value="HYBRID">Hybrid (هجين)</option>
                    <option value="ELECTRIC">Electric (كهربائي)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {t('vehicle.transmission')}
                  </label>
                  <select
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0E7C86]"
                  >
                    <option value="AUTOMATIC">Automatic (أوتوماتيك)</option>
                    <option value="MANUAL">Manual (يدوي)</option>
                  </select>
                </div>
              </div>

              {/* Plate & Emirate */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {t('vehicle.plateEmirate')}
                  </label>
                  <select
                    value={plateEmirate}
                    onChange={(e) => setPlateEmirate(e.target.value as Emirate)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0E7C86]"
                  >
                    <option value={Emirate.DUBAI}>Dubai (دبي)</option>
                    <option value={Emirate.SHARJAH}>Sharjah (الشارقة)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {t('vehicle.plateNumber')}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. B 12345"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#0E7C86]"
                  />
                </div>
              </div>

              {/* VIN */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t('vehicle.vin')}
                </label>
                <input
                  type="text"
                  maxLength={17}
                  placeholder="17-character VIN"
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#0E7C86]"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {t('vehicle.registrationExpiry')}
                  </label>
                  <input
                    type="date"
                    value={registrationExpiry}
                    onChange={(e) => setRegistrationExpiry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0E7C86]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {t('vehicle.insuranceExpiry')}
                  </label>
                  <input
                    type="date"
                    value={insuranceExpiry}
                    onChange={(e) => setInsuranceExpiry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0E7C86]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t('vehicle.notes')}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={language === 'ar' ? 'أي ملاحظات خاصة بالمركبة...' : 'Any notes...'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0E7C86]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-gradient-to-r from-[#0E7C86] to-[#0A4D56] hover:from-[#0A4D56] hover:to-[#061E23] text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50"
        >
          {saving ? t('common.saving') : t('vehicle.save')}
        </button>
      </form>
    </div>
  );
};
