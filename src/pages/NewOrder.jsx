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

  const [orderType, setOrderType] = useState("B2C");
  const [paymentMethod, setPaymentMethod] = useState("Prepaid");
  const [codAmount, setCodAmount] = useState("");
  const [toPayAmount, setToPayAmount] = useState("");
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [isAddressDropdownOpen, setIsAddressDropdownOpen] = useState(false);
  const [isConsigneeDropdownOpen, setIsConsigneeDropdownOpen] = useState(false);
  const [isConsigneeModalOpen, setIsConsigneeModalOpen] = useState(false);
  const [isOtherDetailsOpen, setIsOtherDetailsOpen] = useState(true);

  const [pickupForm, setPickupForm] = useState({
    nickname: "",
    contact_name: "",
    phone: "",
    email: "",
    address_line_1: "",
    address_line_2: "",
    pincode: "",
    city: "",
    state: "",
    country: "India",
  });

  const [consigneeSearch, setConsigneeSearch] = useState("");
  const [showConsigneeResults, setShowConsigneeResults] = useState(false);
  const [consigneeData, setConsigneeData] = useState({
    id: null,
    name: "",
    mobile: "",
    alternate_mobile: "",
    email: "",
    address_line_1: "",
    address_line_2: "",
    pincode: "",
    city: "",
    state: "",
  });

  const [consigneeForm, setConsigneeForm] = useState({
    name: "",
    mobile: "",
    alternate_mobile: "",
    email: "",
    address_line_1: "",
    address_line_2: "",
    pincode: "",
    city: "",
    state: "",
  });

  const [products, setProducts] = useState([
    {
      id: Date.now(),
      product_name: "",
      sku: "",
      unit_price: "",
      qty: 1,
      total: 0,
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
  });

  useEffect(() => {
    if (!editOrderData) return;

    setOrderType(editOrderData.order_type || "B2C");

    setPaymentMethod(editOrderData.payment_method || "Prepaid");

    setCodAmount(editOrderData.cod_amount || "");

    setToPayAmount(editOrderData.to_pay_amount || "");

    if (editOrderData.pickup_address) {
      dispatch(setSelectedAddress(editOrderData.pickup_address));
    }

    if (editOrderData.consignee) {
      setConsigneeData(editOrderData.consignee);

      setConsigneeSearch(editOrderData.consignee.name || "");
    }

    if (editOrderData.items?.length > 0) {
      setProducts(
        editOrderData.items.map((item) => ({
          id: Date.now() + Math.random(),
          product_name: item.product_name || "",
          sku: item.sku || "",
          unit_price: item.unit_price || "",
          qty: item.qty || 1,
          total: item.total || 0,
        })),
      );
    }

    if (editOrderData.packages?.length > 0) {
      setPackages(
        editOrderData.packages.map((pkg) => ({
          id: Date.now() + Math.random(),
          count: pkg.count || 1,
          length_cm: pkg.length_cm || "",
          breadth_cm: pkg.breadth_cm || "",
          height_cm: pkg.height_cm || "",
          vol_weight_kg: pkg.vol_weight_kg || 0,
          physical_weight_kg: pkg.physical_weight_kg || "",
        })),
      );
    }

    setOtherDetails({
      gst_number: editOrderData.gst_number || "",
      eway_bill_number: editOrderData.eway_bill_number || "",
    });
  }, [editOrderData, dispatch]);

  useEffect(() => {
    dispatch(fetchPickupAddresses());
    dispatch(fetchConsignees({ limit: 100 }));
  }, [dispatch]);

  // --- Calculations ---
  const totalOrderValue = useMemo(
    () => products.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0),
    [products],
  );

  const weightSummary = useMemo(() => {
    let totalPhys = 0;
    let totalVol = 0;
    packages.forEach((pkg) => {
      const vol =
        (Number(pkg.length_cm) *
          Number(pkg.breadth_cm) *
          Number(pkg.height_cm)) /
        5000;
      totalVol += vol * Number(pkg.count);
      totalPhys += Number(pkg.physical_weight_kg) * Number(pkg.count);
    });
    return {
      totalVol: totalVol.toFixed(2),
      totalPhys: totalPhys.toFixed(2),
      applicable: Math.max(totalVol, totalPhys).toFixed(2),
    };
  }, [packages]);

  const handlePickupChange = (e) => {
    const { name, value } = e.target;
    setPickupForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleConsigneeChange = (e) => {
    const { name, value } = e.target;
    setConsigneeForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProductChange = (id, field, value) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, [field]: value };
          if (field === "unit_price" || field === "qty") {
            updated.total =
              (Number(updated.unit_price) || 0) * (Number(updated.qty) || 0);
          }
          return updated;
        }
        return p;
      }),
    );
  };

  const handlePackageChange = (id, field, value) => {
    setPackages((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, [field]: value };
          const vol =
            (Number(updated.length_cm) *
              Number(updated.breadth_cm) *
              Number(updated.height_cm)) /
            5000;
          updated.vol_weight_kg = vol.toFixed(2);
          return updated;
        }
        return p;
      }),
    );
  };

  const selectConsignee = (c) => {
    setConsigneeData(c);
    setConsigneeSearch(c.name || "");
    setShowConsigneeResults(false);
  };

  const clearConsignee = () => {
    setConsigneeData({
      id: null,
      name: "",
      mobile: "",
      alternate_mobile: "",
      email: "",
      address_line_1: "",
      address_line_2: "",
      pincode: "",
      city: "",
      state: "",
    });
    setConsigneeSearch("");
  };

  const handleSubmit = async () => {
    if (!selectedAddress) return toast.error("Please select a pickup address");
    if (!consigneeData.name || !consigneeData.pincode)
      return toast.error("Consignee details are incomplete");

    try {
      let finalConsigneeId = consigneeData.id;
      if (!finalConsigneeId) {
        const newC = await createConsigneeApi(consigneeData);
        finalConsigneeId = newC.id;
      }

      const payload = {
        order_type: orderType,
        pickup_address_id: selectedAddress.id,
        consignee_id: finalConsigneeId,
        payment_method: paymentMethod,
        cod_amount: paymentMethod === "COD" ? Number(codAmount) : 0,
        to_pay_amount: paymentMethod === "To Pay" ? Number(toPayAmount) : 0,
        rov: "owner_risk",
        order_value: Number(totalOrderValue),
        items: products.map(({ id, ...rest }) => ({
          ...rest,
          unit_price: Number(rest.unit_price),
          qty: Number(rest.qty),
          total: Number(rest.total),
        })),
        packages: packages.map(({ id, ...rest }) => ({
          ...rest,
          count: Number(rest.count),
          length_cm: Number(rest.length_cm),
          breadth_cm: Number(rest.breadth_cm),
          height_cm: Number(rest.height_cm),
          vol_weight_kg: Number(rest.vol_weight_kg),
          physical_weight_kg: Number(rest.physical_weight_kg),
        })),
        gst_number: otherDetails.gst_number || null,
        eway_bill_number: otherDetails.eway_bill_number || null,
      };

      if (isEditMode) {
        await dispatch(
          updateOrder({
            orderId,
            data: payload,
          }),
        ).unwrap();

        toast.success("Order updated successfully!");
      } else {
        await dispatch(createOrder(payload)).unwrap();

        toast.success("Order placed successfully!");
      }

      navigate("/dashboard/processing-order");
    } catch (err) {
      toast.error("Failed to create order.");
    }
  };

  const inputClass =
    "w-full bg-transparent border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-all";

  return (
    <div className="space-y-6 relative pb-24 min-h-screen">
      <PickupAddressModal
        isOpen={isPickupModalOpen}
        onClose={() => setIsPickupModalOpen(false)}
        pickupForm={pickupForm}
        handlePickupChange={handlePickupChange}
        handleSavePickup={() =>
          dispatch(createPickupAddress(pickupForm))
            .unwrap()
            .then(() => setIsPickupModalOpen(false))
        }
        loading={pickupLoading}
        error={reduxError}
        inputClass={inputClass}
      />

      <ConsigneeModal
        isOpen={isConsigneeModalOpen}
        onClose={() => setIsConsigneeModalOpen(false)}
        consigneeForm={consigneeForm}
        handleConsigneeChange={handleConsigneeChange}
        handleSaveConsignee={() =>
          dispatch(createConsignee(consigneeForm))
            .unwrap()
            .then((newC) => {
              setConsigneeData(newC);
              setConsigneeSearch(newC.name || "");
              setIsConsigneeModalOpen(false);
            })
        }
        loading={pickupLoading}
        error={reduxError}
        inputClass={inputClass}
      />

      <div>
        <h1 className="text-2xl font-bold">
          {isEditMode ? "Edit Order" : "New Order"}
        </h1>
        <p className="text-xs md:text-sm text-primary mt-1 font-medium">
          <Link to="/" className="hover:underline">
            Dashboard
          </Link>

          <span className="text-text-muted mx-2">&gt;&gt;</span>

          {isEditMode ? "Edit Order" : "New Order"}
        </p>
      </div>

      <div className="flex items-center gap-8 bg-card-bg/40 p-4 rounded-xl border border-border-subtle">
        <span className="text-sm font-medium text-text-main">Order Type *</span>
        <div className="flex items-center gap-6">
          {["B2C", "B2B", "International"].map((type) => (
            <label
              key={type}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="radio"
                className="sr-only"
                checked={orderType === type}
                onChange={() => setOrderType(type)}
              />
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                  orderType === type
                    ? "border-primary"
                    : "border-text-muted/30 group-hover:border-primary/50",
                )}
              >
                {orderType === type && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                )}
              </div>
              <span className="text-sm text-text-main">{type}</span>
            </label>
          ))}
        </div>
      </div>

      <Card className="bg-card-bg border-border-subtle overflow-visible relative">
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MapPinned size={20} className="text-primary" /> Pickup From
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPickupModalOpen(true)}
              className="text-primary hover:bg-primary/10"
            >
              <Plus size={16} className="mr-1" /> Add New
            </Button>
          </div>
          <div className="relative">
            {selectedAddress ? (
              <div className="flex items-center justify-between p-4 border border-primary/20 bg-primary/5 rounded-xl animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">
                      {selectedAddress.nickname}
                    </p>
                    <p className="text-xs text-text-muted">
                      {selectedAddress.address_line_1}, {selectedAddress.city} -{" "}
                      {selectedAddress.pincode}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setIsAddressDropdownOpen(!isAddressDropdownOpen)
                  }
                  className="text-primary hover:bg-primary/10"
                >
                  Change Address
                </Button>
              </div>
            ) : (
              <div
                onClick={() => setIsAddressDropdownOpen(!isAddressDropdownOpen)}
                className="w-full border-2 border-dashed border-border-subtle hover:border-primary/50 rounded-xl py-8 flex flex-col items-center justify-center cursor-pointer transition-all text-text-muted hover:text-primary group"
              >
                <MapPin
                  size={32}
                  className="mb-2 opacity-50 group-hover:scale-110 transition-transform"
                />
                <p className="text-sm font-medium">Select a pickup location</p>
              </div>
            )}
            <AnimatePresence>
              {isAddressDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute z-50 mt-2 w-full bg-card-bg border border-border-subtle rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto"
                >
                  {pickupAddresses?.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => {
                        dispatch(setSelectedAddress(addr));
                        setIsAddressDropdownOpen(false);
                      }}
                      className="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer rounded-lg border-b border-border-subtle/20 last:border-0"
                    >
                      <MapPin size={16} className="text-primary" />
                      <div>
                        <p className="text-sm font-bold">{addr.nickname}</p>
                        <p className="text-[11px] text-text-muted">
                          {addr.city}
                        </p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card-bg border-border-subtle overflow-visible">
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <User size={20} className="text-primary" /> Deliver To
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setConsigneeForm({
                  name: "",
                  mobile: "",
                  alternate_mobile: "",
                  email: "",
                  address_line_1: "",
                  address_line_2: "",
                  pincode: "",
                  city: "",
                  state: "",
                });
                setIsConsigneeModalOpen(true);
              }}
              className="text-primary hover:bg-primary/10"
            >
              <Plus size={16} className="mr-1" /> Add New
            </Button>
          </div>
          <div className="relative">
            {consigneeData.id ? (
              <div className="flex items-center justify-between p-4 border border-primary/20 bg-primary/5 rounded-xl animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">
                      {consigneeData.name}
                    </p>
                    <p className="text-xs text-text-muted">
                      {consigneeData.address_line_1}, {consigneeData.city} -{" "}
                      {consigneeData.pincode}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setIsConsigneeDropdownOpen(!isConsigneeDropdownOpen)
                  }
                  className="text-primary hover:bg-primary/10"
                >
                  Change Consignee
                </Button>
              </div>
            ) : (
              <div
                onClick={() => setIsConsigneeDropdownOpen(!isConsigneeDropdownOpen)}
                className="w-full border-2 border-dashed border-border-subtle hover:border-primary/50 rounded-xl py-8 flex flex-col items-center justify-center cursor-pointer transition-all text-text-muted hover:text-primary group"
              >
                <User
                  size={32}
                  className="mb-2 opacity-50 group-hover:scale-110 transition-transform"
                />
                <p className="text-sm font-medium">Select a consignee</p>
              </div>
            )}
            <AnimatePresence>
              {isConsigneeDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute z-50 mt-2 w-full bg-card-bg border border-border-subtle rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto"
                >
                  <div className="p-3 border-b border-border-subtle/20 bg-card-bg sticky top-0 z-10">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                      <input
                        type="text"
                        placeholder="Search consignee by Name / Email / Mobile"
                        value={consigneeSearch}
                        onChange={(e) => {
                          setConsigneeSearch(e.target.value);
                          dispatch(fetchConsignees({ search: e.target.value }));
                        }}
                        className="w-full bg-transparent border border-border-subtle rounded-lg pl-9 pr-4 py-1.5 text-xs text-text-main focus:outline-none focus:border-primary"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  {consignees?.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        selectConsignee(c);
                        setIsConsigneeDropdownOpen(false);
                      }}
                      className="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer rounded-lg border-b border-border-subtle/20 last:border-0"
                    >
                      <User size={16} className="text-primary" />
                      <div>
                        <p className="text-sm font-bold">{c.name}</p>
                        <p className="text-[11px] text-text-muted">
                          {c.city} ({c.mobile})
                        </p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card-bg border-border-subtle overflow-visible">
        <CardContent className="p-6 space-y-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CreditCard size={20} className="text-primary" /> Payment Method
          </h2>
          <div className="flex flex-wrap gap-8 items-end">
            <div className="flex items-center gap-6 bg-dashboard-bg/20 p-2 rounded-xl border border-border-subtle">
              {["Prepaid", "COD", "To Pay"].map((m) => (
                <label
                  key={m}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all",
                    paymentMethod === m
                      ? "bg-primary text-black"
                      : "hover:bg-white/5",
                  )}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    checked={paymentMethod === m}
                    onChange={() => setPaymentMethod(m)}
                  />
                  <span className="text-sm font-bold">{m}</span>
                </label>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {paymentMethod === "COD" && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-1 min-w-[200px]"
                >
                  <label className="text-[10px] uppercase font-bold text-text-muted ml-1">
                    COD Amount*
                  </label>
                  <input
                    type="number"
                    value={codAmount}
                    onChange={(e) => setCodAmount(e.target.value)}
                    className={inputClass}
                    placeholder="0.00"
                  />
                </motion.div>
              )}
              {paymentMethod === "To Pay" && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-1 min-w-[200px]"
                >
                  <label className="text-[10px] uppercase font-bold text-text-muted ml-1">
                    To Pay Amount*
                  </label>
                  <input
                    type="number"
                    value={toPayAmount}
                    onChange={(e) => setToPayAmount(e.target.value)}
                    className={inputClass}
                    placeholder="0.00"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card-bg border-border-subtle">
        <CardContent className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Product Details</h2>
            <div className="bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
              <span className="text-xs text-text-muted uppercase font-bold tracking-wider">
                Order Value: ₹
              </span>
              <span className="text-lg font-bold text-primary">
                {totalOrderValue.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="space-y-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end bg-dashboard-bg/20 p-4 rounded-xl border border-border-subtle shadow-sm"
              >
                <div className="md:col-span-1 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-text-muted ml-1">
                    Product*
                  </label>
                  <input
                    type="text"
                    value={p.product_name}
                    onChange={(e) =>
                      handleProductChange(p.id, "product_name", e.target.value)
                    }
                    className={inputClass}
                    placeholder="Name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-text-muted ml-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={p.sku}
                    onChange={(e) =>
                      handleProductChange(p.id, "sku", e.target.value)
                    }
                    className={inputClass}
                    placeholder="ID"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-text-muted ml-1">
                    Price*
                  </label>
                  <input
                    type="number"
                    value={p.unit_price}
                    onChange={(e) =>
                      handleProductChange(p.id, "unit_price", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-text-muted ml-1">
                    QTY*
                  </label>
                  <input
                    type="number"
                    value={p.qty}
                    onChange={(e) =>
                      handleProductChange(p.id, "qty", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-text-muted ml-1">
                    Total
                  </label>
                  <input
                    type="text"
                    value={p.total}
                    disabled
                    className="w-full bg-dashboard-bg border border-border-subtle rounded-lg px-4 py-2.5 text-sm"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() =>
                    setProducts(products.filter((i) => i.id !== p.id))
                  }
                  className="h-10 w-10 shrink-0"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setProducts([
                  ...products,
                  {
                    id: Date.now(),
                    product_name: "",
                    sku: "",
                    unit_price: "",
                    qty: 1,
                    total: 0,
                  },
                ])
              }
              className="border-primary text-primary hover:bg-primary/10 transition-colors"
            >
              <Plus size={16} className="mr-2" /> Add Item
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card-bg border-border-subtle">
        <CardContent className="p-6 space-y-6">
          <h2 className="text-lg font-semibold">Package Details</h2>
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="grid grid-cols-2 md:grid-cols-7 gap-4 items-end border-b border-border-subtle pb-6 last:border-0 last:pb-0"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted ml-1">
                  Count
                </label>
                <input
                  type="number"
                  value={pkg.count}
                  onChange={(e) =>
                    handlePackageChange(pkg.id, "count", e.target.value)
                  }
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted ml-1">
                  L (cm)*
                </label>
                <div className="flex">
                  <input
                    type="number"
                    value={pkg.length_cm}
                    onChange={(e) =>
                      handlePackageChange(pkg.id, "length_cm", e.target.value)
                    }
                    className="w-full border border-border-subtle rounded-l-lg px-3 py-2 text-sm"
                  />
                  <span className="bg-dashboard-bg border border-l-0 border-border-subtle rounded-r-lg px-2 text-[10px] flex items-center">
                    cm
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted ml-1">
                  B (cm)*
                </label>
                <div className="flex">
                  <input
                    type="number"
                    value={pkg.breadth_cm}
                    onChange={(e) =>
                      handlePackageChange(pkg.id, "breadth_cm", e.target.value)
                    }
                    className="w-full border border-border-subtle rounded-l-lg px-3 py-2 text-sm"
                  />
                  <span className="bg-dashboard-bg border border-l-0 border-border-subtle rounded-r-lg px-2 text-[10px] flex items-center">
                    cm
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted ml-1">
                  H (cm)*
                </label>
                <div className="flex">
                  <input
                    type="number"
                    value={pkg.height_cm}
                    onChange={(e) =>
                      handlePackageChange(pkg.id, "height_cm", e.target.value)
                    }
                    className="w-full border border-border-subtle rounded-l-lg px-3 py-2 text-sm"
                  />
                  <span className="bg-dashboard-bg border border-l-0 border-border-subtle rounded-r-lg px-2 text-[10px] flex items-center">
                    cm
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted ml-1">
                  Vol (kg)
                </label>
                <input
                  type="text"
                  value={pkg.vol_weight_kg}
                  disabled
                  className="w-full bg-dashboard-bg border border-border-subtle rounded-lg px-2 py-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted ml-1">
                  Phys (kg)*
                </label>
                <input
                  type="number"
                  value={pkg.physical_weight_kg}
                  onChange={(e) =>
                    handlePackageChange(
                      pkg.id,
                      "physical_weight_kg",
                      e.target.value,
                    )
                  }
                  className="w-full border border-border-subtle rounded-lg px-2 py-2 text-sm"
                />
              </div>
              <Button
                variant="destructive"
                size="icon"
                onClick={() =>
                  setPackages(packages.filter((i) => i.id !== pkg.id))
                }
                className="w-10 h-10 shrink-0"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
          <div className="flex flex-col md:flex-row justify-between items-center bg-green-500/10 border border-green-500/20 rounded-xl p-6 gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-10 h-10 bg-green-500 text-white rounded-lg flex items-center justify-center shrink-0">
                <Lock size={20} />
              </div>
              <div className="grid grid-cols-3 gap-6 flex-1">
                <div>
                  <p className="text-[10px] uppercase font-bold text-text-muted">
                    Applicable Weight
                  </p>
                  <p className="text-lg font-bold text-green-500">
                    {weightSummary.applicable} kg
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-text-muted">
                    Volumetric
                  </p>
                  <p className="text-xs font-bold text-text-main">
                    {weightSummary.totalVol} kg
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-text-muted">
                    Physical
                  </p>
                  <p className="text-xs font-bold text-text-main">
                    {weightSummary.totalPhys} kg
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPackages([
                  ...packages,
                  {
                    id: Date.now(),
                    count: 1,
                    length_cm: "",
                    breadth_cm: "",
                    height_cm: "",
                    vol_weight_kg: 0,
                    physical_weight_kg: "",
                  },
                ])
              }
              className="border-primary text-primary hover:bg-primary/10 transition-colors"
            >
              <Plus size={16} className="mr-2" /> Add Package
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card-bg border-border-subtle">
        <button
          onClick={() => setIsOtherDetailsOpen(!isOtherDetailsOpen)}
          className="w-full flex justify-between p-6 items-center hover:bg-white/5 transition-colors rounded-t-xl"
        >
          <h2 className="text-lg font-semibold">Other Details</h2>
          {isOtherDetailsOpen ? (
            <ChevronUp size={20} />
          ) : (
            <ChevronDown size={20} />
          )}
        </button>
        {isOtherDetailsOpen && (
          <CardContent className="p-6 pt-0 border-t border-border-subtle/20 animate-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-text-muted ml-1">
                  GST Number
                </label>
                <input
                  type="text"
                  value={otherDetails.gst_number}
                  onChange={(e) =>
                    setOtherDetails({
                      ...otherDetails,
                      gst_number: e.target.value,
                    })
                  }
                  className={inputClass}
                  placeholder="Enter GST Number"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-text-muted ml-1">
                  E-Way Bill Number
                </label>
                <input
                  type="text"
                  value={otherDetails.eway_bill_number}
                  onChange={(e) =>
                    setOtherDetails({
                      ...otherDetails,
                      eway_bill_number: e.target.value,
                    })
                  }
                  className={inputClass}
                  placeholder="Enter E-Way Bill Number"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card-bg/90 backdrop-blur-md border-t border-border-subtle flex justify-end z-30 shadow-2xl">
        <Button
          disabled={orderLoading}
          onClick={handleSubmit}
          className="bg-primary hover:bg-primary/90 text-black px-10 h-11 font-bold rounded-xl shadow-lg flex gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {orderLoading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <>
              <ShoppingBag size={18} />
              {isEditMode ? "Update Order" : "Complete Order"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
