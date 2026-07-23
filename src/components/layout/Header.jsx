import { useState, useRef, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    Menu, Bell, Moon, Sun, Plus, Zap, X, ShoppingBag, List,
    Calculator, FileText, History, Copy, Download, QrCode, ChevronDown, 
    Loader2, Package, Wallet, Truck, Printer
} from "lucide-react";
import { Button } from "../ui/button";
import { useTheme } from "../../contexts/ThemeContext";
import Logo from "../../assets/images/RO-2.png";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { fetchProfile } from "../../redux/profileSlice";
import { bulkUploadOrders, resetOrderState, refreshBulkOrders } from "../../redux/bulkOrderSlice";
import { fetchOrders, fetchOrderCounts } from "../../redux/orderSlice";
import { 
    fetchPickupAddressesApi, 
    getNotificationsWSUrl, 
    getTripSheetWSUrl, 
    fetchTripSheetDetailsApi 
} from "../../services/apiCalls";
import { generateTripSheetPrint } from "../../lib/PrintTripSheet";
import { toast } from "react-hot-toast";
import Cookies from "js-cookie";

import { addNotification, markNotificationAsRead, fetchNotifications } from "../../redux/notificationSlice";
import { usePermission } from "../../hooks/usePermission";
import notificationSound from "../../audio/mixkit-happy-bells-notification-937.wav";

const IMAGE_BASE_URL = "http://api.roadozcourier.com";
const NOTIFY_SOUND_URL = notificationSound;

