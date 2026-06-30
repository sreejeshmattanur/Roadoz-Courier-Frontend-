import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Lock,
  ShoppingBag,
  Search,
  MapPin,
  Loader2,
  User,
  Phone,
  Mail,
  MapPinned,
  X,
  CreditCard,
  ShieldCheck,
  Globe,
  Truck,
  Zap,
  Ban,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useLocation, useParams } from "react-router-dom";
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
    loading: pickupLoading,
    error: reduxError,
  } = useSelector((state) => state.orders);

  // --- States ---
  const [orderType, setOrderType] = useState("B2C");
  const [serviceType, setServiceType] = useState("Surface");
  const [paymentMethod, setPaymentMethod] = useState("Prepaid");
  const [codAmount, setCodAmount] = useState("");
  const [toPayAmount, setToPayAmount] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [insurance, setInsurance] = useState("");
  const [regionalArea, setRegionalArea] = useState("");
  const [isGstExempt, setIsGstExempt] = useState(false);

  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [isAddressDropdownOpen, setIsAddressDropdownOpen] = useState(false);
  const [pickupSearch, setPickupSearch] = useState(""); // NEW: Search for Pickup

  const [isConsigneeDropdownOpen, setIsConsigneeDropdownOpen] = useState(false);
  const [consigneeSearch, setConsigneeSearch] = useState("");
  const [isConsigneeModalOpen, setIsConsigneeModalOpen] = useState(false);
  
  const [isOtherDetailsOpen, setIsOtherDetailsOpen] = useState(true);

  const [pickupForm, setPickupForm] = useState({
    nickname: "", contact_name: "", phone: "", email: "",
    address_line_1: "", address_line_2: "", pincode: "",
    city: "", state: "", country: "India",
  });

  const [consigneeData, setConsigneeData] = useState({
    id: null, name: "", mobile: "", alternate_mobile: "",
    email: "", address_line_1: "", address_line_2: "",
    pincode: "", city: "", state: "",
  });

  const [consigneeForm, setConsigneeForm] = useState({
    name: "", mobile: "", alternate_mobile: "", email: "",
    address_line_1: "", address_line_2: "", pincode: "",
    city: "", state: "",
  });

  const [products, setProducts] = useState([
    {
      id: Date.now(),
      product_name: "",
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      unit_price: "",
      qty: 1,
      total: 0,
      package_index: 1,
    },
  ]);

  const [packages, setPackages] = useState([
    {
      id: Date.now(),
      count: 1,
      length_cm: "",
      breadth_cm: "",
      height_cm: "",
      vol_weight_kg: 0,
      physical_weight_kg: "",
    },
  ]);

  const [otherDetails, setOtherDetails] = useState({
    gst_number: "",
    eway_bill_number: "",
    invoicenumber: "",
    amount: "",
  });

  // --- Effects ---
  useEffect(() => {
    dispatch(fetchPickupAddresses({ limit: 10 }));
    dispatch(fetchConsignees({ limit: 10 }));
  }, [dispatch]);

  useEffect(() => {
    if (!editOrderData) return;
    setOrderType(editOrderData.order_type || "B2C");
    setServiceType(editOrderData.service_type || "Surface");
    setPaymentMethod(editOrderData.payment_method || "Prepaid");
    setCodAmount(editOrderData.cod_amount || "");
    setToPayAmount(editOrderData.to_pay_amount || "");
    setCreditAmount(editOrderData.credit_amount || "");
    setInsurance(editOrderData.insurance || "");
    setRegionalArea(editOrderData.regional_area || "");
    setIsGstExempt(editOrderData.is_gst_exempt || false);

    if (editOrderData.pickup_address) dispatch(setSelectedAddress(editOrderData.pickup_address));
    if (editOrderData.consignee) {
        setConsigneeData(editOrderData.consignee);
        setConsigneeSearch(editOrderData.consignee.name || "");
    }
    if (editOrderData.items?.length > 0) {
      setProducts(editOrderData.items.map((item) => ({ ...item, id: Date.now() + Math.random(), package_index: item.package_index || 1 })));
    }
    if (editOrderData.packages?.length > 0) {
      setPackages(editOrderData.packages.map((pkg) => ({ ...pkg, id: Date.now() + Math.random() })));
    }
    setOtherDetails({ 
      gst_number: editOrderData.gst_number || "", 
      eway_bill_number: editOrderData.eway_bill_number || "",
      invoicenumber: editOrderData.invoicenumber || "",
      amount: editOrderData.amount || ""
    });
  }, [editOrderData, dispatch]);

  // --- Calculations ---
  const totalOrderValue = useMemo(() => products.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0), [products]);

  const weightSummary = useMemo(() => {
    let totalPhys = 0, totalVol = 0;
    packages.forEach((pkg) => {
      const vol = (Number(pkg.length_cm) * Number(pkg.breadth_cm) * Number(pkg.height_cm)) / 5000;
      totalVol += vol * Number(pkg.count);
      totalPhys += Number(pkg.physical_weight_kg) * Number(pkg.count);
    });
    return { totalVol: totalVol.toFixed(2), totalPhys: totalPhys.toFixed(2), applicable: Math.max(totalVol, totalPhys).toFixed(2) };
  }, [packages]);

  // --- Handlers ---
  const handleProductChange = (id, field, value) => {
    setProducts((prev) => prev.map((p) => {
      if (p.id === id) {
        const updated = { ...p, [field]: value };
        if (field === "unit_price" || field === "qty") updated.total = (Number(updated.unit_price) || 0) * (Number(updated.qty) || 0);
        return updated;
      }
      return p;
    }));
  };

  const handlePackageChange = (id, field, value) => {
    setPackages((prev) => prev.map((p) => {
      if (p.id === id) {
        const updated = { ...p, [field]: value };
        const vol = (Number(updated.length_cm) * Number(updated.breadth_cm) * Number(updated.height_cm)) / 5000;
        updated.vol_weight_kg = vol.toFixed(2);
        return updated;
      }
      return p;
    }));
  };

  const handleSubmit = async () => {
    if (!selectedAddress) return toast.error("Please select a pickup address");
    if (!consigneeData.id) return toast.error("Please select a consignee");

    const payload = {
      order_type: orderType,
      service_type: serviceType,
      is_gst_exempt: isGstExempt,
      pickup_address_id: selectedAddress.id,
      consignee_id: consigneeData.id,
      payment_method: paymentMethod,
      cod_amount: paymentMethod === "COD" ? Number(codAmount) : 0,
      to_pay_amount: paymentMethod === "To Pay" ? Number(toPayAmount) : 0,
      credit_amount: paymentMethod === "Credit" ? Number(creditAmount) : 0,
      insurance: Number(insurance) || 0,
      regional_area: Number(regionalArea) || 0,
      rov: "owner_risk",
      order_value: Number(totalOrderValue),
      items: products.map(({ id, ...rest }) => ({ ...rest, unit_price: Number(rest.unit_price), qty: Number(rest.qty), total: Number(rest.total), package_index: Number(rest.package_index) })),
      packages: packages.map(({ id, ...rest }) => ({ ...rest, count: Number(rest.count), length_cm: Number(rest.length_cm), breadth_cm: Number(rest.breadth_cm), height_cm: Number(rest.height_cm), vol_weight_kg: Number(rest.vol_weight_kg), physical_weight_kg: Number(rest.physical_weight_kg) })),
      gst_number: otherDetails.gst_number || null,
      eway_bill_number: otherDetails.eway_bill_number || null,
      invoicenumber: otherDetails.invoicenumber || null,
      amount: Number(otherDetails.amount) || 0,
    };

    try {
      if (isEditMode) await dispatch(updateOrder({ orderId, data: payload })).unwrap();
      else await dispatch(createOrder(payload)).unwrap();
      toast.success("Order processed successfully!");
      navigate("/dashboard/processing-order");
    } catch (err) {
      if (Array.isArray(err)) {
        err.forEach((errorItem) => {
          const field = errorItem.loc ? errorItem.loc.slice(1).join(".") : "Field";
          toast.error(`${field}: ${errorItem.msg}`);
        });
      } else if (typeof err === "string") {
        toast.error(err);
      } else {
        toast.error("Failed to process order.");
      }
    }
  };

  const inputClass = "w-full bg-transparent border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-all";

  return (
    <div className="space-y-6 relative pb-24 min-h-screen">
      <PickupAddressModal isOpen={isPickupModalOpen} onClose={() => setIsPickupModalOpen(false)} pickupForm={pickupForm} handlePickupChange={(e) => setPickupForm({...pickupForm, [e.target.name]: e.target.value})} handleSavePickup={() => dispatch(createPickupAddress(pickupForm)).unwrap().then(() => setIsPickupModalOpen(false))} loading={pickupLoading} inputClass={inputClass} />
      <ConsigneeModal isOpen={isConsigneeModalOpen} onClose={() => setIsConsigneeModalOpen(false)} consigneeForm={consigneeForm} handleConsigneeChange={(e) => setConsigneeForm({...consigneeForm, [e.target.name]: e.target.value})} handleSaveConsignee={() => dispatch(createConsignee(consigneeForm)).unwrap().then((newC) => { setConsigneeData(newC); setConsigneeSearch(newC.name || ""); setIsConsigneeModalOpen(false); })} loading={pickupLoading} inputClass={inputClass} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{isEditMode ? "Edit Order" : "New Order"}</h1>
          <p className="text-xs md:text-sm text-primary mt-1 font-medium">Dashboard <span className="text-text-muted mx-2">&gt;&gt;</span> {isEditMode ? "Edit Order" : "New Order"}</p>
        </div>
      </div>

      {/* Selection Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-3 bg-card-bg/40 p-4 rounded-xl border border-border-subtle">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Order Type *</span>
          <div className="flex items-center gap-6">
            {["B2C", "B2B", "International"].map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer group">
                <input type="radio" className="sr-only" checked={orderType === type} onChange={() => setOrderType(type)} />
                <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all", orderType === type ? "border-primary" : "border-text-muted/30 group-hover:border-primary/50")}>
                  {orderType === type && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
                <span className="text-sm font-medium">{type}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 bg-card-bg/40 p-4 rounded-xl border border-border-subtle">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Service Type *</span>
          <div className="flex items-center gap-6">
            {[
              { id: "Surface", icon: Truck },
              { id: "Express", icon: Zap }
            ].map((service) => (
              <label key={service.id} className="flex items-center gap-2 cursor-pointer group">
                <input type="radio" className="sr-only" checked={serviceType === service.id} onChange={() => setServiceType(service.id)} />
                <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all", serviceType === service.id ? "border-primary" : "border-text-muted/30 group-hover:border-primary/50")}>
                  {serviceType === service.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
                <span className={cn("text-sm font-medium flex items-center gap-1", serviceType === service.id ? "text-primary" : "text-text-main")}>
                  <service.icon size={14} /> {service.id}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Address Management (Pickup and Consignee both with Search) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pickup Address Card with Search */}
        <Card className="bg-card-bg border-border-subtle overflow-visible relative">
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold flex items-center gap-2"><MapPinned size={20} className="text-primary" /> Pickup From</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsPickupModalOpen(true)} className="text-primary hover:bg-primary/10"><Plus size={16} className="mr-1" /> Add New</Button>
            </div>
            <div className="relative">
              <div onClick={() => setIsAddressDropdownOpen(!isAddressDropdownOpen)} className="cursor-pointer">
                {selectedAddress ? (
                  <div className="flex items-center justify-between p-4 border border-primary/20 bg-primary/5 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary"><MapPin size={20} /></div>
                      <div><p className="font-bold text-sm">{selectedAddress.nickname}</p><p className="text-xs text-text-muted">{selectedAddress.city} - {selectedAddress.pincode}</p></div>
                    </div>
                    <Button variant="outline" size="sm" className="text-primary border-primary/20 hover:bg-primary/10">Change</Button>
                  </div>
                ) : <div className="w-full border-2 border-dashed border-border-subtle rounded-xl py-8 flex flex-col items-center justify-center text-text-muted group"><MapPin size={32} className="mb-2 opacity-50 group-hover:scale-110 transition-transform" /><p className="text-sm font-medium">Select a pickup location</p></div>}
              </div>
              <AnimatePresence>
                {isAddressDropdownOpen && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute z-50 mt-2 w-full bg-card-bg border border-border-subtle rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
                    <div className="p-3 border-b border-border-subtle/20 bg-card-bg sticky top-0 z-10">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                        <input
                          type="text"
                          placeholder="Search by Nickname / City / Name"
                          value={pickupSearch}
                          onChange={(e) => {
                            setPickupSearch(e.target.value);
                            dispatch(fetchPickupAddresses({ search: e.target.value }));
                          }}
                          className="w-full bg-transparent border border-border-subtle rounded-lg pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-primary"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    {pickupAddresses?.map((addr) => (
                      <div key={addr.id} onClick={() => { dispatch(setSelectedAddress(addr)); setIsAddressDropdownOpen(false); }} className="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b border-border-subtle/20 last:border-0 transition-colors">
                        <MapPin size={16} className="text-primary" />
                        <div><p className="text-sm font-bold">{addr.nickname}</p><p className="text-[11px] text-text-muted">{addr.city} ({addr.contact_name})</p></div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Deliver To Card with Search */}
        <Card className="bg-card-bg border-border-subtle overflow-visible relative">
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold flex items-center gap-2"><User size={20} className="text-primary" /> Deliver To</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsConsigneeModalOpen(true)} className="text-primary hover:bg-primary/10"><Plus size={16} className="mr-1" /> Add New</Button>
            </div>
            <div className="relative">
              <div onClick={() => setIsConsigneeDropdownOpen(!isConsigneeDropdownOpen)} className="cursor-pointer">
                {consigneeData.id ? (
                  <div className="flex items-center justify-between p-4 border border-primary/20 bg-primary/5 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary"><User size={20} /></div>
                      <div><p className="font-bold text-sm">{consigneeData.name}</p><p className="text-xs text-text-muted">{consigneeData.city} - {consigneeData.mobile}</p></div>
                    </div>
                    <Button variant="outline" size="sm" className="text-primary border-primary/20 hover:bg-primary/10">Change</Button>
                  </div>
                ) : <div className="w-full border-2 border-dashed border-border-subtle rounded-xl py-8 flex flex-col items-center justify-center text-text-muted group"><User size={32} className="mb-2 opacity-50 group-hover:scale-110 transition-transform" /><p className="text-sm font-medium">Select a consignee</p></div>}
              </div>
              <AnimatePresence>
                {isConsigneeDropdownOpen && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute z-50 mt-2 w-full bg-card-bg border border-border-subtle rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
                    <div className="p-3 border-b border-border-subtle/20 bg-card-bg sticky top-0 z-10">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                        <input
                          type="text"
                          placeholder="Search by Name / Email / Mobile"
                          value={consigneeSearch}
                          onChange={(e) => {
                            setConsigneeSearch(e.target.value);
                            dispatch(fetchConsignees({ search: e.target.value }));
                          }}
                          className="w-full bg-transparent border border-border-subtle rounded-lg pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-primary"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    {consignees?.map((c) => (
                      <div key={c.id} onClick={() => { setConsigneeData(c); setIsConsigneeDropdownOpen(false); }} className="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer border-b border-border-subtle/20 last:border-0 transition-colors">
                        <User size={16} className="text-primary" />
                        <div><p className="text-sm font-bold">{c.name}</p><p className="text-[11px] text-text-muted">{c.city} ({c.mobile})</p></div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment & Charges */}
      <Card className="bg-card-bg border-border-subtle">
        <CardContent className="p-6 space-y-6">
          <h2 className="text-lg font-semibold flex items-center gap-2"><CreditCard size={20} className="text-primary" /> Payment Method & Charges</h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-end">
            <div className="flex flex-wrap gap-4 bg-dashboard-bg/20 p-2 rounded-xl border border-border-subtle">
              {["Prepaid", "COD", "To Pay", "Credit"].map((m) => (
                <label key={m} className={cn("flex items-center gap-2 px-6 py-2 rounded-lg cursor-pointer transition-all", paymentMethod === m ? "bg-primary text-black shadow-lg" : "hover:bg-white/5 text-text-muted")}>
                  <input type="radio" className="sr-only" checked={paymentMethod === m} onChange={() => setPaymentMethod(m)} />
                  <span className="text-sm font-bold">{m}</span>
                </label>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 flex-1">
              {paymentMethod !== "Prepaid" && (
                <div className="space-y-1 flex-1 min-w-[140px]">
                  <label className="text-[10px] uppercase font-bold text-text-muted ml-1">{paymentMethod} Amount*</label>
                  <input type="number" value={paymentMethod === "COD" ? codAmount : paymentMethod === "To Pay" ? toPayAmount : creditAmount} onChange={(e) => paymentMethod === "COD" ? setCodAmount(e.target.value) : paymentMethod === "To Pay" ? setToPayAmount(e.target.value) : setCreditAmount(e.target.value)} className={inputClass} placeholder="0.00" />
                </div>
              )}
              <div className="space-y-1 flex-1 min-w-[140px]"><label className="text-[10px] uppercase font-bold text-text-muted ml-1 flex items-center gap-1"><ShieldCheck size={12}/> Insurance</label><input type="number" value={insurance} onChange={(e) => setInsurance(e.target.value)} className={inputClass} placeholder="0.00" /></div>
              <div className="space-y-1 flex-1 min-w-[140px]"><label className="text-[10px] uppercase font-bold text-text-muted ml-1 flex items-center gap-1"><Globe size={12}/> Regional Area</label><input type="number" value={regionalArea} onChange={(e) => setRegionalArea(e.target.value)} className={inputClass} placeholder="0.00" /></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Details Section */}
      <Card className="bg-card-bg border-border-subtle">
        <CardContent className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Product Details</h2>
            <div className="bg-primary/10 px-4 py-2 rounded-lg border border-primary/20"><span className="text-xs font-bold uppercase tracking-wider">Value: ₹</span><span className="text-lg font-bold text-primary ml-1">{totalOrderValue.toFixed(2)}</span></div>
          </div>
          <div className="space-y-4">
            {products.map((p) => (
              <div key={p.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-dashboard-bg/20 p-4 rounded-xl border border-border-subtle shadow-sm transition-all hover:bg-dashboard-bg/30">
                <div className="md:col-span-3 space-y-1"><label className="text-[10px] uppercase font-bold text-text-muted ml-1">Product*</label><input type="text" value={p.product_name} onChange={(e) => handleProductChange(p.id, "product_name", e.target.value)} className={inputClass} placeholder="Name" /></div>
                <div className="md:col-span-2 space-y-1"><label className="text-[10px] uppercase font-bold text-text-muted ml-1">SKU</label><input type="text" value={p.sku} disabled className={cn(inputClass, "opacity-70 bg-white/5")} /></div>
                <div className="md:col-span-2 space-y-1"><label className="text-[10px] uppercase font-bold text-text-muted ml-1">Price*</label><input type="number" value={p.unit_price} onChange={(e) => handleProductChange(p.id, "unit_price", e.target.value)} className={inputClass} /></div>
                <div className="md:col-span-1 space-y-1"><label className="text-[10px] uppercase font-bold text-text-muted ml-1">QTY*</label><input type="number" value={p.qty} onChange={(e) => handleProductChange(p.id, "qty", e.target.value)} className={inputClass} /></div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-text-muted ml-1">Package Index</label>
                  <select value={p.package_index} onChange={(e) => handleProductChange(p.id, "package_index", e.target.value)} className={cn(inputClass, "bg-dashboard-bg appearance-none cursor-pointer")}>
                    {products.map((_, i) => <option key={i} value={i + 1}>Package {i + 1}</option>)}
                  </select>
                </div>
                <div className="md:col-span-1 py-2.5 font-bold text-center">₹{p.total}</div>
                <div className="md:col-span-1 flex justify-end"><Button variant="destructive" size="icon" onClick={() => setProducts(products.filter(i => i.id !== p.id))} className="h-10 w-10"><Trash2 size={16} /></Button></div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setProducts([...products, { id: Date.now(), product_name: "", sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`, unit_price: "", qty: 1, total: 0, package_index: products.length + 1 }])} className="border-primary text-primary hover:bg-primary/10"><Plus size={16} className="mr-2" /> Add Item</Button>
          </div>
        </CardContent>
      </Card>

      {/* Package Details Section */}
      <Card className="bg-card-bg border-border-subtle">
        <CardContent className="p-6 space-y-6">
          <h2 className="text-lg font-semibold">Package Details</h2>
          {packages.map((pkg, index) => (
            <div key={pkg.id} className="grid grid-cols-2 md:grid-cols-7 gap-4 items-end border-b border-border-subtle pb-6 last:border-0 last:pb-0">
              <div className="space-y-1"><label className="text-[10px] font-bold text-text-muted ml-1 tracking-wider uppercase">Pkg {index+1} Count</label><input type="number" value={pkg.count} onChange={(e) => handlePackageChange(pkg.id, "count", e.target.value)} className={inputClass} /></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-text-muted ml-1 tracking-wider uppercase">L (cm)*</label><input type="number" value={pkg.length_cm} onChange={(e) => handlePackageChange(pkg.id, "length_cm", e.target.value)} className={inputClass} /></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-text-muted ml-1 tracking-wider uppercase">B (cm)*</label><input type="number" value={pkg.breadth_cm} onChange={(e) => handlePackageChange(pkg.id, "breadth_cm", e.target.value)} className={inputClass} /></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-text-muted ml-1 tracking-wider uppercase">H (cm)*</label><input type="number" value={pkg.height_cm} onChange={(e) => handlePackageChange(pkg.id, "height_cm", e.target.value)} className={inputClass} /></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-text-muted ml-1 tracking-wider uppercase">Vol (kg)</label><input type="text" value={pkg.vol_weight_kg} disabled className="w-full bg-dashboard-bg border rounded-lg px-2 py-2.5 text-sm" /></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-text-muted ml-1 tracking-wider uppercase">Phys (kg)*</label><input type="number" value={pkg.physical_weight_kg} onChange={(e) => handlePackageChange(pkg.id, "physical_weight_kg", e.target.value)} className={inputClass} /></div>
              <Button variant="destructive" size="icon" onClick={() => setPackages(packages.filter(i => i.id !== pkg.id))} className="h-10 w-10"><Trash2 size={16} /></Button>
            </div>
          ))}
          <div className="flex flex-col md:flex-row justify-between items-center bg-green-500/10 border border-green-500/20 rounded-xl p-6 gap-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-10 h-10 bg-green-500 text-white rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-green-500/20"><Lock size={20} /></div>
              <div className="grid grid-cols-3 gap-6 flex-1">
                <div><p className="text-[10px] uppercase font-bold text-text-muted">Applicable</p><p className="text-lg font-bold text-green-500">{weightSummary.applicable} kg</p></div>
                <div><p className="text-[10px] uppercase font-bold text-text-muted">Volumetric</p><p className="text-xs font-bold">{weightSummary.totalVol} kg</p></div>
                <div><p className="text-[10px] uppercase font-bold text-text-muted">Physical</p><p className="text-xs font-bold">{weightSummary.totalPhys} kg</p></div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setPackages([...packages, { id: Date.now(), count: 1, length_cm: "", breadth_cm: "", height_cm: "", vol_weight_kg: 0, physical_weight_kg: "" }])} className="border-primary text-primary hover:bg-primary/10 transition-colors"><Plus size={16} className="mr-2" /> Add Package</Button>
          </div>
        </CardContent>
      </Card>

      {/* Compliance & Toggle Card */}
      <Card className="bg-card-bg border-border-subtle">
        <button onClick={() => setIsOtherDetailsOpen(!isOtherDetailsOpen)} className="w-full flex justify-between p-6 items-center hover:bg-white/5 transition-colors rounded-t-xl">
          <h2 className="text-lg font-semibold">Other Details & Compliance</h2>
          {isOtherDetailsOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        {isOtherDetailsOpen && (
          <CardContent className="p-6 pt-0 border-t border-border-subtle/20 animate-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="space-y-1"><label className="text-[10px] font-bold text-text-muted ml-1 uppercase">GST Number</label><input type="text" value={otherDetails.gst_number} onChange={(e) => setOtherDetails({ ...otherDetails, gst_number: e.target.value })} className={inputClass} placeholder="Enter GST Number" /></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-text-muted ml-1 uppercase">E-Way Bill Number</label><input type="text" value={otherDetails.eway_bill_number} onChange={(e) => setOtherDetails({ ...otherDetails, eway_bill_number: e.target.value })} className={inputClass} placeholder="Enter E-Way Bill Number" /></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-text-muted ml-1 uppercase">Invoice Number</label><input type="text" value={otherDetails.invoicenumber} onChange={(e) => setOtherDetails({ ...otherDetails, invoicenumber: e.target.value })} className={inputClass} placeholder="Enter Invoice Number" /></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-text-muted ml-1 uppercase">Amount</label><input type="number" value={otherDetails.amount} onChange={(e) => setOtherDetails({ ...otherDetails, amount: e.target.value })} className={inputClass} placeholder="0.00" /></div>
                    {/* NEW: GST Exempt Toggle */}
              <div className="flex items-center justify-between bg-dashboard-bg/20 p-4 rounded-xl border border-border-subtle md:col-span-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Ban size={18}/></div>
                    <div>
                        <p className="text-sm font-bold">GST Exempt Order</p>
                        <p className="text-[10px] text-text-muted">Enable this to omit GST from the order calculations.</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsGstExempt(!isGstExempt)}
                    className={cn(
                        "w-12 h-6 rounded-full transition-all relative border border-border-subtle",
                        isGstExempt ? "bg-primary" : "bg-white/5"
                    )}
                >
                    <div className={cn(
                        "w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all shadow-md",
                        isGstExempt ? "left-7" : "left-0.5"
                    )} />
                </button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
      

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card-bg/90 backdrop-blur-md border-t border-border-subtle flex justify-end z-30 shadow-2xl">
        <Button disabled={orderLoading} onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-black px-10 h-11 font-bold rounded-xl shadow-lg flex gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
          {orderLoading ? <Loader2 className="animate-spin" size={18} /> : <><ShoppingBag size={18} /> {isEditMode ? "Update Order" : "Complete Order"}</>}
        </Button>
      </div>
    </div>
  );
}