import React, { useState } from 'react';
import { X, FileSpreadsheet, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { TaxInvoice, InvoiceSupplyItem } from '../../types/taxInvoiceTypes';
import { useTaxInvoice } from '../../context/TaxInvoiceContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { calculateTaxInvoiceTotals, amountToWordsLKR } from '../../utils/taxInvoiceUtils';

interface CreditNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: TaxInvoice | null;
}

export const CreditNoteModal: React.FC<CreditNoteModalProps> = ({
  isOpen,
  onClose,
  invoice
}) => {
  const { createCreditNote, settings } = useTaxInvoice();
  const { currentUser } = useEnterprise();

  if (!isOpen || !invoice) return null;

  const [reason, setReason] = useState('Measurement revision as per final certified IPC audit');
  const [items, setItems] = useState<InvoiceSupplyItem[]>(() => {
    return invoice.lineItems.map(item => ({
      ...item,
      id: `cn-item-${Date.now()}-${item.itemNumber}`,
      quantity: 1,
      taxableValue: item.unitPrice,
      vatAmount: Math.round(item.unitPrice * 0.18 * 100) / 100,
      totalAmount: Math.round(item.unitPrice * 1.18 * 100) / 100
    }));
  });

  const totals = calculateTaxInvoiceTotals(items, invoice.vatRate);

  const handleUpdateItem = (index: number, field: keyof InvoiceSupplyItem, val: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: val };

    if (field === 'quantity' || field === 'unitPrice') {
      const q = field === 'quantity' ? Number(val) : item.quantity;
      const p = field === 'unitPrice' ? Number(val) : item.unitPrice;
      const taxable = Math.round(q * p * 100) / 100;
      const vat = Math.round(taxable * (item.vatRate / 100) * 100) / 100;
      item.taxableValue = taxable;
      item.vatAmount = vat;
      item.totalAmount = Math.round((taxable + vat) * 100) / 100;
    }

    updated[index] = item;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Credit note justification reason is required.');
      return;
    }

    createCreditNote(invoice.id, reason, items, currentUser || 'Finance Officer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-800 text-indigo-300 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Issue Statutory Tax Credit Note</h2>
              <p className="text-xs text-slate-400">
                Against Tax Invoice: <span className="font-mono text-cyan-300 font-bold">{invoice.serialNumber}</span> • {invoice.purchaserName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-300 flex-1 overflow-y-auto">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Credit Reason / Justification *</label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-indigo-500"
            />
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs">Credit Items & Value Adjustment</h4>
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3 w-16 text-right">Qty</th>
                    <th className="py-2 px-3 w-28 text-right">Rate (LKR)</th>
                    <th className="py-2 px-3 w-28 text-right">Credit Value</th>
                    <th className="py-2 px-3 w-24 text-right">18% VAT</th>
                    <th className="py-2 px-3 w-28 text-right">Total Credit</th>
                    <th className="py-2 px-3 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {items.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.description}
                          onChange={e => handleUpdateItem(idx, 'description', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs outline-none"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={e => handleUpdateItem(idx, 'quantity', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs outline-none text-right font-mono"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={e => handleUpdateItem(idx, 'unitPrice', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs outline-none text-right font-mono"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-white">
                        {item.taxableValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-red-400">
                        {item.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                        {item.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length <= 1}
                          className="text-slate-500 hover:text-rose-400 disabled:opacity-30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Credit Summary */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-slate-500 block text-[10px]">Total Credit Consideration</span>
              <p className="font-bold text-white text-xs italic">{amountToWordsLKR(totals.totalConsideration)}</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-mono font-black text-indigo-400">
                - LKR {totals.totalConsideration.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="block text-[10px] text-slate-500">
                (Excl. VAT: LKR {totals.totalTaxableValue.toLocaleString()} + VAT: LKR {totals.vatAmount.toLocaleString()})
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2 shadow"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Issue Official Credit Note</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
