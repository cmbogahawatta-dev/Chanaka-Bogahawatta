import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Building,
  DollarSign,
  ShieldCheck,
  FileText,
  AlertCircle
} from 'lucide-react';
import { InvoiceSupplyItem, TaxInvoice } from '../../types/taxInvoiceTypes';
import { useTaxInvoice } from '../../context/TaxInvoiceContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import {
  calculateTaxInvoiceTotals,
  amountToWordsLKR,
  generateTaxInvoiceSerialNumber
} from '../../utils/taxInvoiceUtils';

interface CreateTaxInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateTaxInvoiceModal: React.FC<CreateTaxInvoiceModalProps> = ({ isOpen, onClose }) => {
  const { settings, createInvoice } = useTaxInvoice();
  const { currentUser } = useEnterprise();

  const today = new Date().toISOString().split('T')[0];
  const inThirtyDays = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  const [invoiceDate, setInvoiceDate] = useState(today);
  const [supplyDate, setSupplyDate] = useState(today);
  const [dueDate, setDueDate] = useState(inThirtyDays);

  // Purchaser Details
  const [purchaserName, setPurchaserName] = useState('Colombo Port City Development Authority');
  const [purchaserTin, setPurchaserTin] = useState('204918274');
  const [purchaserVatNumber, setPurchaserVatNumber] = useState('204918274-7000');
  const [purchaserAddress, setPurchaserAddress] = useState('Block A, Port City Boulevard, Colombo 01');
  const [purchaserContactPerson, setPurchaserContactPerson] = useState('Eng. K. Wickramasinghe');
  const [purchaserPhone, setPurchaserPhone] = useState('+94 11 755 4000');
  const [purchaserEmail, setPurchaserEmail] = useState('billing@portcity.lk');

  // Project Association
  const [projectCode, setProjectCode] = useState('PRJ-PORT-01');
  const [projectName, setProjectName] = useState('Colombo Port Expansion Phase II');
  const [ipcNumber, setIpcNumber] = useState('IPC-05');
  const [contractNumber, setContractNumber] = useState('CPCE-2025-C08');
  const [purchaseOrderRef, setPurchaseOrderRef] = useState('PO-CPCDA-9921');

  // Line Items
  const [lineItems, setLineItems] = useState<InvoiceSupplyItem[]>([
    {
      id: 'item-1',
      itemNumber: 1,
      description: 'Breakwater Core Armor Rock Placement (3,500 MT)',
      unitOfMeasure: 'MT',
      quantity: 3500,
      unitPrice: 1850,
      taxableValue: 6475000,
      vatRate: 18,
      vatAmount: 1165500,
      totalAmount: 7640500
    }
  ]);

  const [notes, setNotes] = useState('Certified under Interim Payment Certificate No. 05.');

  // Live Serial Preview
  const liveSerial = useMemo(() => {
    return generateTaxInvoiceSerialNumber(invoiceDate, settings.entityCode, settings.currentSequence);
  }, [invoiceDate, settings.entityCode, settings.currentSequence]);

  // Financial Totals
  const totals = useMemo(() => {
    return calculateTaxInvoiceTotals(lineItems, settings.standardVatRate);
  }, [lineItems, settings.standardVatRate]);

  const amountInWords = useMemo(() => {
    return amountToWordsLKR(totals.totalConsideration);
  }, [totals.totalConsideration]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const newItem: InvoiceSupplyItem = {
      id: `item-${Date.now()}`,
      itemNumber: lineItems.length + 1,
      description: '',
      unitOfMeasure: 'Nos',
      quantity: 1,
      unitPrice: 0,
      taxableValue: 0,
      vatRate: settings.standardVatRate,
      vatAmount: 0,
      totalAmount: 0
    };
    setLineItems([...lineItems, newItem]);
  };

