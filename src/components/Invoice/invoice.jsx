
import { useState, useRef, useEffect } from "react";
import { 
  Menu, Bell, Search, Moon, Sun, Plus, Zap, 
  Maximize, X, ShoppingBag, List, Calculator, 
  FileText, History, ChevronDown 
} from "lucide-react";
import { Button } from "../ui/button";
import { useTheme } from "../../contexts/ThemeContext";
import Logo from "../../assets/images/RO-2.png";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

export function Invoice({ toggleSidebar }) {
  const { theme, toggleTheme } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const quickActions = [
    { icon: <ShoppingBag className="text-primary" />, label: "Add an Order" },
    { icon: <List className="text-primary" />, label: "All Orders" },
    { icon: <Calculator className="text-primary" />, label: "Rate Calculator" },
    { icon: <FileText className="text-primary" />, label: "Create Invoice" },
    { icon: <History className="text-primary" />, label: "Remittance Transaction Log" },
  ];

  return (
    <div className="sticky top-0 z-30">
      <header className="h-16 bg-card-bg border-b border-border-subtle flex items-center justify-between px-4 md:px-6 transition-colors duration-300">
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar}
            className="text-text-muted hover:text-text-main p-1 rounded-lg hover:bg-dashboard-bg transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>

        <div className="flex items-center gap-1.5 md:gap-3 h-full">
          
          <Button variant="default" className="font-bold text-[10px] uppercase tracking-widest hidden md:flex bg-primary text-black hover:bg-primary/90 h-9 px-4">
            <Plus size={16} className="mr-1" /> Import orders
          </Button>

          <button 
            onClick={() => setIsQuickActionsOpen(true)}
            className="w-9 h-9 md:w-10 md:h-10 bg-primary text-black rounded-full flex items-center justify-center hover:bg-primary/90 transition-all active:scale-90"
          >
            <Zap size={18} fill="currentColor" />
          </button>
          
          <div className="flex items-center gap-1 bg-dashboard-bg px-2 md:px-3 py-1.5 rounded-full border border-border-subtle hover:border-primary/30 transition-colors">
            <div className="hidden sm:flex w-5 h-5 bg-primary/20 rounded items-center justify-center text-primary mr-1">
              <Plus size={12} />
            </div>
            <span className="text-text-main font-bold text-xs md:text-sm whitespace-nowrap">₹ 689</span>
            <button className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-black ml-1 hover:scale-110 transition-transform">
              <Plus size={12} strokeWidth={4} />
            </button>
          </div>

          <div className="relative flex items-center" ref={notificationRef}>
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="text-text-muted hover:text-text-main p-2 relative group"
            >
              <Bell size={20} className="group-hover:animate-shake" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-card-bg"></span>
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-card-bg border border-border-subtle rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-dashboard-bg/50">
                  <h3 className="font-bold text-text-main">Notifications</h3>
                  <span className="bg-red-500/10 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">9 Unread</span>
                </div>
                <div className="flex border-b border-border-subtle bg-dashboard-bg/20">
                  <button className="flex-1 py-2 text-xs font-bold text-primary border-b-2 border-primary">Orders</button>
                  <button className="flex-1 py-2 text-xs font-medium text-text-muted">Wallet</button>
                  <button className="flex-1 py-2 text-xs font-medium text-text-muted">COD</button>
                </div>
                <div className="p-8 text-center bg-card-bg">
                  <p className="text-text-muted text-sm italic">No new notifications</p>
                  <button className="text-primary text-xs font-bold mt-4 hover:underline">Mark all read</button>
                </div>
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1 border-l border-border-subtle pl-1 ml-1">
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="text-text-muted hover:text-primary p-2 transition-colors"
            >
              <Search size={20} />
            </button>

            <button 
              onClick={toggleTheme}
              className="text-text-muted hover:text-primary p-2 transition-colors"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button 
              onClick={toggleFullscreen}
              className="text-text-muted hover:text-primary p-2 hidden lg:block"
            >
              <Maximize size={20} />
            </button>
          </div>

          <Link 
            to="/profile" 
            className="flex items-center gap-3 pl-4 border-l border-border-subtle hover:bg-primary/5 transition-all duration-200 group rounded-r-xl h-full"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/10 flex items-center justify-center overflow-hidden group-hover:border-primary/40 transition-colors shadow-sm flex-shrink-0">
              <img 
                src={Logo} 
                alt="Logo" 
                className="w-[50] h-[50] object-contain transform group-hover:scale-110 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-sm font-bold text-text-main group-hover:text-primary transition-colors leading-tight truncate max-w-[150px]">
                Samshtech Technologies
              </span>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-tight mt-0.5 group-hover:text-primary/70">
                Administrator
              </span>
            </div>
            <ChevronDown size={14} className="text-text-muted group-hover:text-primary transition-colors hidden lg:block ml-1" />
          </Link>
        </div>
      </header>

      {isSearchOpen && (
        <div className="bg-card-bg border-b border-border-subtle p-4 animate-in slide-in-from-top duration-300">
          <div className="max-w-3xl mx-auto relative">
            <input 
              type="text" 
              placeholder="Search Tracking Id, Order Id or Buyer Name..." 
              className="w-full bg-dashboard-bg border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-main focus:outline-none focus:border-primary transition-all"
              autoFocus
            />
            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted" />
          </div>
        </div>
      )}

      {isQuickActionsOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-card-bg border border-border-subtle rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-10">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-text-main">Quick Actions</h2>
                <button onClick={() => setIsQuickActionsOpen(false)} className="p-2 hover:bg-dashboard-bg rounded-lg transition-colors">
                  <X size={24} className="text-text-muted" />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-8">
                {quickActions.map((action, i) => (
                  <button 
                    key={i}
                    className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-dashboard-bg/30 border border-transparent hover:border-primary/30 hover:bg-primary/5 transition-all group"
                  >
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/20 transition-all">
                      {action.icon}
                    </div>
                    <span className="text-xs font-bold text-text-main text-center leading-relaxed px-2">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-10 pt-6 border-t border-border-subtle text-center">
                <button 
                  onClick={() => setIsQuickActionsOpen(false)}
                  className="text-sm font-bold text-primary hover:underline"
                >
                  Close Action Menu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}