import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    Menu, Bell, Search, Moon, Sun, Plus, Zap, X, ShoppingBag, List,
    Calculator, FileText, History, Copy, Download, QrCode, ChevronDown, User, Loader2, Package, Wallet
} from "lucide-react";
import { Button } from "../ui/button";
import { useTheme } from "../../contexts/ThemeContext";
import Logo from "../../assets/images/Roadoz Golden hd.png";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { fetchProfile } from "../../redux/profileSlice";
import { bulkUploadOrders, resetOrderState, refreshBulkOrders } from "../../redux/bulkOrderSlice";
import { fetchOrders, fetchOrderCounts } from "../../redux/orderSlice";
import { fetchPickupAddressesApi, getNotificationsWSUrl } from "../../services/apiCalls";
import { toast } from "react-hot-toast";
import Cookies from "js-cookie";

import { addNotification, markNotificationAsRead, fetchNotifications } from "../../redux/notificationSlice";

const IMAGE_BASE_URL = "http://api.roadozcourier.com";

export function Header({ toggleSidebar }) {
    const { theme, toggleTheme } = useTheme();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { user } = useSelector((state) => state.profile);
    const role = useSelector((state) => state.auth.role);
    const { loading: uploadLoading, error: uploadError, success: uploadSuccess } = useSelector((state) => state.bulkOrders);
    const { items: notifications, unreadCount } = useSelector((state) => state.notifications);

    // Component State
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [activeNotifyTab, setActiveNotifyTab] = useState("Orders");
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

    const [orderType, setOrderType] = useState("B2C");
    const [pickupAddressId, setPickupAddressId] = useState("");
    const [pickupAddresses, setPickupAddresses] = useState([]);
    const [addressLoading, setAddressLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const notificationRef = useRef(null);

    useEffect(() => {
        dispatch(fetchProfile());
        dispatch(fetchNotifications({ limit: 50 })); 
    }, [dispatch]);

    useEffect(() => {
        const wsUrl = getNotificationsWSUrl();
        const socket = new WebSocket(wsUrl);

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                dispatch(addNotification(data));
                toast.success(data.message, { icon: '📦' });
            } catch (err) {
                console.error("WS Parsing Error:", err);
            }
        };

        socket.onclose = () => console.log("Notification Socket Closed");
        socket.onerror = (err) => console.error("WS Socket Error", err);

        return () => socket.close();
    }, [dispatch]);

    const handleNotifyClick = (notification) => {
        if (!notification.is_read) {
            dispatch(markNotificationAsRead(notification.id));
        }

        if (notification.type === "order" && notification.order_id) {
            // navigate(`/orders/${notification.order_id}`); 
            // setIsNotificationsOpen(false);
        }
    };

    const filteredNotifications = notifications.filter(item => {
        const type = item.type?.toLowerCase();
        if (activeNotifyTab === "Orders") return type === "order" || !type;
        if (activeNotifyTab === "Wallet") return type === "wallet";
        if (activeNotifyTab === "COD") return type === "cod";
        return true;
    });

    useEffect(() => {
        if (isImportModalOpen) {
            const loadAddresses = async () => {
                setAddressLoading(true);
                try {
                    const res = await fetchPickupAddressesApi();
                    const activeItems = (res.items || []).filter(item => item.active === true);
                    setPickupAddresses(activeItems);
                    if (activeItems.length > 0) {
                        const primary = activeItems.find(a => a.is_primary) || activeItems[0];
                        setPickupAddressId(primary.id);
                    }
                } catch (error) {
                    toast.error("Failed to load pickup addresses");
                } finally {
                    setAddressLoading(false);
                }
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
            dispatch(fetchOrders({ page: 1, limit: 25 }));
            dispatch(fetchOrderCounts());
            dispatch(refreshBulkOrders());
        }
        if (uploadError) {
            toast.error(uploadError);
            dispatch(resetOrderState());
        }
    }, [uploadSuccess, uploadError, dispatch]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const PLACEHOLDER_IMAGE = `https://ui-avatars.com/api/?name=${user?.name || "User"}&background=0D8ABC&color=fff`;

    const getProfileImageUrl = () => {
        const img = user?.profile_image;
        if (!img || img.includes("/api/")) return PLACEHOLDER_IMAGE;
        if (img.startsWith("http")) return img;
        if (img.startsWith("/uploads")) return `${IMAGE_BASE_URL}${img}`;
        return PLACEHOLDER_IMAGE;
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const extension = file.name.split('.').pop().toLowerCase();
            if (extension !== 'xlsx' && extension !== 'xls') {
                toast.error("Please select a valid Excel file (.xlsx or .xls)");
                e.target.value = null;
                setSelectedFile(null);
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleImportSubmit = async () => {
        if (!selectedFile) return toast.error("Please select an Excel file first");
        if (!pickupAddressId) return toast.error("Please select a pickup address");
        const formData = new FormData();
        formData.append("file", selectedFile); 
        formData.append("order_type", orderType);
        formData.append("pickup_address_id", pickupAddressId);
        dispatch(bulkUploadOrders(formData));
    };

    const quickActions = [
        { icon: <ShoppingBag className="text-primary" />, label: "Add an Order" },
        { icon: <List className="text-primary" />, label: "All Orders" },
        { icon: <Calculator className="text-primary" />, label: "Rate Calculator" },
        { icon: <FileText className="text-primary" />, label: "Create Invoice" },
        { icon: <History className="text-primary" />, label: "Remittance Transaction Log" },
    ];

    return (
        <div className="sticky top-0 z-50 w-full">
            <header className="h-16 bg-card-bg border-b border-border-subtle flex items-center justify-between px-3 md:px-6 transition-colors duration-300">
                <div className="flex items-center gap-2 md:gap-4">
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleSidebar(); }}
                        className="p-2 text-text-muted hover:text-text-main hover:bg-dashboard-bg rounded-lg transition-colors active:scale-95"
                    >
                        <Menu size={24} />
                    </button>
                    <img src={Logo} alt="Logo" className="h-8 w-auto lg:hidden block md:hidden" />
                </div>

                <div className="flex items-center gap-1.5 md:gap-3">
                    <Button
                        onClick={() => setIsImportModalOpen(true)}
                        className="bg-primary text-black hover:bg-primary/90 h-9 px-3 flex items-center gap-1 text-xs sm:text-sm"
                    >
                        <Plus size={16} />
                        <span className="hidden sm:inline">Import</span>
                    </Button>

                    <button onClick={() => setIsQuickActionsOpen(true)} className="w-9 h-9 md:w-10 md:h-10 bg-primary text-black rounded-full flex items-center justify-center hover:bg-primary/90 transition-all shadow-sm active:scale-90">
                        <Zap size={18} fill="currentColor" />
                    </button>

                    <div onClick={() => setIsWalletModalOpen(true)} className="flex items-center gap-1 bg-dashboard-bg px-2 md:px-3 py-1.5 rounded-full border border-border-subtle cursor-pointer hover:border-primary/50 transition-all">
                        <span className="text-text-main font-bold text-xs md:text-sm">₹ {user?.wallet_balance || "689"}</span>
                        <div className="w-4 h-4 md:w-5 md:h-5 bg-primary rounded-full flex items-center justify-center text-black ml-0.5">
                            <Plus size={10} strokeWidth={4} />
                        </div>
                    </div>

                    <div className="relative" ref={notificationRef}>
                        <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="text-text-muted hover:text-text-main p-2 relative group">
                            <Bell size={20} className={unreadCount > 0 ? "animate-shake" : "group-hover:animate-shake"} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-card-bg">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>
                        <AnimatePresence>
                            {isNotificationsOpen && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="fixed sm:absolute right-0 left-0 sm:left-auto top-16 sm:top-full mx-4 sm:mx-0 mt-2 w-auto sm:w-80 bg-card-bg border border-border-subtle rounded-xl shadow-2xl overflow-hidden z-50">
                                    <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-dashboard-bg/30">
                                        <h3 className="font-bold text-text-main text-sm">Notifications</h3>
                                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{unreadCount} Unread</span>
                                    </div>
                                    <div className="flex border-b border-border-subtle bg-dashboard-bg/10">
                                        {["Orders", "Wallet", "COD"].map((tab) => (
                                            <button 
                                                key={tab} 
                                                onClick={() => setActiveNotifyTab(tab)} 
                                                className={cn("flex-1 py-2.5 text-[11px] font-bold transition-all border-b-2", activeNotifyTab === tab ? "text-primary border-primary" : "text-text-muted border-transparent")}
                                            >
                                                {tab}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="max-h-[350px] overflow-y-auto bg-card-bg scrollbar-thin">
                                        {filteredNotifications.length > 0 ? (
                                            filteredNotifications.map((item) => (
                                                <div 
                                                    key={item.id} 
                                                    onClick={() => handleNotifyClick(item)}
                                                    className={cn(
                                                        "p-4 border-b border-border-subtle flex gap-3 cursor-pointer transition-colors hover:bg-dashboard-bg/30",
                                                        !item.is_read ? "bg-primary/5" : "opacity-70"
                                                    )}
                                                >
                                                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", 
                                                        !item.is_read ? "bg-primary/20 text-primary" : "bg-dashboard-bg text-text-muted")}>
                                                        {item.type === 'wallet' ? <Wallet size={16} /> : <Package size={16} />}
                                                    </div>
                                                    <div className="flex flex-col gap-0.5 overflow-hidden">
                                                        <p className="text-xs font-bold text-text-main truncate">{item.title}</p>
                                                        <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed">{item.message}</p>
                                                        <p className="text-[9px] text-text-muted mt-1 uppercase font-medium">
                                                            {new Date(item.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                                        </p>
                                                    </div>
                                                    {!item.is_read && <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-10 text-center">
                                                <p className="text-text-muted text-xs italic">No {activeNotifyTab} notifications</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 text-center border-t border-border-subtle bg-dashboard-bg/20">
                                        <button className="text-[11px] font-bold text-primary uppercase hover:underline">View All Notifications</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button onClick={toggleTheme} className="text-text-muted hover:text-text-main p-2 transition-colors">
                        {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <Link to="/profile" className="flex-shrink-0">
                        <div className="flex items-center gap-2 pl-2 border-l border-border-subtle cursor-pointer hover:bg-primary/5 px-1 md:px-2 py-1 rounded-lg transition">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20">
                                <img src={getProfileImageUrl()} alt="User Avatar" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }} />
                            </div>
                            <div className="flex flex-col items-start leading-none hidden md:flex">
                                <span className="text-xs md:text-[13px] font-bold text-text-main capitalize">{user?.name || "Loading..."}</span>
                                <span className="text-[10px] text-text-muted mt-0.5 uppercase tracking-tighter">{(user?.role || role)?.replace("_", " ") || "Administrator"}</span>
                            </div>
                            <ChevronDown size={14} className="text-text-muted hidden md:block ml-1" />
                        </div>
                    </Link>
                </div>
            </header>

            <AnimatePresence>
                {isImportModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card-bg border border-border-subtle rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
                            <div className="p-5 md:p-6 border-b border-border-subtle flex justify-between items-center bg-dashboard-bg/20">
                                <h2 className="text-lg md:text-xl font-bold text-text-main">Bulk Order Upload</h2>
                                <button onClick={() => setIsImportModalOpen(false)} className="p-2 text-text-muted hover:text-primary transition-colors"><X size={24} /></button>
                            </div>
                            <div className="p-6 md:p-8 space-y-5 md:space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-text-muted uppercase">Order Type *</label>
                                    <select className="w-full bg-dashboard-bg border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-main focus:border-primary outline-none cursor-pointer" value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                                        <option value="B2C">B2C</option>
                                        <option value="B2B">B2B</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-text-muted uppercase">Pickup Address *</label>
                                    <select disabled={addressLoading} className="w-full bg-dashboard-bg border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-main focus:border-primary outline-none cursor-pointer disabled:opacity-50" value={pickupAddressId} onChange={(e) => setPickupAddressId(e.target.value)}>
                                        {addressLoading ? (<option>Loading addresses...</option>) : pickupAddresses.length > 0 ? (pickupAddresses.map((addr) => (<option key={addr.id} value={addr.id}>{addr.nickname} - {addr.city} ({addr.pincode})</option>))) : (<option value="">No active addresses found</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Upload Excel File *</label>
                                    <div className="flex flex-col sm:flex-row border border-border-subtle rounded-xl overflow-hidden bg-dashboard-bg">
                                        <label htmlFor="bulk-file-input" className="bg-primary/10 border-b sm:border-b-0 sm:border-r border-border-subtle px-6 py-3 text-xs font-bold text-primary cursor-pointer hover:bg-primary/20 text-center">
                                            Choose File 
                                            <input id="bulk-file-input" type="file" className="hidden" onChange={handleFileChange} accept=".xlsx, .xls" />
                                        </label>
                                        <span className="px-4 py-3 text-sm text-text-muted italic truncate">{selectedFile ? selectedFile.name : "No file chosen (.xlsx only)"}</span>
                                    </div>
                                </div>
                                <div className="space-y-3 pt-2">
                                    <button className="text-primary text-xs font-bold hover:underline flex items-center gap-2"><Download size={14} /> Sample File (1 Box)</button>
                                    <button className="text-primary text-xs font-bold hover:underline flex items-center gap-2"><Download size={14} /> Sample File (Multiple Box)</button>
                                </div>
                            </div>
                            <div className="p-6 border-t border-border-subtle bg-dashboard-bg/50 flex justify-end gap-3">
                                <button onClick={() => setIsImportModalOpen(false)} className="px-6 py-2 text-sm font-bold text-text-muted">Close</button>
                                <Button disabled={uploadLoading || addressLoading} onClick={handleImportSubmit} className="bg-primary text-black px-10 h-10 font-bold shadow-lg min-w-[120px]">
                                    {uploadLoading ? <Loader2 className="animate-spin" size={20} /> : "Import"}
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
                            <div className="p-5 md:p-6 border-b border-border-subtle flex justify-between items-center"><h2 className="text-lg font-bold text-text-main">Recharge Wallet</h2><button onClick={() => setIsWalletModalOpen(false)} className="p-2 text-text-muted hover:text-primary transition-colors"><X size={24} /></button></div>
                            <div className="p-6 md:p-8 text-center space-y-6">
                                <div className="w-32 h-32 bg-dashboard-bg border border-border-subtle rounded-xl mx-auto flex items-center justify-center text-text-muted gap-2"><QrCode size={40} className="opacity-20" /><span className="text-[10px] uppercase font-bold opacity-30 tracking-widest">QR</span></div>
                                <div><p className="text-sm font-bold text-text-main capitalize">{user?.name || "User"}</p><div className="flex flex-wrap items-center justify-center gap-2 mt-2"><span className="text-xs text-text-muted">UPI ID: roadoz@upi</span><button className="bg-dashboard-bg border border-border-subtle px-3 py-1 rounded text-[10px] font-bold hover:bg-primary/10 transition-colors flex items-center gap-1"><Copy size={10} /> Copy</button></div></div>
                                <div className="space-y-4 text-left pt-2"><div className="space-y-1.5"><label className="text-[10px] font-black text-text-muted uppercase">Amount (₹) *</label><input type="number" placeholder="0.00" className="w-full bg-dashboard-bg border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-main focus:border-primary outline-none" /></div></div>
                            </div>
                            <div className="p-6 border-t border-border-subtle bg-dashboard-bg/50 flex justify-end gap-3"><button onClick={() => setIsWalletModalOpen(false)} className="px-6 py-2 text-sm font-bold text-text-muted">Cancel</button><Button className="bg-primary text-black px-10 h-10 font-bold shadow-lg">Submit</Button></div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isQuickActionsOpen && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card-bg border border-border-subtle rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl">
                            <div className="p-6 md:p-10">
                                <div className="flex justify-between items-center mb-8"><h2 className="text-xl md:text-2xl font-bold text-text-main">Quick Actions</h2><button onClick={() => setIsQuickActionsOpen(false)} className="p-2 bg-dashboard-bg rounded-lg text-text-muted"><X size={24} /></button></div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6">
                                    {quickActions.map((action, i) => (
                                        <button key={i} className="flex flex-col items-center gap-3 p-4 md:p-6 rounded-2xl hover:bg-primary/10 transition-all group border border-transparent hover:border-primary/20">
                                            <div className="w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">{action.icon}</div>
                                            <span className="text-[10px] md:text-xs font-bold text-text-main text-center leading-tight">{action.label}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-8 pt-6 border-t border-border-subtle text-center"><button onClick={() => setIsQuickActionsOpen(false)} className="text-sm font-bold text-text-muted hover:text-primary transition-colors uppercase tracking-widest">Close Action Menu</button></div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}