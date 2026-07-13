import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowLeft,
  Hash,
  ShieldCheck,
  AlertCircle,
  Warehouse, // Added Warehouse icon
} from "lucide-react";
import Logo from "../assets/images/RO-2.png";
import { Button } from "../components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { checkUserRole, loginUser } from "../redux/authSlice";

export function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { loading, role } = useSelector((state) => state.auth);

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [userRoleType, setUserRoleType] = useState(""); // Tracks "franchise" or "warehouse"

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    franchiseCode: "",
    warehouseCode: "",
  });

  const [loginError, setLoginError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Trim email and codes, keep password as is
    const cleanValue =
      name === "email" || name === "franchiseCode" || name === "warehouseCode"
        ? value.trim()
        : value;

    setFormData({ ...formData, [name]: cleanValue });
    setLoginError("");
  };

  const handleFirstStep = async (e) => {
    e.preventDefault();
    setLoginError("");

    const trimmedEmail = formData.email.trim();
    const trimmedPassword = formData.password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setLoginError("Please enter both email and password.");
      return;
    }

    // Step 1: check role via Redux
    const roleResult = await dispatch(checkUserRole(trimmedEmail));

    if (checkUserRole.fulfilled.match(roleResult)) {
      const payload = roleResult.payload;
      // The API returns role as an object: { name: "warehouse", id: "..." }
      const roleName = payload.role?.name || payload.role; 
      const requiresFranchise = payload.requires_franchise_code;

      if (roleName === "franchise" || requiresFranchise) {
        setUserRoleType("franchise");
        setStep(2);
      } else if (roleName === "warehouse") {
        setUserRoleType("warehouse");
        setStep(2);
      } else {
        // Admin or other roles login directly
        const loginResult = await dispatch(
          loginUser({
            email: trimmedEmail,
            password: trimmedPassword,
          })
        );

        if (loginUser.fulfilled.match(loginResult)) {
          navigate("/dashboard");
        } else {
          setLoginError(loginResult?.payload?.detail || "Login failed");
        }
      }
    } else {
      setLoginError("Unable to verify user");
    }
  };

  const handleFinalStep = async (e) => {
    e.preventDefault();

    const trimmedEmail = formData.email.trim();
    const trimmedPassword = formData.password.trim();
    
    // Construct dynamic payload based on the role detected in step 1
    const loginPayload = {
      email: trimmedEmail,
      password: trimmedPassword,
    };

    if (userRoleType === "franchise") {
      if (!formData.franchiseCode) {
        setLoginError("Franchise code is required.");
        return;
      }
      loginPayload.franchise_code = formData.franchiseCode;
    } else if (userRoleType === "warehouse") {
      if (!formData.warehouseCode) {
        setLoginError("Warehouse code is required.");
        return;
      }
      loginPayload.warehouse_code = formData.warehouseCode;
    }

    try {
      const resultAction = await dispatch(loginUser(loginPayload));

      if (loginUser.fulfilled.match(resultAction)) {
        navigate("/dashboard");
      } else {
        setLoginError(
          resultAction?.payload?.detail || `Invalid ${userRoleType} code`
        );
      }
    } catch (err) {
      setLoginError("Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen bg-dashboard-bg flex flex-col items-center justify-center p-4">
      <div className="mb-10 text-center">
        <img
          src={Logo}
          alt="Roadoz Logo"
          className="h-16 w-auto mx-auto mb-4 object-contain"
        />
        <h1 className="text-2xl font-bold text-text-main tracking-tight italic">
          ROADOZ{" "}
          <span className="text-primary not-italic tracking-normal ml-1">
            LOGISTICS
          </span>
        </h1>
      </div>

      <div className="w-full max-w-[450px] bg-card-bg rounded-2xl border border-border-subtle shadow-2xl overflow-hidden relative">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="p-8 md:p-10"
            >
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-text-main mb-2">Sign In</h2>
                <p className="text-text-muted font-medium italic">
                  Enter your credentials to continue
                </p>
              </div>

              {loginError && (
                <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle size={18} />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleFirstStep} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-dashboard-bg border border-border-subtle rounded-xl pl-12 pr-4 py-4 text-text-main focus:border-primary outline-none transition-all"
                      placeholder="name@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      Password
                    </label>
                    <Link to="/forgot-password" size={18} className="text-primary text-xs font-bold hover:underline">
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full bg-dashboard-bg border border-border-subtle rounded-xl pl-12 pr-12 py-4 text-text-main focus:border-primary outline-none transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-text-muted hover:text-primary"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-black font-bold py-7 rounded-xl shadow-lg hover:bg-primary/90 text-base uppercase tracking-widest"
                >
                  {loading ? "Authenticating..." : "Continue"}
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              className="p-8 md:p-10"
            >
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-6 hover:opacity-80 transition-opacity"
              >
                <ArrowLeft size={16} /> Back to login
              </button>

              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  {userRoleType === "warehouse" ? (
                    <Warehouse className="text-primary" size={32} />
                  ) : (
                    <ShieldCheck className="text-primary" size={32} />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-text-main mb-2">
                  {userRoleType === "warehouse" ? "Warehouse Verification" : "Franchise Verification"}
                </h2>
                <p className="text-text-muted text-sm italic px-4">
                  Please enter your unique {userRoleType} ID to access your dashboard.
                </p>
              </div>

              {loginError && (
                <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle size={18} />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleFinalStep} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">
                    {userRoleType === "warehouse" ? "Warehouse Code" : "Franchise Code"}
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input
                      type="text"
                      name={userRoleType === "warehouse" ? "warehouseCode" : "franchiseCode"}
                      value={userRoleType === "warehouse" ? formData.warehouseCode : formData.franchiseCode}
                      onChange={handleInputChange}
                      className="w-full bg-dashboard-bg border border-border-subtle rounded-xl pl-12 pr-4 py-4 text-text-main focus:border-primary outline-none transition-all"
                      placeholder={`Enter ${userRoleType} code`}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-black font-bold py-7 rounded-xl shadow-lg hover:bg-primary/90 text-base uppercase tracking-widest"
                >
                  {loading ? "Verifying..." : "Verify & Enter"}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}