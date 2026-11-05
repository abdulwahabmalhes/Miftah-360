import React, { useState } from 'react';
import { useI18n } from '../../context/i18n-context';

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export const PosCheckout: React.FC = () => {
  const { language } = useI18n();

  const [customerName, setCustomerName] = useState('منصور المنصوري');
  const [vehiclePlate, setVehiclePlate] = useState('دبي A 12345');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'CASH' | 'SPLIT'>('CARD');

  const [cart, setCart] = useState<CartItem[]>([
    { id: '1', name: 'تغيير زيت تخليقي 5W-30 وفلتر', price: 150, qty: 1 },
    { id: '2', name: 'سفايف فرامل سيراميك أصلي', price: 280, qty: 1 },
  ]);

  const [quickServices] = useState([
    { id: 'qs-1', name: 'تغيير زيت وفلتر', price: 150 },
    { id: 'qs-2', name: 'فحص كمبيوتر شامل', price: 100 },
    { id: 'qs-3', name: 'تعبئة غاز مكيف R134a', price: 280 },
    { id: 'qs-4', name: 'ميزان ليزر وترصيص', price: 180 },
    { id: 'qs-5', name: 'تلميع ساطع وغسيل', price: 350 },
    { id: 'qs-6', name: 'تبديل بطارية فارتا 70Ah', price: 420 },
  ]);

  const [invoiceSuccess, setInvoiceSuccess] = useState<string | null>(null);

  const addItemToCart = (srv: { id: string; name: string; price: number }) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === srv.id);
      if (existing) {
        return prev.map((i) => (i.id === srv.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...srv, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i))
        .filter((i) => i.qty > 0),
    );
  };

  const subtotal = cart.reduce((acc, i) => acc + i.price * i.qty, 0);
  const vat = subtotal * 0.05;
  const grandTotal = subtotal + vat;

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('السلة فارغة، يرجى إضافة بنود أو خدمات أولاً');
      return;
    }
    const invNo = `INV-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    setInvoiceSuccess(invNo);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-3xl shadow-xl border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold mb-2">
            💳 موديول نقطة البيع السريعة (POS & Instant Billing)
          </div>
          <h2 className="text-2xl font-black">نقطة الدفع السريع وإصدار الفواتير الفورية</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            محاسبة العملاء المباشرين، إضافة الخدمات وقطع الغيار بضغطة زر، واحتساب ضريبة القيمة المضافة 5% تلقائياً.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
          <span className="text-2xl">🇦🇪</span>
          <div>
            <p className="text-[10px] text-slate-400">الرقم الضريبي TRN:</p>
            <p className="text-xs font-mono font-bold text-amber-400">100345678900003</p>
          </div>
        </div>
      </div>

      {invoiceSuccess ? (
        <div className="bg-white p-8 rounded-3xl border border-emerald-300 shadow-xl text-center space-y-4 max-w-lg mx-auto">
          <span className="text-5xl block animate-bounce">🎉</span>
          <h3 className="text-xl font-black text-slate-900">تم إصدار الفاتورة الضريبية بنجاح</h3>
          <p className="text-xs text-slate-500 font-mono">رقم الفاتورة: <strong className="text-indigo-700">{invoiceSuccess}</strong></p>
          <div className="p-4 bg-slate-50 rounded-2xl text-xs space-y-1 text-right border border-slate-200">
            <p><strong>العميل:</strong> {customerName}</p>
            <p><strong>المركبة:</strong> {vehiclePlate}</p>
            <p><strong>طريقة الدفع:</strong> {paymentMethod === 'CARD' ? 'بطاقة ائتمان / مدى' : 'نقداً'}</p>
            <div className="h-px bg-slate-200 my-2"></div>
            <p className="flex justify-between font-bold text-sm">
              <span>المبلغ الإجمالي المدفوع:</span>
              <span className="text-emerald-700 font-mono">{grandTotal.toFixed(2)} AED</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setInvoiceSuccess(null);
                setCart([]);
              }}
              className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs"
            >
              فاتورة جديدة ➕
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
            >
              طباعة الفاتورة 🖨️
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Middle: Quick Services & Items Selector */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>⚡</span>
                <span>الخدمات وقطع الغيار السريعة (انقر للإضافة إلى السلة)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {quickServices.map((srv) => (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => addItemToCart(srv)}
                    className="p-3.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-2xl text-right transition flex flex-col justify-between group shadow-sm"
                  >
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs group-hover:text-emerald-800">{srv.name}</h5>
                    </div>
                    <div className="pt-2 flex items-center justify-between border-t border-slate-200/60 mt-2">
                      <span className="text-xs font-black text-emerald-700 font-mono">{srv.price} AED</span>
                      <span className="text-xs bg-emerald-600 text-white rounded-lg px-2 py-0.5 font-bold">+ إضافة</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Customer Details Input */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <h4 className="text-xs font-black text-slate-900">بيانات العميل والمركبة المحاسب عنها:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">اسم العميل</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">رقم لوحة المركبة</label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Cart & Checkout Summary */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xl space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                  <span>🛒</span>
                  <span>سلة الفاتورة الحالية</span>
                </h3>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-bold font-mono">
                  {cart.length} بنود
                </span>
              </div>

              {/* Cart Items List */}
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto mt-2">
                {cart.length === 0 ? (
                  <p className="text-center text-slate-400 py-8 text-xs">السلة فارغة حالياً</p>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-bold text-xs text-slate-900">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{item.price} AED للوحدة</p>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, -1)}
                          className="w-5 h-5 bg-white text-slate-700 rounded font-bold text-xs flex items-center justify-center shadow-sm"
                        >
                          -
                        </button>
                        <span className="font-bold text-xs px-2 font-mono">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, 1)}
                          className="w-5 h-5 bg-white text-slate-700 rounded font-bold text-xs flex items-center justify-center shadow-sm"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-mono font-bold text-xs text-slate-800 w-16 text-left">
                        {(item.price * item.qty).toFixed(0)} AED
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Calculations & Checkout Button */}
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>المجموع الفرعي (قبل الضريبة):</span>
                  <span className="font-mono font-bold">{subtotal.toFixed(2)} AED</span>
                </div>
                <div className="flex justify-between text-indigo-700 font-bold">
                  <span>ضريبة القيمة المضافة VAT (5%):</span>
                  <span className="font-mono">+{vat.toFixed(2)} AED</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>المبلغ الإجمالي النهائي:</span>
                  <span className="font-mono text-emerald-700">{grandTotal.toFixed(2)} AED</span>
                </div>
              </div>

              {/* Payment Method Switcher */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                    paymentMethod === 'CARD'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  💳 بطاقة (POS)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                    paymentMethod === 'CASH'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  💵 نقداً (Cash)
                </button>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-sm transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>✅</span>
                <span>إتمام الدفع وإصدار الفاتورة</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

