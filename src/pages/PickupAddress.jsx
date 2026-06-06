import React, { useEffect, useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Plus,
  X,
  MapPin,
  RotateCcw,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import Pagination from "../components/ui/Pagination";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  fetchPickupAddresses,
  createPickupAddress,
  updatePickupAddress,
  deletePickupAddress,
} from "../redux/orderSlice";
import { usePermission } from "../hooks/usePermission";

export function PickupAddress() {
  const { pickupAddresses: pickupPerms } = usePermission();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const dispatch = useDispatch();

  const { pickupAddresses, loading } = useSelector((state) => state.orders);

  const addresses = pickupAddresses || [];

  const [formData, setFormData] = useState({
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
    active: true,
    is_primary: false,
  });

  const [errors, setErrors] = useState({});
  const [filters, setFilters] = useState({
    contact_name: "",
    address: "",
    city: "",
    pincode: "",
  });

  const [filteredAddresses, setFilteredAddresses] = useState([]);

  useEffect(() => {
    dispatch(
      fetchPickupAddresses({
        page: 1,
        limit: 10,
      }),
    );
  }, [dispatch]);

  useEffect(() => {
    setFilteredAddresses(addresses);
  }, [addresses]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Nickname
    if (!formData.nickname.trim()) {
      newErrors.nickname = "Nickname is required";
    } else if (formData.nickname.trim().length < 3) {
      newErrors.nickname = "Minimum 3 characters required";
    }

    // Contact Name
    if (!formData.contact_name.trim()) {
      newErrors.contact_name = "Contact name is required";
    } else if (!/^[A-Za-z\s]+$/.test(formData.contact_name)) {
      newErrors.contact_name = "Only letters allowed";
    }

    // Phone
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = "Enter valid 10-digit mobile number";
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Enter valid email address";
    }

    // Address Line 1
    if (!formData.address_line_1.trim()) {
      newErrors.address_line_1 = "Address Line 1 is required";
    } else if (formData.address_line_1.trim().length < 5) {
      newErrors.address_line_1 = "Minimum 5 characters required";
    }

    // Address Line 2
    if (!formData.address_line_2.trim()) {
      newErrors.address_line_2 = "Address Line 2 is required";
    } else if (formData.address_line_2.trim().length < 3) {
      newErrors.address_line_2 = "Minimum 3 characters required";
    }

    // Pincode
    if (!formData.pincode.trim()) {
      newErrors.pincode = "Pincode is required";
    } else if (!/^\d+$/.test(formData.pincode)) {
      newErrors.pincode = "Only numbers allowed";
    } else if (formData.pincode.length !== 6) {
      newErrors.pincode = "Pincode must be 6 digits";
    }

    // City
    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    } else if (!/^[A-Za-z\s]+$/.test(formData.city)) {
      newErrors.city = "Only letters allowed";
    }

    // State
    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    } else if (!/^[A-Za-z\s]+$/.test(formData.state)) {
      newErrors.state = "Only letters allowed";
    }

    // Country
    if (!formData.country.trim()) {
      newErrors.country = "Country is required";
    } else if (!/^[A-Za-z\s]+$/.test(formData.country)) {
      newErrors.country = "Only letters allowed";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleFilter = () => {
    const filtered = addresses.filter((addr) => {
      const contactMatch = filters.contact_name
        ? addr.contact_name
            ?.toLowerCase()
            .includes(filters.contact_name.toLowerCase())
        : true;

      const addressMatch = filters.address
        ? `${addr.address_line_1 || ""} ${addr.address_line_2 || ""}`
            .toLowerCase()
            .includes(filters.address.toLowerCase())
        : true;

      const cityMatch = filters.city
        ? addr.city?.toLowerCase().includes(filters.city.toLowerCase())
        : true;

      const pincodeMatch = filters.pincode
        ? addr.pincode?.toString().includes(filters.pincode)
        : true;

      return contactMatch && addressMatch && cityMatch && pincodeMatch;
    });

    setFilteredAddresses(filtered);
  };

  const clearFilters = () => {
    setFilters({
      contact_name: "",
      address: "",
      city: "",
      pincode: "",
    });

    setFilteredAddresses(addresses);
  };

  const exportToCSV = () => {
    if (filteredAddresses.length === 0) return;

    const headers = [
      [
        "Nickname",
        "Contact Name",
        "Phone",
        "Email",
        "Address",
        "City",
        "State",
        "Pincode",
        "Country",
        "Status",
        "Primary",
      ].join(","),
    ];

    const rows = filteredAddresses.map((addr) =>
      [
        addr.nickname,
        addr.contact_name,
        addr.phone,
        addr.email,
        `"${addr.address_line_1} ${addr.address_line_2 || ""}"`,
        addr.city,
        addr.state,
        addr.pincode,
        addr.country,
        addr.active ? "Active" : "Inactive",
        addr.is_primary ? "Yes" : "No",
      ].join(","),
    );

    const csvContent =
      "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");

    const encodedUri = encodeURI(csvContent);

    const link = document.createElement("a");

    link.setAttribute("href", encodedUri);

    link.setAttribute(
      "download",
      `pickup_addresses_${new Date().toISOString().split("T")[0]}.csv`,
    );

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editingAddress) {
        await dispatch(
          updatePickupAddress({
            id: editingAddress.id,
            data: formData,
          }),
        ).unwrap();

        toast.success("Pickup address updated successfully");
      } else {
        await dispatch(createPickupAddress(formData)).unwrap();

        toast.success("Pickup address added successfully");
      }

      dispatch(
        fetchPickupAddresses({
          page: 1,
          limit: 10,
        }),
      );

      setIsModalOpen(false);

      setEditingAddress(null);

      setFormData({
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
        active: true,
        is_primary: false,
      });

      setErrors({});
    } catch (error) {
      console.log(error);

      toast.error(error?.message || "Something went wrong");
    }
  };

  const toggleStatus = async (addr) => {
    try {
      await dispatch(
        updatePickupAddress({
          id: addr.id,
          data: {
            ...addr,
            active: !addr.active,
          },
        }),
      ).unwrap();

      dispatch(fetchPickupAddresses({ page: 1, limit: 10 }));
    } catch (error) {
      console.log(error);
      toast.error("Failed to update status");
    }
  };

  const togglePrimary = async (addr) => {
    try {
      await dispatch(
        updatePickupAddress({
          id: addr.id,
          data: {
            ...addr,
            is_primary: !addr.is_primary,
          },
        }),
      ).unwrap();

      dispatch(fetchPickupAddresses({ page: 1, limit: 10 }));
    } catch (error) {
      console.log(error);
      toast.error("Failed to update primary");
    }
  };

  const handleEdit = (addr) => {
    setEditingAddress(addr);

    setFormData({
      nickname: addr.nickname || "",
      contact_name: addr.contact_name || "",
      phone: addr.phone || "",
      email: addr.email || "",
      address_line_1: addr.address_line_1 || "",
      address_line_2: addr.address_line_2 || "",
      pincode: addr.pincode || "",
      city: addr.city || "",
      state: addr.state || "",
      country: addr.country || "India",
      active: addr.active || false,
      is_primary: addr.is_primary || false,
    });

    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deletePickupAddress(id)).unwrap();

      toast.success("Pickup address deleted");

      dispatch(fetchPickupAddresses({ page: 1, limit: 10 }));
    } catch (error) {
      console.log(error);
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Pickup Address</h1>
          <p className="text-sm text-primary mt-1 font-medium">
            <Link to="/" className="hover:underline cursor-pointer">
              Dashboard
            </Link>
            <span className="text-text-muted mx-1">&gt;&gt;</span> Pickup
            Address
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={exportToCSV}
            className="flex-1 sm:flex-none border-border-subtle h-10 text-text-main text-xs"
          >
            <Download size={16} className="mr-2" />
            Export CSV
          </Button>

          {pickupPerms.create && (
            <Button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-black font-bold h-10 px-4 rounded-xl shadow-lg transition-all text-xs"
            >
              <Plus size={18} className="mr-2" />
              New Pickup Address
            </Button>
          )}
        </div>
      </div>

      <Card className="bg-card-bg border-border-subtle shadow-sm rounded-2xl">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-text-muted ml-1">
                Contact Name
              </label>

              <input
                type="text"
                placeholder="Search contact..."
                value={filters.contact_name}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    contact_name: e.target.value,
                  }))
                }
                className="bg-transparent border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-primary transition-all w-full"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-text-muted ml-1">
                Address
              </label>

              <input
                type="text"
                placeholder="Search address..."
                value={filters.address}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
                className="bg-transparent border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-primary transition-all w-full"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-text-muted ml-1">
                City
              </label>

              <input
                type="text"
                placeholder="Search city..."
                value={filters.city}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    city: e.target.value,
                  }))
                }
                className="bg-transparent border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-primary transition-all w-full"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-text-muted ml-1">
                Pincode
              </label>

              <input
                type="text"
                placeholder="Search pincode..."
                value={filters.pincode}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    pincode: e.target.value,
                  }))
                }
                className="bg-transparent border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-primary transition-all w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleFilter}
                className="flex-1 bg-primary hover:bg-primary/90 text-black h-9 text-xs"
              >
                <Filter size={14} className="mr-2" />
                Filter
              </Button>

              <Button
                variant="ghost"
                onClick={clearFilters}
                className="h-9 px-3 text-text-muted border border-border-subtle"
              >
                <RotateCcw size={16} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card-bg border-border-subtle shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dashboard-bg/50 border-b border-border-subtle">
                  <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                    Pincode
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                    Primary
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                    Warehouse
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider text-center">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredAddresses?.map((addr) => (
                  <tr
                    key={addr.id}
                    className="hover:bg-dashboard-bg/30 transition-colors"
                  >
                    <td className="px-6 py-6 text-sm text-text-main font-bold">
                      {addr.id?.slice(0, 8)}
                    </td>

                    <td className="px-6 py-6 text-xs text-text-main whitespace-pre-line leading-relaxed">
                      <div className="font-semibold">{addr.nickname}</div>

                      <div className="mt-1">
                        {addr.contact_name}
                        {"\n"}
                        {addr.phone}
                        {"\n"}
                        {addr.email}
                      </div>
                    </td>

                    <td className="px-6 py-6 text-xs text-text-main font-medium">
                      {addr.pincode}, {addr.city}, {addr.state}
                    </td>

                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleStatus(addr)}
                          className={cn(
                            "relative inline-flex h-5 w-10 items-center rounded-full transition-colors",
                            addr.active
                              ? "bg-green-500"
                              : "bg-dashboard-bg border border-border-subtle",
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform",
                              addr.active ? "translate-x-5.5" : "translate-x-1",
                            )}
                          />
                        </button>

                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase",
                            addr.active ? "text-green-500" : "text-text-muted",
                          )}
                        >
                          {addr.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-6">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={addr.is_primary}
                            onChange={() => togglePrimary(addr)}
                            className="sr-only"
                          />

                          <div
                            className={cn(
                              "w-5 h-5 rounded-full border-2 transition-all",
                              addr.is_primary
                                ? "border-primary bg-primary/10"
                                : "border-border-subtle",
                            )}
                          />

                          {addr.is_primary && (
                            <div className="absolute w-2.5 h-2.5 rounded-full bg-primary" />
                          )}
                        </div>

                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase",
                            addr.is_primary
                              ? "text-primary"
                              : "text-text-muted",
                          )}
                        >
                          {addr.is_primary ? "Default" : "Primary"}
                        </span>
                      </label>
                    </td>

                    <td className="px-6 py-6 text-xs text-text-main">
                      {addr.warehouse || "-"}
                    </td>

                    <td className="px-6 py-6 text-xs text-text-muted max-w-xs leading-relaxed">
                      <div>{addr.address_line_1}</div>

                      {addr.address_line_2 && <div>{addr.address_line_2}</div>}

                      <div className="mt-1 text-[10px] text-text-main">
                        {addr.city}, {addr.state} - {addr.pincode}
                      </div>
                    </td>

                    <td className="px-6 py-6">
                      {pickupPerms.create && (
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => handleEdit(addr)}
                            className="w-8 h-8 flex items-center justify-center text-primary bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary hover:text-black transition-all duration-200"
                          >
                            <Edit size={14} />
                          </button>

                          <button
                            onClick={() => handleDelete(addr.id)}
                            className="w-8 h-8 flex items-center justify-center text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition-all duration-200"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {!loading && filteredAddresses?.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-10 text-text-muted text-sm"
                    >
                      No pickup addresses found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination />
        </CardContent>
      </Card>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-card-bg rounded-xl shadow-2xl overflow-hidden border border-border-subtle"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-dashboard-bg/20">
                <div className="flex items-center gap-2">
                  <MapPin className="text-primary" size={20} />

                  <h3 className="text-lg font-bold text-text-main">
                    {editingAddress
                      ? "Edit Pickup Address"
                      : "Add Pickup Address"}
                  </h3>
                </div>

                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingAddress(null);
                  }}
                  className="text-text-muted hover:text-text-main transition-colors p-1"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 max-h-[75vh] overflow-y-auto custom-scrollbar bg-card-bg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {[
                    {
                      label: "Address Nickname*",
                      placeholder: "e.g. Warehouse 1",
                      name: "nickname",
                      value: formData.nickname,
                    },
                    {
                      label: "Contact Name*",
                      placeholder: "Contact Person",
                      name: "contact_name",
                      value: formData.contact_name,
                    },
                    {
                      label: "Phone Number*",
                      placeholder: "10-digit Mobile No",
                      name: "phone",
                      value: formData.phone,
                    },
                    {
                      label: "Email Address*",
                      placeholder: "Contact Email",
                      name: "email",
                      value: formData.email,
                    },
                    {
                      label: "Address Line 1*",
                      placeholder: "Street, House No",
                      name: "address_line_1",
                      value: formData.address_line_1,
                    },
                    {
                      label: "Address Line 2*",
                      placeholder: "Area, Landmark",
                      name: "address_line_2",
                      value: formData.address_line_2,
                    },
                  ].map((field, i) => (
                    <div key={i} className="space-y-1.5">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                        {field.label}
                      </label>

                      <input
                        type="text"
                        name={field.name}
                        value={field.value}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        className={cn(
                          "w-full bg-dashboard-bg border rounded-md px-4 py-2.5 text-sm text-text-main placeholder:text-text-muted focus:outline-none transition-colors",
                          errors[field.name]
                            ? "border-red-500 focus:border-red-500"
                            : "border-border-subtle focus:border-primary",
                        )}
                      />

                      {errors[field.name] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors[field.name]}
                        </p>
                      )}
                    </div>
                  ))}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                        Pincode*
                      </label>

                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        placeholder="6-digit"
                        className={cn(
                          "w-full bg-dashboard-bg border rounded-md px-4 py-2.5 text-sm text-text-main focus:outline-none",
                          errors.pincode
                            ? "border-red-500 focus:border-red-500"
                            : "border-border-subtle focus:border-primary",
                        )}
                      />

                      {errors.pincode && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.pincode}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                        City*
                      </label>

                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="City"
                        className={cn(
                          "w-full bg-dashboard-bg border rounded-md px-4 py-2.5 text-sm text-text-main focus:outline-none",
                          errors.city
                            ? "border-red-500 focus:border-red-500"
                            : "border-border-subtle focus:border-primary",
                        )}
                      />

                      {errors.city && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.city}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                        State*
                      </label>

                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="State"
                        className={cn(
                          "w-full bg-dashboard-bg border rounded-md px-4 py-2.5 text-sm text-text-main focus:outline-none",
                          errors.state
                            ? "border-red-500 focus:border-red-500"
                            : "border-border-subtle focus:border-primary",
                        )}
                      />

                      {errors.state && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.state}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                        Country*
                      </label>

                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className={cn(
                          "w-full bg-dashboard-bg border rounded-md px-4 py-2.5 text-sm text-text-main focus:outline-none",
                          errors.country
                            ? "border-red-500 focus:border-red-500"
                            : "border-border-subtle focus:border-primary",
                        )}
                      />

                      {errors.country && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.country}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border-subtle flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="set_primary"
                    name="is_primary"
                    checked={formData.is_primary}
                    onChange={handleChange}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />

                  <label
                    htmlFor="set_primary"
                    className="text-sm font-bold text-text-main cursor-pointer"
                  >
                    Set as Primary Pickup Address
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-border-subtle bg-dashboard-bg/50">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-sm font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <RotateCcw size={14} />
                  Cancel
                </button>

                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 text-black h-11 px-12 font-bold rounded-md shadow-lg active:scale-95 transition-all"
                >
                  {loading ? "Saving..." : "Save Address"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
