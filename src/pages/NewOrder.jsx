import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus, Trash2, ChevronDown, ChevronUp, Lock, ShoppingBag, Search,
  MapPin, Loader2, User, MapPinned, CreditCard, ShieldCheck, 
  Truck, Zap, FileText, Scale, Home, Building2, 
  Ban as BanIcon, MousePointerClick,
  File as FileIcon 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import PickupAddressModal from "../components/modals/PickupAddressModal";
import ConsigneeModal from "../components/modals/ConsigneeModal";

import {
  createPickupAddress,
  fetchPickupAddresses,
  setSelectedAddress,
  fetchConsignees,
  createConsignee,
  createOrder,
  updateOrder,
} from "../redux/orderSlice";

// Debounce Hook to prevent excessive API calls while searching
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function NewOrder() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId } = useParams();
  const editOrderData = location.state?.order;
  const isEditMode = Boolean(orderId);

  const { 
    pickupAddresses, 
    selectedAddress, 
    consignees, 
    orderLoading, 
    loading: pickupLoading 
  } = useSelector((state) => state.orders);

  const generateSKU = () => `SKU-${Math.floor(1000 + Math.random() * 9000)}`;

  // --- Search States ---
  const [pickupSearch, setPickupSearch] = useState("");
  const [consigneeSearch, setConsigneeSearch] = useState("");
  const debouncedPickupSearch = useDebounce(pickupSearch, 500);
  const debouncedConsigneeSearch = useDebounce(consigneeSearch, 500);

  // --- Form States ---
  const [orderType, setOrderType] = useState("B2C");
  const [serviceType, setServiceType] = useState("Surface");
  const [deliveryType, setDeliveryType] = useState("none"); 
  const [isDoc, setIsDoc] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Prepaid");
  
  const [prepaidAmount, setPrepaidAmount] = useState("");
  const [codAmount, setCodAmount] = useState("");
  const [toPayAmount, setToPayAmount] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  
  const [isManualFreight, setIsManualFreight] = useState(false);
  const [freightCharge, setFreightCharge] = useState("");
  
  const [isInsuranceEnabled, setIsInsuranceEnabled] = useState(false);
  const [insuranceAmount, setInsuranceAmount] = useState(0); 
  
  const [regionalArea, setRegionalArea] = useState(0); 
  const [isGstExempt, setIsGstExempt] = useState(false);

  const [consigneeData, setConsigneeData] = useState({ id: null, name: "", mobile: "", city: "" });

  const [pickupForm, setPickupForm] = useState({
    nickname: "", contact_name: "", phone: "", email: "", address_line_1: "", address_line_2: "", pincode: "", city: "", state: "", country: "India"
  });
  const [consigneeForm, setConsigneeForm] = useState({
    name: "", mobile: "", alternate_mobile: "", email: "", address_line_1: "", address_line_2: "", pincode: "", city: "", state: ""
  });

  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [isAddressDropdownOpen, setIsAddressDropdownOpen] = useState(false);
  const [isConsigneeDropdownOpen, setIsConsigneeDropdownOpen] = useState(false);
  const [isConsigneeModalOpen, setIsConsigneeModalOpen] = useState(false);
  const [isOtherDetailsOpen, setIsOtherDetailsOpen] = useState(true);

  // --- Products & Packages ---
  const [packages, setPackages] = useState([
    { id: Date.now(), count: 1, length_cm: 0, breadth_cm: 0, height_cm: 0, weight_unit: "kg", weight_value: "", row_vol_weight: 0 }
  ]);
  const [products, setProducts] = useState([
    { id: Date.now() + 1, product_name: "", sku: generateSKU(), unit_price: "", qty: 1, total: 0, package_index: 1 }
  ]);
  const [otherDetails, setOtherDetails] = useState({ gst_number: "", eway_bill_number: "", invoicenumber: "", amount: "" });

  // --- API Search Trigger ---
  useEffect(() => {
    dispatch(fetchPickupAddresses({ search: debouncedPickupSearch, page: 1, limit: 10 }));
  }, [dispatch, debouncedPickupSearch]);

  useEffect(() => {
    dispatch(fetchConsignees({ search: debouncedConsigneeSearch, page: 1, limit: 10 }));
  }, [dispatch, debouncedConsigneeSearch]);

  // --- Calculations ---
  const totalOrderValue = useMemo(() => products.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0), [products]);

  useEffect(() => {
    if (isInsuranceEnabled && totalOrderValue >= 1000) {
      setInsuranceAmount(parseFloat((totalOrderValue * 0.018).toFixed(2)));
    } else {
      setInsuranceAmount(0);
    }
  }, [totalOrderValue, isInsuranceEnabled]);

  const weightSummary = useMemo(() => {
    let totalPhys = 0, totalVol = 0, totalBoxes = 0;
    packages.forEach(pkg => {
        totalBoxes += 1;
        const calcVol = ((Number(pkg.length_cm) || 0) * (Number(pkg.breadth_cm) || 0) * (Number(pkg.height_cm) || 0)) / 2700;
        const manualVal = Number(pkg.weight_value) || 0;
        const physicalKg = pkg.weight_unit === "g" ? manualVal / 1000 : manualVal;
        totalPhys += physicalKg;
        totalVol += calcVol;
    });
    return { 
        total_boxes: totalBoxes, 
        total_weight_kg: totalPhys.toFixed(2), 
        total_vol_weight_kg: totalVol.toFixed(2), 
        applicable_weight_kg: Math.max(totalPhys, totalVol).toFixed(2) 
    };
  }, [packages]);

  // --- Populate Edit Mode ---
  useEffect(() => {
    if (!isEditMode || !editOrderData) return;
    setOrderType(editOrderData.order_type || "B2C");
    setServiceType(editOrderData.service_type || "Surface");
    setDeliveryType(editOrderData.delivery_type || "none");
    setIsDoc(editOrderData.is_doc || false);
    setPaymentMethod(editOrderData.payment_method || "Prepaid");
    setPrepaidAmount(editOrderData.prepaid_amount?.toString() || "");
    setCodAmount(editOrderData.cod_amount?.toString() || "");
    setToPayAmount(editOrderData.to_pay_amount?.toString() || "");
    setCreditAmount(editOrderData.credit_amount?.toString() || "");
    setIsManualFreight(editOrderData.is_manual_freight === true);
    setFreightCharge(editOrderData.freight_charge?.toString() || "");
    setRegionalArea(editOrderData.regional_area || 0);
    setIsInsuranceEnabled(editOrderData.insurance === true);

    if (editOrderData.pickup_address) dispatch(setSelectedAddress(editOrderData.pickup_address));
    if (editOrderData.consignee) setConsigneeData(editOrderData.consignee);
    if (editOrderData.items?.length > 0) {
      setProducts(editOrderData.items.map(item => ({ ...item, id: Math.random(), total: (Number(item.unit_price) || 0) * (Number(item.qty) || 0) })));
    }
    if (editOrderData.packages?.length > 0) {
      setPackages(editOrderData.packages.map(pkg => ({
        ...pkg, id: Math.random(), weight_unit: "kg",
        weight_value: pkg.physical_weight?.toString() || pkg.physical_weight_kg?.toString() || "",
        row_vol_weight: ((Number(pkg.length_cm) * Number(pkg.breadth_cm) * Number(pkg.height_cm)) / 2700).toFixed(3)
      })));
    }
    setOtherDetails({ gst_number: editOrderData.gst_number || "", eway_bill_number: editOrderData.eway_bill_number || "", invoicenumber: editOrderData.invoicenumber || "", amount: editOrderData.amount || "" });
  }, [isEditMode, editOrderData, dispatch]);

  const handleProductChange = (id, field, value) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, [field]: value };
        if (field === "unit_price" || field === "qty") updated.total = (Number(updated.unit_price) || 0) * (Number(updated.qty) || 0);
        return updated;
      }
      return p;
    }));
  };

  const addProductRow = () => {
    const nextIndex = products.length + 1;
    if (nextIndex > packages.length) {
        setPackages(prev => [...prev, { id: Date.now() + Math.random(), count: 1, length_cm: 0, breadth_cm: 0, height_cm: 0, weight_unit: "kg", weight_value: "", row_vol_weight: 0 }]);
    }
    setProducts([...products, { id: Date.now() + Math.random(), product_name: "", sku: generateSKU(), unit_price: "", qty: 1, total: 0, package_index: nextIndex }]);
  };

  const handlePackageChange = (id, field, value) => {
    setPackages(prev => prev.map(p => {
        if (p.id === id) {
            const updated = { ...p, [field]: value };
            const l = field === 'length_cm' ? value : updated.length_cm;
            const b = field === 'breadth_cm' ? value : updated.breadth_cm;
            const h = field === 'height_cm' ? value : updated.height_cm;
            updated.row_vol_weight = ((Number(l) * Number(b) * Number(h)) / 2700).toFixed(3);
            return updated;
        }
        return p;
    }));
  };

  const handleSavePickupAddress = async () => {
    try {
      await dispatch(createPickupAddress(pickupForm)).unwrap();
      toast.success("Pickup address created!");
      setIsPickupModalOpen(false);
    } catch (err) { toast.error(err || "Failed to create address"); }
  };

  const handleSaveConsigneeAddress = async () => {
    try {
      const newC = await dispatch(createConsignee(consigneeForm)).unwrap();
      setConsigneeData(newC);
      toast.success("Consignee created!");
      setIsConsigneeModalOpen(false);
    } catch (err) { toast.error(err || "Failed to create consignee"); }
  };

  const handleSubmit = async () => {
    if (!selectedAddress) return toast.error("Select pickup location");
    if (!consigneeData.id) return toast.error("Select consignee");

    const payload = {
      order_type: orderType,
      pickup_address_id: selectedAddress.id,
      consignee_id: consigneeData.id,
      payment_method: paymentMethod,
      prepaid_amount: paymentMethod === "Prepaid" ? Number(prepaidAmount) : 0,
      cod_amount: paymentMethod === "COD" ? Number(codAmount) : 0,
      to_pay_amount: paymentMethod === "To Pay" ? Number(toPayAmount) : 0,
      credit_amount: paymentMethod === "Credit" ? Number(creditAmount) : 0,
      rov: "owner_risk",
      order_value: Number(totalOrderValue),
      service_type: serviceType,
      is_gst_exempt: isGstExempt,
      insurance: isInsuranceEnabled,
      is_doc: isDoc,
      delivery_type: deliveryType === "none" ? null : deliveryType,
      is_manual_freight: isManualFreight,
      freight_charge: isManualFreight ? Number(freightCharge) : null,
      manual_freight_reason: isManualFreight ? "Manual override" : null,
      regional_area: Number(regionalArea),
      gst_number: otherDetails.gst_number || null,
      eway_bill_number: otherDetails.eway_bill_number || null,
      invoicenumber: otherDetails.invoicenumber || null,
      amount: Number(otherDetails.amount) || Number(totalOrderValue),
      items: products.map(p => ({ 
        product_name: p.product_name, sku: p.sku, unit_price: Number(p.unit_price), qty: Number(p.qty), total: Number(p.total), package_index: Number(p.package_index) 
      })),
      packages: packages.map((pkg, idx) => ({
        package_index: idx + 1,
        count: 1,
        length_cm: Number(pkg.length_cm), 
        breadth_cm: Number(pkg.breadth_cm), 
        height_cm: Number(pkg.height_cm),
        physical_weight: pkg.weight_unit === "kg" ? Number(pkg.weight_value) : Number(pkg.weight_value) / 1000,
        vol_weight_kg: Number(pkg.row_vol_weight)
      }))
    };

    try {
      if (isEditMode) {
        await dispatch(updateOrder({ orderId, data: payload })).unwrap();
        toast.success("Order Updated!");
      } else {
        await dispatch(createOrder(payload)).unwrap();
        toast.success("Order Created!");
      }
      navigate("/dashboard/processing-order");
    } catch (err) { toast.error(err || "Operation failed"); }
  };

  const inputClass = "w-full bg-transparent border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-all";

  return (
    <div className="space-y-6 relative pb-24 min-h-screen">
      <PickupAddressModal isOpen={isPickupModalOpen} onClose={() => setIsPickupModalOpen(false)} pickupForm={pickupForm} handlePickupChange={(e) => setPickupForm({ ...pickupForm, [e.target.name]: e.target.value })} handleSavePickup={handleSavePickupAddress} loading={pickupLoading} inputClass={inputClass} />
      <ConsigneeModal isOpen={isConsigneeModalOpen} onClose={() => setIsConsigneeModalOpen(false)} consigneeForm={consigneeForm} handleConsigneeChange={(e) => setConsigneeForm({ ...consigneeForm, [e.target.name]: e.target.value })} handleSaveConsignee={handleSaveConsigneeAddress} loading={pickupLoading} inputClass={inputClass} />

      <header>
        <h1 className="text-2xl font-bold">{isEditMode ? `Edit Order (${editOrderData?.order_number})` : "New Order"}</h1>
        <p className="text-xs text-primary mt-1 font-medium">Dashboard <span className="text-text-muted mx-2">&gt;&gt;</span> Order Management</p>
      </header>

      {/* Configurations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-card-bg/40 p-4 border-border-subtle">
          <span className="text-xs font-bold text-text-muted uppercase">Order Type</span>
          <div className="flex gap-4 mt-3">
            {["B2C", "B2B", "International"].map(t => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" className="sr-only" checked={orderType === t} onChange={() => setOrderType(t)} />
                <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", orderType === t ? "border-primary" : "border-text-muted/30")}>
                  {orderType === t && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
                <span className="text-sm font-medium">{t}</span>
              </label>
            ))}
          </div>
        </Card>

        <Card className="bg-card-bg/40 p-4 border-border-subtle">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-text-muted uppercase">Delivery Mode</span>
            <button type="button" onClick={() => setIsDoc(!isDoc)} className={cn("px-2 py-1 rounded text-[10px] font-bold border transition-all", isDoc ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/10 text-text-muted")}>
               DOC? {isDoc ? "YES" : "NO"}
            </button>
          </div>
          <div className="flex gap-3">
            {[{ id: "none", label: "None", icon: BanIcon }, { id: "home", label: "Home", icon: Home }, { id: "office", label: "Office", icon: Building2 }].map(d => (
              <label key={d.id} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" className="sr-only" checked={deliveryType === d.id} onChange={() => setDeliveryType(d.id)} />
                <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", deliveryType === d.id ? "border-primary" : "border-text-muted/30")}>
                  {deliveryType === d.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <span className={cn("text-[11px] font-medium flex items-center gap-1", deliveryType === d.id ? "text-primary" : "text-text-muted")}><d.icon size={10}/> {d.label}</span>
              </label>
            ))}
          </div>
        </Card>

        <Card className="bg-card-bg/40 p-4 border-border-subtle">
          <span className="text-xs font-bold text-text-muted uppercase">Service Mode</span>
          <div className="flex gap-6 mt-3">
            {[{ id: "Surface", icon: Truck }, { id: "Express", icon: Zap }].map(s => (
              <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" className="sr-only" checked={serviceType === s.id} onChange={() => setServiceType(s.id)} />
                <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", serviceType === s.id ? "border-primary" : "border-text-muted/30")}>
                  {serviceType === s.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
                <span className="text-sm font-medium flex items-center gap-1"><s.icon size={14}/> {s.id}</span>
              </label>
            ))}
          </div>
        </Card>
      </div>

      {/* Address Selectors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card-bg border-border-subtle overflow-visible relative">
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center"><h2 className="text-lg font-semibold flex items-center gap-2"><MapPinned size={20} className="text-primary" /> Pickup Location</h2><Button variant="ghost" size="sm" onClick={() => setIsPickupModalOpen(true)} className="text-primary hover:bg-primary/10"><Plus size={16} /> Add New</Button></div>
            <div className="relative">
                {selectedAddress ? (
                  <div className="p-4 border border-primary/20 bg-primary/5 rounded-xl flex justify-between items-center cursor-pointer" onClick={() => setIsAddressDropdownOpen(!isAddressDropdownOpen)}>
                    <div><p className="font-bold text-sm">{selectedAddress.nickname}</p><p className="text-xs text-text-muted">{selectedAddress.city} - {selectedAddress.pincode}</p></div>
                    <Button variant="outline" size="sm" className="text-primary border-primary/20">Change</Button>
                  </div>
                ) : <div onClick={() => setIsAddressDropdownOpen(!isAddressDropdownOpen)} className="w-full border-2 border-dashed border-border-subtle rounded-xl py-8 flex flex-col items-center text-text-muted cursor-pointer hover:border-primary/40 transition-colors"><MapPin size={32} className="mb-2 opacity-50" /><p className="text-sm font-medium">Select Pickup</p></div>}
              
              <AnimatePresence>
                {isAddressDropdownOpen && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute z-50 mt-2 w-full bg-card-bg border border-border-subtle rounded-xl shadow-2xl max-h-72 overflow-hidden flex flex-col">
                    <div className="p-3 border-b border-border-subtle/20 bg-card-bg sticky top-0 z-10">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                        <input type="text" placeholder="Search address..." value={pickupSearch} autoFocus onChange={(e) => setPickupSearch(e.target.value)} className="w-full bg-white/5 border border-border-subtle rounded-lg pl-9 py-2 text-xs outline-none focus:border-primary" />
                        {pickupLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary" size={14} />}
                      </div>
                    </div>
                    <div className="overflow-y-auto max-h-60 custom-scrollbar">
                      {pickupAddresses.map(a => (
                        <div key={a.id} onClick={() => { dispatch(setSelectedAddress(a)); setIsAddressDropdownOpen(false); setPickupSearch(""); }} className="p-4 hover:bg-primary/10 cursor-pointer text-sm border-b border-border-subtle/10 last:border-0 transition-colors">
                          <p className="font-bold">{a.nickname}</p><p className="text-[11px] text-text-muted">{a.city}, {a.pincode}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card-bg border-border-subtle overflow-visible relative">
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center"><h2 className="text-lg font-semibold flex items-center gap-2"><User size={20} className="text-primary" /> Deliver To</h2><Button variant="ghost" size="sm" onClick={() => setIsConsigneeModalOpen(true)} className="text-primary hover:bg-primary/10"><Plus size={16} /> Add New</Button></div>
            <div className="relative">
                {consigneeData.id ? (
                  <div className="p-4 border border-primary/20 bg-primary/5 rounded-xl flex justify-between items-center cursor-pointer" onClick={() => setIsConsigneeDropdownOpen(!isConsigneeDropdownOpen)}>
                    <div><p className="font-bold text-sm">{consigneeData.name}</p><p className="text-xs text-text-muted">{consigneeData.city} - {consigneeData.mobile}</p></div>
                    <Button variant="outline" size="sm" className="text-primary border-primary/20">Change</Button>
                  </div>
                ) : <div onClick={() => setIsConsigneeDropdownOpen(!isConsigneeDropdownOpen)} className="w-full border-2 border-dashed border-border-subtle rounded-xl py-8 flex flex-col items-center text-text-muted cursor-pointer hover:border-primary/40 transition-colors"><User size={32} className="mb-2 opacity-50" /><p className="text-sm font-medium">Select Consignee</p></div>}
              
              <AnimatePresence>
                {isConsigneeDropdownOpen && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute z-50 mt-2 w-full bg-card-bg border border-border-subtle rounded-xl shadow-2xl max-h-72 overflow-hidden flex flex-col">
                    <div className="p-3 border-b border-border-subtle/20 bg-card-bg sticky top-0 z-10">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                        <input type="text" placeholder="Search consignee..." value={consigneeSearch} autoFocus onChange={(e) => setConsigneeSearch(e.target.value)} className="w-full bg-white/5 border border-border-subtle rounded-lg pl-9 py-2 text-xs outline-none focus:border-primary" />
                        {pickupLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary" size={14} />}
                      </div>
                    </div>
                    <div className="overflow-y-auto max-h-60 custom-scrollbar">
                      {consignees.map(c => (
                        <div key={c.id} onClick={() => { setConsigneeData(c); setIsConsigneeDropdownOpen(false); setConsigneeSearch(""); }} className="p-4 hover:bg-primary/10 cursor-pointer text-sm border-b border-border-subtle/10 last:border-0 transition-colors">
                          <p className="font-bold">{c.name}</p><p className="text-[11px] text-text-muted">{c.mobile} | {c.city}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment & Regional Area */}
      <Card className="bg-card-bg border-border-subtle">
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><CreditCard size={20} className="text-primary" /> Payment Method & Charges</h2>
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-lg border border-border-subtle">
                <ShieldCheck size={18} className={cn(isInsuranceEnabled ? "text-green-500" : "text-text-muted")} />
                <span className="text-sm font-medium">Add Insurance (1.8%)?</span>
                <button type="button" onClick={() => setIsInsuranceEnabled(!isInsuranceEnabled)} className={cn("w-10 h-5 rounded-full transition-all relative", isInsuranceEnabled ? "bg-primary" : "bg-white/20")}>
                  <div className={cn("w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all shadow-md", isInsuranceEnabled ? "left-6" : "left-0.5")} />
                </button>
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-end">
            <div className="flex flex-wrap gap-4 bg-dashboard-bg/20 p-2 rounded-xl border border-border-subtle">
              {["Prepaid", "COD", "To Pay", "Credit"].map(m => (
                <label key={m} className={cn("flex items-center gap-2 px-6 py-2 rounded-lg cursor-pointer transition-all", paymentMethod === m ? "bg-primary text-black shadow-lg" : "hover:bg-white/5 text-text-muted")}>
                  <input type="radio" className="sr-only" checked={paymentMethod === m} onChange={() => setPaymentMethod(m)} />
                  <span className="text-sm font-bold">{m}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-4 flex-1">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-text-muted uppercase ml-1">Amt ({paymentMethod})</label>
                <input type="number" value={paymentMethod === "Prepaid" ? prepaidAmount : paymentMethod === "COD" ? codAmount : paymentMethod === "To Pay" ? toPayAmount : creditAmount} 
                    onChange={(e) => {
                        const val = e.target.value;
                        if(paymentMethod === "Prepaid") setPrepaidAmount(val);
                        else if(paymentMethod === "COD") setCodAmount(val);
                        else if(paymentMethod === "To Pay") setToPayAmount(val);
                        else setCreditAmount(val);
                    }} className={inputClass} />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-text-muted uppercase ml-1">Insurance Preview</label>
                <div className={cn(inputClass, "bg-white/5 opacity-80 flex items-center justify-between")}>
                  <span>₹ {insuranceAmount}</span><Lock size={12} className="opacity-40" />
                </div>
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-text-muted uppercase ml-1">Regional Area</label>
                <input type="number" placeholder="0" value={regionalArea} onChange={(e) => setRegionalArea(e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Package Details */}
      <Card className="bg-card-bg border-border-subtle">
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div className="space-y-1">
                <h2 className="text-lg font-semibold flex items-center gap-2"><Scale size={20} className="text-primary" /> Package Details</h2>
                <div className="flex items-center gap-2 mt-2">
                    <MousePointerClick size={14} className={isManualFreight ? "text-primary" : "text-text-muted"} />
                    <span className="text-[10px] font-bold text-text-muted uppercase">Manual Freight?</span>
                    <button type="button" onClick={() => setIsManualFreight(!isManualFreight)} className={cn("w-8 h-4 rounded-full transition-all relative", isManualFreight ? "bg-primary" : "bg-white/20")}>
                        <div className={cn("w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all", isManualFreight ? "left-4.5" : "left-0.5")} />
                    </button>
                    {isManualFreight && <input type="number" placeholder="freight Charge" value={freightCharge} onChange={(e) => setFreightCharge(e.target.value)} className="bg-dashboard-bg border border-primary/30 rounded-lg px-3 py-1 text-xs text-primary focus:outline-none w-24 ml-2" />}
                </div>
            </div>
            <div className="flex gap-4 bg-primary/5 border border-primary/20 rounded-xl px-4 py-2">
              <div className="text-center pr-4 border-r border-primary/10"><p className="text-[10px] font-bold text-text-muted uppercase">Applicable</p><p className="text-sm font-bold text-primary">{weightSummary.applicable_weight_kg} kg</p></div>
              <div className="text-center pr-4 border-r border-primary/10"><p className="text-[10px] font-bold text-text-muted uppercase">Physical</p><p className="text-sm font-bold">{weightSummary.total_weight_kg} kg</p></div>
              <div className="text-center"><p className="text-[10px] font-bold text-text-muted uppercase">Vol (2700)</p><p className="text-sm font-bold text-green-500">{weightSummary.total_vol_weight_kg} kg</p></div>
            </div>
          </div>
          {packages.map((pkg, idx) => (
            <div key={pkg.id} className="grid grid-cols-2 md:grid-cols-7 gap-4 items-end border-b border-border-subtle pb-6 last:border-0">
              <div className="space-y-1"><label className="text-[10px] font-bold text-text-muted uppercase">L (cm)</label><input type="number" value={pkg.length_cm} onChange={(e) => handlePackageChange(pkg.id, "length_cm", e.target.value)} className={inputClass} /></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-text-muted uppercase">B (cm)</label><input type="number" value={pkg.breadth_cm} onChange={(e) => handlePackageChange(pkg.id, "breadth_cm", e.target.value)} className={inputClass} /></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-text-muted uppercase">H (cm)</label><input type="number" value={pkg.height_cm} onChange={(e) => handlePackageChange(pkg.id, "height_cm", e.target.value)} className={inputClass} /></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-text-muted uppercase">Vol (kg)</label><div className={cn(inputClass, "bg-white/5 flex items-center justify-center")}>{pkg.row_vol_weight}</div></div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase">Manual Weight</label>
                <div className="flex">
                  <input type="number" value={pkg.weight_value} onChange={(e) => handlePackageChange(pkg.id, "weight_value", e.target.value)} className={cn(inputClass, "rounded-r-none")} placeholder="0.0" />
                  <select value={pkg.weight_unit} onChange={(e) => handlePackageChange(pkg.id, "weight_unit", e.target.value)} className="bg-dashboard-bg border border-l-0 border-border-subtle rounded-r-lg px-1 text-[10px] text-primary outline-none">
                    <option value="kg">kg</option><option value="g">g</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end"><Button variant="destructive" size="icon" onClick={() => setPackages(packages.filter(i => i.id !== pkg.id))}><Trash2 size={16} /></Button></div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setPackages([...packages, { id: Date.now() + Math.random(), count: 1, length_cm: 0, breadth_cm: 0, height_cm: 0, weight_unit: "kg", weight_value: "", row_vol_weight: 0 }])} className="border-primary text-primary hover:bg-primary/10 transition-colors"><Plus size={16} className="mr-2" /> Add Package</Button>
        </CardContent>
      </Card>

      {/* Product Details */}
      <Card className="bg-card-bg border-border-subtle">
        <CardContent className="p-6 space-y-6">
          <div className="flex justify-between items-center"><h2 className="text-lg font-semibold">Product Details</h2><div className="bg-primary/10 px-4 py-2 rounded-lg border border-primary/20"><span className="text-lg font-bold text-primary">₹{totalOrderValue.toFixed(2)}</span></div></div>
          {products.map(p => (
            <div key={p.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-dashboard-bg/20 p-4 rounded-xl border border-border-subtle">
              <div className="md:col-span-4 space-y-1"><label className="text-[10px] font-bold text-text-muted uppercase ml-1">Item Name</label><input type="text" value={p.product_name} onChange={(e) => handleProductChange(p.id, "product_name", e.target.value)} className={inputClass} /></div>
              <div className="md:col-span-3 space-y-1"><label className="text-[10px] font-bold text-text-muted uppercase ml-1">Package Assignment</label>
                  <select value={p.package_index} onChange={(e) => handleProductChange(p.id, "package_index", e.target.value)} className={cn(inputClass, "bg-dashboard-bg cursor-pointer")}>
                    {packages.map((_, i) => <option key={i+1} value={i+1}>Package {i+1}</option>)}
                  </select>
              </div>
              <div className="md:col-span-2 space-y-1"><label className="text-[10px] font-bold text-text-muted uppercase">Invoice Price</label><input type="number" value={p.unit_price} onChange={(e) => handleProductChange(p.id, "unit_price", e.target.value)} className={inputClass} /></div>
              <div className="md:col-span-2 space-y-1"><label className="text-[10px] font-bold text-text-muted uppercase">Qty</label><input type="number" value={p.qty} onChange={(e) => handleProductChange(p.id, "qty", e.target.value)} className={inputClass} /></div>
              <div className="md:col-span-1 flex justify-end"><Button variant="destructive" size="icon" onClick={() => setProducts(products.filter(i => i.id !== p.id))}><Trash2 size={16} /></Button></div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addProductRow} className="border-primary text-primary hover:bg-primary/10 transition-colors"><Plus size={16} className="mr-2" /> Add Item</Button>
        </CardContent>
      </Card>

      {/* Compliance Details */}
      <Card className="bg-card-bg border-border-subtle">
        <button type="button" onClick={() => setIsOtherDetailsOpen(!isOtherDetailsOpen)} className="w-full flex justify-between p-6 items-center hover:bg-white/5 transition-colors rounded-xl"><h2 className="text-lg font-semibold flex items-center gap-2"><FileText size={20} className="text-primary"/> Compliance Details</h2>{isOtherDetailsOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</button>
        {isOtherDetailsOpen && (
          <CardContent className="p-6 pt-0 border-t border-border-subtle/20 animate-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="space-y-1"><label className="text-[10px] font-bold text-text-muted uppercase ml-1">GST Number</label><input type="text" value={otherDetails.gst_number} onChange={(e) => setOtherDetails({...otherDetails, gst_number: e.target.value})} className={inputClass} /></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-text-muted uppercase ml-1">E-Way Bill</label><input type="text" value={otherDetails.eway_bill_number} onChange={(e) => setOtherDetails({...otherDetails, eway_bill_number: e.target.value})} className={inputClass} /></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-text-muted uppercase ml-1">Invoice Number</label><input type="text" value={otherDetails.invoicenumber} onChange={(e) => setOtherDetails({...otherDetails, invoicenumber: e.target.value})} className={inputClass} /></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-text-muted uppercase ml-1"> Total Bill Amount</label><input type="number" value={otherDetails.amount} onChange={(e) => setOtherDetails({...otherDetails, amount: e.target.value})} className={inputClass} /></div>
              <div className="md:col-span-2 flex items-center justify-between bg-dashboard-bg/20 p-4 rounded-xl border border-border-subtle">
                <div className="flex items-center gap-3"><div className={cn("w-10 h-10 rounded-full flex items-center justify-center", isGstExempt ? "bg-primary/20 text-primary" : "bg-white/10 text-text-muted")}><BanIcon size={18}/></div><div><p className="text-sm font-bold">GST Exempt Order</p></div></div>
                <button type="button" onClick={() => setIsGstExempt(!isGstExempt)} className={cn("w-12 h-6 rounded-full transition-all relative", isGstExempt ? "bg-primary" : "bg-white/5 border border-border-subtle")}><div className={cn("w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all shadow-md", isGstExempt ? "left-7" : "left-0.5")} /></button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card-bg/90 backdrop-blur-md border-t border-border-subtle flex justify-end z-30 shadow-2xl">
        <Button disabled={orderLoading} onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-black px-10 h-11 font-bold rounded-xl shadow-lg flex gap-2 transition-transform active:scale-95">
          {orderLoading ? <Loader2 className="animate-spin" size={18} /> : <><ShoppingBag size={18} /> {isEditMode ? "Update Order" : "Complete Order"}</>}
        </Button>
      </div>
    </div>
  );
}