  const handleUpdateItem = (index: number, field: keyof InvoiceSupplyItem, val: any) => {
    const updated = [...lineItems];
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
    setLineItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleSubmit = (isIssueImmediately: boolean) => {
    if (!purchaserName.trim()) {
      alert('Purchaser legal name is required.');
      return;
    }
    if (!purchaserTin.trim()) {
      alert('Purchaser Taxpayer Identification Number (TIN) is required under Gazette No. 2481/22.');
      return;
    }
    if (lineItems.some(i => !i.description.trim() || i.quantity <= 0 || i.unitPrice <= 0)) {
      alert('Please fill in complete descriptions, quantities, and unit prices for all line items.');
      return;
    }

    createInvoice(
      {
        invoiceDate,
        supplyDate,
        dueDate,
        purchaserName,
        purchaserTin,
        purchaserVatNumber,
        purchaserAddress,
        purchaserContactPerson,
        purchaserPhone,
        purchaserEmail,
        projectCode,
        projectName,
        ipcNumber,
        contractNumber,
        purchaseOrderRef,
        lineItems,
        notes
      },
      isIssueImmediately
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-300 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Create New Tax Invoice</h2>
              <p className="text-xs text-slate-400">
                Inland Revenue Department Gazette Extraordinary No. 2481/22 Compliant Supply Entry
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          {/* Statutory Live Preview Banner */}
          <div className="p-4 bg-slate-950 rounded-xl border border-cyan-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                Statutory Gazette Section 60 Serial Number Preview
              </span>
              <span className="font-mono text-xl font-black text-cyan-300">
                {liveSerial}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Calculated strictly from invoice date: <strong className="text-white">{invoiceDate}</strong> • Entity: <strong className="text-white">{settings.entityCode}</strong> • Seq: <strong className="text-white">#{settings.currentSequence}</strong>
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block">Total Consideration</span>
              <span className="text-lg font-mono font-bold text-emerald-400">
                LKR {totals.totalConsideration.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Section 1: Dates & Project Reference */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Invoice Date <span className="text-rose-400">* (Controls Serial YYMMM)</span>
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={e => setInvoiceDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-cyan-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Supply Date / Milestone Period</label>
              <input
                type="date"
                value={supplyDate}
                onChange={e => setSupplyDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-cyan-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-cyan-500 outline-none"
              />
            </div>
          </div>

          {/* Section 2: Purchaser / Client Details */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">
              Purchaser Information (Registered Person)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-slate-400 mb-1 font-semibold">Purchaser Legal Name *</label>
                <input
                  type="text"
                  value={purchaserName}
                  onChange={e => setPurchaserName(e.target.value)}
                  placeholder="e.g. Colombo Port City Development Authority"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Purchaser TIN * (Gazette Mandatory)</label>
                <input
                  type="text"
                  value={purchaserTin}
                  onChange={e => setPurchaserTin(e.target.value)}
                  placeholder="e.g. 204918274"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-cyan-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-slate-400 mb-1 font-semibold">Registered Office Address *</label>
                <input
                  type="text"
                  value={purchaserAddress}
                  onChange={e => setPurchaserAddress(e.target.value)}
                  placeholder="Delivery / Registered street address"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Purchaser VAT Registration No.</label>
                <input
                  type="text"
                  value={purchaserVatNumber}
                  onChange={e => setPurchaserVatNumber(e.target.value)}
                  placeholder="e.g. 204918274-7000"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-cyan-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={purchaserContactPerson}
                  onChange={e => setPurchaserContactPerson(e.target.value)}
                  placeholder="Eng. K. Wickramasinghe"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Phone</label>
                <input
                  type="text"
                  value={purchaserPhone}
                  onChange={e => setPurchaserPhone(e.target.value)}
                  placeholder="+94 11 755 4000"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={purchaserEmail}
                  onChange={e => setPurchaserEmail(e.target.value)}
                  placeholder="billing@portcity.lk"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Project Association */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Project Code</label>
              <input
                type="text"
                value={projectCode}
                onChange={e => setProjectCode(e.target.value)}
                placeholder="PRJ-PORT-01"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs font-mono outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder="Colombo Port Expansion"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">IPC / Milestone Ref</label>
              <input
                type="text"
                value={ipcNumber}
                onChange={e => setIpcNumber(e.target.value)}
                placeholder="IPC-05"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs font-mono outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">PO / Contract Ref</label>
              <input
                type="text"
                value={purchaseOrderRef}
                onChange={e => setPurchaseOrderRef(e.target.value)}
                placeholder="PO-CPCDA-9921"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs font-mono outline-none"
              />
            </div>
          </div>

          {/* Section 4: Line Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">
                Taxable Supply Line Items (Standard 18% VAT)
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <th className="py-2 px-3 w-8">#</th>
                    <th className="py-2 px-3">Description of Taxable Works</th>
                    <th className="py-2 px-3 w-16">Unit</th>
                    <th className="py-2 px-3 w-20 text-right">Qty</th>
                    <th className="py-2 px-3 w-28 text-right">Rate (LKR)</th>
                    <th className="py-2 px-3 w-32 text-right">Taxable (LKR)</th>
                    <th className="py-2 px-3 w-16 text-center">VAT</th>
                    <th className="py-2 px-3 w-28 text-right">VAT (LKR)</th>
                    <th className="py-2 px-3 w-32 text-right">Total (LKR)</th>
                    <th className="py-2 px-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {lineItems.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-800/20">
                      <td className="py-2 px-3 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.description}
                          onChange={e => handleUpdateItem(idx, 'description', e.target.value)}
                          placeholder="Description of engineering work or materials"
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs outline-none focus:border-cyan-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.unitOfMeasure || ''}
                          onChange={e => handleUpdateItem(idx, 'unitOfMeasure', e.target.value)}
                          placeholder="Nos"
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs outline-none text-center"
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
                      <td className="py-2 px-3 text-center font-mono text-slate-400">
                        {item.vatRate}%
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-red-400">
                        {item.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-white">
                        {item.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={lineItems.length <= 1}
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

          {/* Section 5: Financial Summary & Amount in Words */}
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex-1 p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-500 block">Amount in Words (Calculated):</span>
              <p className="font-semibold text-white italic">{amountInWords}</p>
            </div>

            <div className="w-full md:w-80 p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Taxable Value:</span>
                <span className="font-mono text-white">LKR {totals.totalTaxableValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-red-400 font-semibold">
                <span>Output VAT @ 18%:</span>
                <span className="font-mono">LKR {totals.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-white font-bold border-t border-slate-800 pt-2 text-sm">
                <span>Total Consideration:</span>
                <span className="font-mono text-emerald-400">LKR {totals.totalConsideration.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold border border-slate-700 transition-colors"
            >
              Save as Draft
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Issue Official Tax Invoice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
