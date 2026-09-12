import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ArrowUpRight, AlertCircle, Building2, HardHat, Calendar, DollarSign, CheckCircle2 } from 'lucide-react';
import { MaterialIssue } from '../../../types/inventoryTypes';
import { useInventory } from '../../../context/InventoryContext';

interface MaterialIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue?: MaterialIssue | null;
}

interface IssueItemForm {
  materialId: string;
  materialCode: string;
  materialName: string;
  batchNumber?: string;
  unit: string;
  requestedQty: number;
  issuedQty: number;
  unitCost: number;
  totalValue: number;
  remarks?: string;
}

const COMMON_PROJECTS = ['PIDM 26', 'JAFFNA 02', 'COLOMBO 01', 'KANDY 04', 'GALLE 03', 'CENTRAL'];

export const MaterialIssueModal: React.FC<MaterialIssueModalProps> = ({
  isOpen,
  onClose,
  issue
}) => {
  const { stores, materials, stockBalances, batches, createMaterialIssue, updateMaterialIssue } = useInventory();

  const [issueNumber, setIssueNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [storeId, setStoreId] = useState(stores[0]?.id || '');
  const [projectCode, setProjectCode] = useState('PIDM 26');
  const [workElement, setWorkElement] = useState('');
  const [issuedTo, setIssuedTo] = useState('');
  const [issuedBy, setIssuedBy] = useState('');
  const [authorizedBy, setAuthorizedBy] = useState('');
  const [vehicleOrPlantNo, setVehicleOrPlantNo] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<IssueItemForm[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (issue) {
      setIssueNumber(issue.issueNumber);
      setDate(issue.date);
      setStoreId(issue.storeId);
      setProjectCode(issue.projectCode);
      setWorkElement(issue.workElement || '');
      setIssuedTo(issue.issuedTo);
      setIssuedBy(issue.issuedBy);
      setAuthorizedBy(issue.authorizedBy || '');
      setVehicleOrPlantNo(issue.vehicleOrPlantNo || '');
      setNotes(issue.notes || '');
      setItems(issue.items.map(i => ({
        materialId: i.materialId,
        materialCode: i.materialCode,
        materialName: i.materialName,
        batchNumber: i.batchNumber,
        unit: i.unit,
        requestedQty: i.requestedQty || i.quantity,
        issuedQty: i.issuedQty || i.quantity,
        unitCost: i.unitCost,
        totalValue: i.totalValue,
        remarks: i.remarks
      })));
    } else {
      const randomNum = String(Math.floor(Math.random() * 900) + 100);
      setIssueNumber(`MIN-2026-${randomNum}`);
      setDate(new Date().toISOString().split('T')[0]);
      setStoreId(stores[0]?.id || '');
      setProjectCode('PIDM 26');
      setWorkElement('');
      setIssuedTo('');
      setIssuedBy('Kasun Bandara');
      setAuthorizedBy('Chief Engineer Fernando');
      setVehicleOrPlantNo('');
      setNotes('');
      if (materials.length > 0) {
        const mat = materials[0];
        setItems([
          {
            materialId: mat.id,
            materialCode: mat.code,
            materialName: mat.name,
            unit: mat.unit,
            requestedQty: 10,
            issuedQty: 10,
            unitCost: mat.standardCost || 0,
            totalValue: 10 * (mat.standardCost || 0),
            remarks: ''
          }
        ]);
      } else {
        setItems([]);
      }
    }
    setErrors({});
  }, [issue, isOpen, stores, materials]);

  if (!isOpen) return null;

  const getAvailableStock = (matId: string) => {
    const bal = stockBalances.find(b => b.materialId === matId && b.storeId === storeId);
    return bal ? bal.onHandQuantity : 0;
  };

  const handleAddItem = () => {
    if (materials.length === 0) return;
    const defaultMat = materials[0];
    setItems(prev => [
      ...prev,
      {
        materialId: defaultMat.id,
        materialCode: defaultMat.code,
        materialName: defaultMat.name,
        unit: defaultMat.unit,
        requestedQty: 5,
        issuedQty: 5,
        unitCost: defaultMat.standardCost || 0,
        totalValue: 5 * (defaultMat.standardCost || 0),
        remarks: ''
      }
    ]);
  };

  const handleMaterialChange = (index: number, matId: string) => {
    const mat = materials.find(m => m.id === matId);
    if (!mat) return;
    setItems(prev => {
      const updated = [...prev];
      const cur = updated[index];
      const unitCost = mat.averageCost || mat.standardCost || cur.unitCost;
      updated[index] = {
        ...cur,
        materialId: mat.id,
        materialCode: mat.code,
        materialName: mat.name,
        unit: mat.unit,
        unitCost,
        totalValue: cur.issuedQty * unitCost
      };
      return updated;
    });
  };

  const handleQtyChange = (index: number, field: 'requestedQty' | 'issuedQty', value: number) => {
    setItems(prev => {
      const updated = [...prev];
      const cur = updated[index];
      const updatedItem = { ...cur, [field]: value };
      if (field === 'requestedQty' && cur.issuedQty === cur.requestedQty) {
        updatedItem.issuedQty = value;
      }
      updatedItem.totalValue = updatedItem.issuedQty * updatedItem.unitCost;
      updated[index] = updatedItem;
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const totalIssueValue = items.reduce((sum, i) => sum + i.totalValue, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!issueNumber.trim()) newErrors.issueNumber = 'Issue Number is required';
    if (!date) newErrors.date = 'Date is required';
    if (!storeId) newErrors.storeId = 'Select source store / warehouse';
    if (!projectCode.trim()) newErrors.projectCode = 'Select or enter project code';
    if (!issuedTo.trim()) newErrors.issuedTo = 'Site Receiver / Engineer name is required';
    if (!issuedBy.trim()) newErrors.issuedBy = 'Storekeeper name is required';
    if (items.length === 0) newErrors.items = 'Add at least one line item';

    // Validate quantities against on-hand stock
    let stockWarning = false;
    items.forEach((item, idx) => {
      const avail = getAvailableStock(item.materialId);
      if (item.issuedQty > avail && !issue) {
        newErrors[`item_${idx}`] = `Issued quantity (${item.issuedQty}) exceeds on-hand stock (${avail} ${item.unit})!`;
        stockWarning = true;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const selectedStore = stores.find(s => s.id === storeId);

    const transactionItems = items.map((i, idx) => ({
      id: `issue-item-${Date.now()}-${idx}`,
      materialId: i.materialId,
      materialCode: i.materialCode,
      materialName: i.materialName,
      batchNumber: i.batchNumber || undefined,
      unit: i.unit,
      quantity: i.issuedQty,
      requestedQty: i.requestedQty,
      issuedQty: i.issuedQty,
      unitCost: i.unitCost,
      totalValue: i.totalValue,
      remarks: i.remarks
    }));

    if (issue) {
      updateMaterialIssue(issue.id, {
        issueNumber: issueNumber.trim(),
        date,
        storeId,
        storeName: selectedStore?.name || 'Store',
        projectCode: projectCode.trim().toUpperCase(),
        workElement: workElement.trim() || undefined,
        issuedTo: issuedTo.trim(),
        issuedBy: issuedBy.trim(),
        authorizedBy: authorizedBy.trim() || undefined,
        vehicleOrPlantNo: vehicleOrPlantNo.trim() || undefined,
        notes: notes.trim() || undefined,
        items: transactionItems,
        totalValue: totalIssueValue
      });
    } else {
      createMaterialIssue({
        issueNumber: issueNumber.trim(),
        date,
        storeId,
        storeName: selectedStore?.name || 'Store',
        projectCode: projectCode.trim().toUpperCase(),
        workElement: workElement.trim() || undefined,
        issuedTo: issuedTo.trim(),
        issuedBy: issuedBy.trim(),
        authorizedBy: authorizedBy.trim() || undefined,
        vehicleOrPlantNo: vehicleOrPlantNo.trim() || undefined,
        notes: notes.trim() || undefined,
        status: 'POSTED',
        items: transactionItems,
        totalValue: totalIssueValue
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                {issue ? 'Edit Material Issue Note (MIN)' : 'New Material Issue (Site Requisition)'}
              </h2>
              <p className="text-xs text-slate-400">
                Issue materials to construction sites, log project consumption, and deduct stock
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1 text-slate-200">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Issue Number *</label>
              <input
                type="text"
                value={issueNumber}
                onChange={e => setIssueNumber(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 font-mono font-semibold"
              />
              {errors.issueNumber && <p className="text-red-400 text-xs mt-1">{errors.issueNumber}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Issue Date *</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
              {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Source Store *</label>
              <select
                value={storeId}
                onChange={e => setStoreId(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Destination Project *</label>
              <select
                value={projectCode}
                onChange={e => setProjectCode(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 font-mono font-bold text-amber-400"
              >
                {COMMON_PROJECTS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {errors.projectCode && <p className="text-red-400 text-xs mt-1">{errors.projectCode}</p>}
            </div>
          </div>

          {/* Allocation & Personnel Info */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-800">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Work Element / Construction Task</label>
              <input
                type="text"
                placeholder="e.g. Culvert Base Concreting KM 14+200, Retaining Wall Decking"
                value={workElement}
                onChange={e => setWorkElement(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Issued To (Site Engineer/Foreman) *</label>
              <input
                type="text"
                placeholder="e.g. Eng. Buddhika Jayasundara"
                value={issuedTo}
                onChange={e => setIssuedTo(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
              {errors.issuedTo && <p className="text-red-400 text-xs mt-1">{errors.issuedTo}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Vehicle / Equipment Reg No</label>
              <input
                type="text"
                placeholder="e.g. WP-CAT-320D"
                value={vehicleOrPlantNo}
                onChange={e => setVehicleOrPlantNo(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Issued By (Storekeeper) *</label>
              <input
                type="text"
                placeholder="e.g. Kasun Bandara"
                value={issuedBy}
                onChange={e => setIssuedBy(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
              {errors.issuedBy && <p className="text-red-400 text-xs mt-1">{errors.issuedBy}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Authorized By (Project Manager)</label>
              <input
                type="text"
                placeholder="e.g. Chief Engineer Fernando"
                value={authorizedBy}
                onChange={e => setAuthorizedBy(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Requisitioned Materials & Stock Check
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Material Line
              </button>
            </div>

            {errors.items && <p className="text-red-400 text-xs">{errors.items}</p>}

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-800/90 text-slate-300 font-semibold border-b border-slate-700">
                  <tr>
                    <th className="p-2.5 min-w-[200px]">Material Item</th>
                    <th className="p-2.5 min-w-[110px]">On-Hand Stock</th>
                    <th className="p-2.5 min-w-[90px]">Req Qty</th>
                    <th className="p-2.5 min-w-[90px]">Issued Qty</th>
                    <th className="p-2.5 min-w-[70px]">UOM</th>
                    <th className="p-2.5 min-w-[100px]">Unit Cost</th>
                    <th className="p-2.5 min-w-[110px]">Total (LKR)</th>
                    <th className="p-2.5 min-w-[140px]">Purpose / Element</th>
                    <th className="p-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {items.map((item, idx) => {
                    const avail = getAvailableStock(item.materialId);
                    const isDeficit = item.issuedQty > avail;
                    return (
                      <tr key={idx} className={`hover:bg-slate-800/30 transition-colors ${isDeficit ? 'bg-red-950/20' : ''}`}>
                        <td className="p-2">
                          <select
                            value={item.materialId}
                            onChange={e => handleMaterialChange(idx, e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                          >
                            {materials.map(m => (
                              <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                            ))}
                          </select>
                          {errors[`item_${idx}`] && (
                            <p className="text-red-400 text-[10px] mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {errors[`item_${idx}`]}
                            </p>
                          )}
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${
                            avail <= 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {avail.toLocaleString()} {item.unit}
                          </span>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.requestedQty}
                            onChange={e => handleQtyChange(idx, 'requestedQty', Number(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.issuedQty}
                            onChange={e => handleQtyChange(idx, 'issuedQty', Number(e.target.value))}
                            className={`w-full bg-slate-800 border rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none font-mono ${
                              isDeficit ? 'border-red-500 text-red-400' : 'border-slate-700 text-purple-400 focus:border-purple-500'
                            }`}
                          />
                        </td>
                        <td className="p-2 text-slate-400 font-mono">{item.unit}</td>
                        <td className="p-2 text-slate-300 font-mono">
                          Rs. {item.unitCost.toLocaleString()}
                        </td>
                        <td className="p-2 text-white font-mono font-semibold">
                          Rs. {item.totalValue.toLocaleString()}
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="e.g. For culvert pour"
                            value={item.remarks || ''}
                            onChange={e => {
                              const val = e.target.value;
                              setItems(prev => prev.map((it, i) => i === idx ? { ...it, remarks: val } : it));
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-500 hover:text-red-400 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total Summary Banner */}
            <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700/80 rounded-xl px-4 py-3">
              <span className="text-xs text-slate-400">Total Material Issue Value (Project Consumption):</span>
              <span className="text-base font-bold text-purple-400 font-mono">
                LKR {totalIssueValue.toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Issue Remarks / Special Requisition Details</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Issued against Approved Structural Drawing Rev 3, QA pour checklist cleared..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors shadow-lg shadow-purple-600/20"
            >
              {issue ? 'Save Changes' : 'Post Issue & Deduct Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