export function Header({ toggleSidebar }) {
    const { theme, toggleTheme } = useTheme();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { orders: orderPerms, invoices: invoicePerms, wallet: walletPerms, remittances: remittancePerms } = usePermission();

    const { user } = useSelector((state) => state.profile);
    const role = useSelector((state) => state.auth.role);
    const { loading: uploadLoading, error: uploadError, success: uploadSuccess } = useSelector((state) => state.bulkOrders);
    const { items: notifications, unreadCount } = useSelector((state) => state.notifications);

    // UI States
    const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [activeNotifyTab, setActiveNotifyTab] = useState("Orders");
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);

    // Form States
    const [orderType, setOrderType] = useState("B2C");
    const [pickupAddressId, setPickupAddressId] = useState("");
    const [pickupAddresses, setPickupAddresses] = useState([]);
    const [addressLoading, setAddressLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const notificationRef = useRef(null);
    const audioPlayer = useRef(new Audio(NOTIFY_SOUND_URL));
    
    // --- FIX: Ref to track processed notification IDs to prevent repeat toasts ---
    const processedToastIds = useRef(new Set());

    const PLACEHOLDER_IMAGE = `https://ui-avatars.com/api/?name=${user?.name || "User"}&background=0D8ABC&color=fff`;

    const playNotificationSound = useCallback(() => {
        audioPlayer.current.play().catch(() => console.log("Audio blocked by browser"));
    }, []);

    useEffect(() => {
        dispatch(fetchProfile());
        dispatch(fetchNotifications({ limit: 50 })); 
    }, [dispatch]);

    // WebSocket Management
    useEffect(() => {
        let stdSocket = null;
        let tripSocket = null;
        let reconnectTimeout = null;

        const connect = () => {
            const token = Cookies.get("access_token");
            if (!token) return;

            const stdUrl = getNotificationsWSUrl().replace(/([^:]\/)\/+/g, "$1");
            const tripUrl = getTripSheetWSUrl().replace(/([^:]\/)\/+/g, "$1");

            stdSocket = new WebSocket(stdUrl);
            tripSocket = new WebSocket(tripUrl);

            stdSocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const notifId = data.id || data.order_id || Date.now().toString();

                    // Check if we have already shown a toast for this specific notification
                    if (!processedToastIds.current.has(notifId)) {
                        dispatch(addNotification(data));
                        playNotificationSound();
                        toast.success(data.message || "New Update", { icon: '📦' });
                        
                        processedToastIds.current.add(notifId);
                        // Clean up ref after 1 minute to prevent memory bloat
                        setTimeout(() => processedToastIds.current.delete(notifId), 60000);
                    }
                } catch (err) { console.error("WS Parsing Error:", err); }
            };

            tripSocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.event === "new_incoming_trip_sheet" || data.type === "trip_sheet") {
                        const tripId = data.trip_sheet_id || `ts-${Date.now()}`;

                        if (!processedToastIds.current.has(tripId)) {
                            const formatted = {
                                id: tripId,
                                type: "trip_sheet",
                                title: "Incoming Trip Sheet",
                                message: data.message || `New Trip Sheet Arrival`,
                                created_at: new Date().toISOString(),
                                is_read: false,
                                trip_sheet_id: data.trip_sheet_id
                            };
                            dispatch(addNotification(formatted));
                            playNotificationSound();
                            toast.success("New Trip Sheet Received", { icon: '🚛', duration: 6000 });
                            
                            processedToastIds.current.add(tripId);
                            setTimeout(() => processedToastIds.current.delete(tripId), 60000);
                        }
                    }
                } catch (err) { console.error("Trip WS Error:", err); }
            };

            const handleRetry = () => {
                clearTimeout(reconnectTimeout);
                reconnectTimeout = setTimeout(connect, 5000);
            };

            stdSocket.onclose = handleRetry;
            tripSocket.onclose = handleRetry;
        };

        connect();
        return () => {
            clearTimeout(reconnectTimeout);
            if (stdSocket) {
                stdSocket.onclose = null; // Prevent retry loop on unmount
                stdSocket.close();
            }
            if (tripSocket) {
                tripSocket.onclose = null;
                tripSocket.close();
            }
        };
    }, [dispatch, playNotificationSound]);

    const handleNotifyClick = async (notification) => {
        if (!notification.is_read) {
            dispatch(markNotificationAsRead(notification.id));
        }

        if (notification.type === "trip_sheet" || notification.trip_sheet_id) {
            const tripId = notification.trip_sheet_id;
            try {
                setIsPrinting(true);
                const data = await fetchTripSheetDetailsApi(tripId);
                generateTripSheetPrint(data);
                setIsNotificationsOpen(false);
            } catch (err) {
                toast.error("Failed to load Trip Sheet data");
            } finally {
                setIsPrinting(false);
            }
            return;
        }

        if (notification.type === "order" && notification.order_id) {
             navigate(`/dashboard/all-orders?search=${notification.order_id}`); 
             setIsNotificationsOpen(false);
        }
    };

    const filteredNotifications = notifications.filter(item => {
        const type = item.type?.toLowerCase();
        if (activeNotifyTab === "Orders") return type === "order" || type === "trip_sheet" || !type;
        if (activeNotifyTab === "Wallet") return type === "wallet";
        if (activeNotifyTab === "COD") return type === "cod";
        return true;
    });

    const getProfileImageUrl = () => {
        const img = user?.profile_image;
        if (!img || img.includes("/api/")) return PLACEHOLDER_IMAGE;
        if (img.startsWith("http")) return img;
        if (img.startsWith("/uploads")) return `${IMAGE_BASE_URL}${img}`;
        return PLACEHOLDER_IMAGE;
    };

    useEffect(() => {
        if (isImportModalOpen) {
            const loadAddresses = async () => {
                setAddressLoading(true);
                try {
                    const res = await fetchPickupAddressesApi();
                    const activeItems = (res.items || []).filter(item => item.active === true);
                    setPickupAddresses(activeItems);
                    if (activeItems.length > 0) setPickupAddressId(activeItems[0].id);
                } catch (error) { toast.error("Failed to load addresses"); }
                finally { setAddressLoading(false); }
            };
            loadAddresses();
        }
    }, [isImportModalOpen]);

    useEffect(() => {
        if (uploadSuccess) {
            toast.success("Bulk orders uploaded successfully!");
            setIsImportModalOpen(false);
            setSelectedFile(null);
            dispatch(resetOrderState());
            dispatch(refreshBulkOrders());
        }
        if (uploadError) {
            toast.error(uploadError);
            dispatch(resetOrderState());
        }
    }, [uploadSuccess, uploadError, dispatch]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
            setSelectedFile(file);
        } else {
            toast.error("Please select a valid Excel file");
        }
    };

    const handleImportSubmit = async () => {
        if (!selectedFile || !pickupAddressId) return toast.error("Please fill all fields");
        const formData = new FormData();
        formData.append("file", selectedFile); 
        formData.append("order_type", orderType);
        formData.append("pickup_address_id", pickupAddressId);
        dispatch(bulkUploadOrders(formData));
    };

    const quickActions = [
        orderPerms.create && { icon: <ShoppingBag className="text-primary" />, label: "Add an Order", path: "/dashboard/new-orders" },
        orderPerms.view && { icon: <List className="text-primary" />, label: "All Orders", path: "/dashboard/all-orders" },
        invoicePerms.generate && { icon: <FileText className="text-primary" />, label: "Create Invoice", path: "/dashboard/invoices" },
        remittancePerms.view && { icon: <History className="text-primary" />, label: "Remittance Logs", path: "/dashboard/cod-remittance" },
    ].filter(Boolean);

    useEffect(() => {
        function handleClickOutside(event) {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="sticky top-0 z-50 w-full">
            <header className="h-14 sm:h-16 bg-card-bg border-b border-border-subtle flex items-center justify-between px-2 sm:px-3 md:px-6">
                <div className="flex items-center gap-2 sm:gap-4">
                    <button onClick={toggleSidebar} className="p-1.5 sm:p-2 text-text-muted hover:text-text-main rounded-lg active:scale-95">
                        <Menu size={20} className="sm:w-6 sm:h-6" />
                    </button>
                    <img src={Logo} alt="Logo" className="h-6 sm:h-8 w-auto lg:hidden md:hidden" />
                </div>

                <div className="flex items-center gap-1 sm:gap-3 md:gap-4">
                    {orderPerms.create && (
                      <Button onClick={() => setIsImportModalOpen(true)} className="bg-primary text-black hover:bg-primary/90 h-7 sm:h-8 px-2 sm:px-3 text-xs font-bold">
                          <Plus size={12} className="sm:w-3.5 sm:h-3.5 mr-1" />
                          <span className="hidden sm:inline">Import</span>
                      </Button>
                    )}

                    {quickActions.length > 0 && (
                      <button onClick={() => setIsQuickActionsOpen(true)} className="w-7 h-7 sm:w-8 sm:h-8 bg-primary text-black rounded-full flex items-center justify-center hover:bg-primary/90 active:scale-90">
                          <Zap size={14} className="sm:w-4 sm:h-4" fill="currentColor" />
                      </button>
                    )}

                    {walletPerms.view && (
                    <div onClick={() => setIsWalletModalOpen(true)} className="flex items-center gap-1 bg-dashboard-bg px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-border-subtle cursor-pointer hover:border-primary/50 transition-all">
                        <span className="text-text-main font-bold text-xs">₹{user?.wallet_balance || "0"}</span>
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-primary rounded-full flex items-center justify-center text-black">
                            <Plus size={8} strokeWidth={4} />
                        </div>
                    </div>
                    )}

                    <div className="relative" ref={notificationRef}>
                        <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="text-text-muted hover:text-text-main p-1.5 sm:p-2 relative">
                            <Bell size={18} className="sm:w-5 sm:h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-card-bg">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>
                        <AnimatePresence>
                            {isNotificationsOpen && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="fixed sm:absolute right-0 left-0 sm:left-auto top-16 sm:top-full mx-4 sm:mx-0 mt-2 w-auto sm:w-80 bg-card-bg border border-border-subtle rounded-xl shadow-2xl overflow-hidden z-50">
                                    <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-dashboard-bg/30">
                                        <h3 className="font-bold text-text-main text-sm">Notifications</h3>
                                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{unreadCount} New</span>
                                    </div>
                                    <div className="flex border-b border-border-subtle bg-dashboard-bg/10">
                                        {["Orders", "Wallet", "COD"].map((tab) => (
                                            <button key={tab} onClick={() => setActiveNotifyTab(tab)} className={cn("flex-1 py-2.5 text-[11px] font-bold border-b-2 transition-all", activeNotifyTab === tab ? "text-primary border-primary" : "text-text-muted border-transparent")}>
                                                {tab}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="max-h-[350px] overflow-y-auto bg-card-bg scrollbar-thin">
                                        {filteredNotifications.length > 0 ? (
                                            filteredNotifications.map((item) => (
                                                <div 
                                                    key={item.id} 
                                                    onClick={() => !isPrinting && handleNotifyClick(item)}
                                                    className={cn(
                                                        "p-4 border-b border-border-subtle flex gap-3 cursor-pointer transition-colors hover:bg-dashboard-bg/30 relative",
                                                        !item.is_read ? "bg-primary/5" : "opacity-70"
                                                    )}
                                                >
                                                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0", 
                                                        item.type === 'trip_sheet' ? "bg-blue-500/10 text-blue-500" : "bg-primary/10 text-primary")}>
                                                        {item.type === 'trip_sheet' ? <Truck size={18} /> : <Package size={18} />}
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <div className="flex justify-between items-center">
                                                            <p className="text-xs font-bold text-text-main truncate">{item.title}</p>
                                                            {(item.type === 'trip_sheet' || item.trip_sheet_id) && <Printer size={12} className="text-blue-500" />}
                                                        </div>
                                                        <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed">{item.message}</p>
                                                        {(item.type === 'trip_sheet' || item.trip_sheet_id) && <span className="text-[8px] text-blue-600 font-bold uppercase mt-1">Click to Print Trip Sheet</span>}
                                                        <p className="text-[9px] text-text-muted mt-1 uppercase font-medium">
                                                            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                    {isPrinting && (item.type === 'trip_sheet' || item.trip_sheet_id) && (
                                                        <div className="absolute inset-0 bg-dashboard-bg/40 flex items-center justify-center z-10 backdrop-blur-[1px]">
                                                            <Loader2 size={16} className="animate-spin text-blue-500" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-10 text-center">
                                                <p className="text-text-muted text-xs italic">No {activeNotifyTab} notifications</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button onClick={toggleTheme} className="text-text-muted hover:text-text-main p-1.5 sm:p-2 transition-colors">
                        {theme === "dark" ? <Sun size={18} className="sm:w-5 sm:h-5" /> : <Moon size={18} className="sm:w-5 sm:h-5" />}
                    </button>

                    <Link to="/profile" className="flex-shrink-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-4 border-l border-border-subtle cursor-pointer hover:bg-primary/5 px-1 md:px-2 py-1 rounded-lg transition">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20">
                                <img src={getProfileImageUrl()} alt="User Avatar" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }} />
                            </div>
                            <div className="flex flex-col items-start leading-none hidden md:flex">
                                <span className="text-xs md:text-[13px] font-bold text-text-main capitalize">{user?.name || "Admin"}</span>
                                <span className="text-[10px] text-text-muted mt-0.5 uppercase tracking-tighter">{(user?.role || role)?.replace("_", " ")}</span>
                            </div>
                            <ChevronDown size={14} className="text-text-muted hidden md:block ml-1" />
                        </div>
                    </Link>
                </div>
            </header>

            {/* Modals are kept as per your original logic */}
            <AnimatePresence>
                {isImportModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card-bg border border-border-subtle rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
                            <div className="p-5 md:p-6 border-b border-border-subtle flex justify-between items-center bg-dashboard-bg/20">
                                <h2 className="text-lg md:text-xl font-bold text-text-main">Bulk Order Upload</h2>
                                <button onClick={() => setIsImportModalOpen(false)} className="p-2 text-text-muted hover:text-primary transition-colors"><X size={24} /></button>
                            </div>
                            <div className="p-6 md:p-8 space-y-5 md:space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-text-muted uppercase">Order Type *</label>
                                        <select className="w-full bg-dashboard-bg border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-main focus:border-primary outline-none" value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                                            <option value="B2C">B2C</option><option value="B2B">B2B</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-text-muted uppercase">Pickup Address *</label>
                                        <select disabled={addressLoading} className="w-full bg-dashboard-bg border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-main focus:border-primary outline-none" value={pickupAddressId} onChange={(e) => setPickupAddressId(e.target.value)}>
                                            {pickupAddresses.map((addr) => (<option key={addr.id} value={addr.id}>{addr.nickname} - {addr.city}</option>))}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-text-muted uppercase">Upload Excel File *</label>
                                    <div className="flex flex-col sm:flex-row border border-border-subtle rounded-xl overflow-hidden bg-dashboard-bg">
                                        <label htmlFor="bulk-file-input" className="bg-primary/10 border-b sm:border-b-0 sm:border-r border-border-subtle px-6 py-3 text-xs font-bold text-primary cursor-pointer hover:bg-primary/20 text-center">
                                            Choose File 
                                            <input id="bulk-file-input" type="file" className="hidden" onChange={handleFileChange} accept=".xlsx, .xls" />
                                        </label>
                                        <span className="px-4 py-3 text-sm text-text-muted italic truncate">{selectedFile ? selectedFile.name : "No file chosen (.xlsx only)"}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-border-subtle bg-dashboard-bg/50 flex justify-end gap-3">
                                <Button disabled={uploadLoading || addressLoading} onClick={handleImportSubmit} className="bg-primary text-black px-10 h-10 font-bold shadow-lg min-w-[120px]">
                                    {uploadLoading ? <Loader2 className="animate-spin" size={20} /> : "Import Orders"}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isWalletModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card-bg border border-border-subtle rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                            <div className="p-5 md:p-6 border-b border-border-subtle flex justify-between items-center bg-dashboard-bg/20">
                                <h2 className="text-lg font-bold text-text-main">Recharge Wallet</h2>
                                <button onClick={() => setIsWalletModalOpen(false)} className="p-2 text-text-muted hover:text-primary transition-colors"><X size={24} /></button>
                            </div>
                            <div className="p-8 text-center space-y-6">
                                <div className="w-24 h-24 bg-dashboard-bg border border-border-subtle rounded-xl mx-auto flex items-center justify-center text-text-muted"><QrCode size={40} className="opacity-20" /></div>
                                <div className="space-y-4">
                                    <p className="text-xs text-text-muted">Pay to UPI: <span className="font-bold text-text-main">roadoz@upi</span></p>
                                    <div className="text-left space-y-1.5">
                                        <label className="text-[10px] font-bold text-text-muted uppercase">Amount (₹) *</label>
                                        <input type="number" placeholder="Enter Amount" className="w-full bg-dashboard-bg border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-main focus:border-primary outline-none" />
                                    </div>
                                </div>
                                <Button className="w-full bg-primary text-black h-12 font-bold shadow-lg">Submit Request</Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isQuickActionsOpen && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[110] p-4 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card-bg border border-border-subtle rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl">
                            <div className="p-8 md:p-12">
                                <div className="flex justify-between items-center mb-10">
                                    <h2 className="text-2xl font-bold text-text-main">Quick Actions</h2>
                                    <button onClick={() => setIsQuickActionsOpen(false)} className="p-2 bg-dashboard-bg rounded-xl text-text-muted hover:text-primary transition-colors"><X size={24} /></button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                    {quickActions.map((action, i) => (
                                        <button
                                          key={i}
                                          onClick={() => { navigate(action.path); setIsQuickActionsOpen(false); }}
                                          className="flex flex-col items-center gap-4 p-6 rounded-2xl hover:bg-primary/10 transition-all group border border-transparent hover:border-primary/20"
                                        >
                                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform text-primary">{action.icon}</div>
                                            <span className="text-xs font-bold text-text-main text-center leading-tight">{action.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}