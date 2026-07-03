import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { changePasswordRequest } from "../../redux/profileSlice";
import { motion } from "framer-motion";
import { Lock, X, RotateCcw, Eye, EyeOff } from "lucide-react";
import { Button } from "../ui/button";
import toast from "react-hot-toast";

export default function ChangePasswordModal({ onClose, onSuccess }) {
  const dispatch = useDispatch();
  const { passwordLoading } = useSelector((s) => s.profile);

  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const validate = () => {
    const newErrors = {};

    if (!form.old_password) newErrors.old_password = "Old password is required";
    if (!form.new_password) newErrors.new_password = "New password is required";
    
    if (!form.confirm_password) {
      newErrors.confirm_password = "Confirm your password";
    } else if (form.new_password !== form.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => {
      const newErrors = { ...prev };

      if (name === "old_password") {
        if (!value) newErrors.old_password = "Old password is required";
        else delete newErrors.old_password;
      }

      if (name === "new_password") {
        if (!value) newErrors.new_password = "New password is required";
        else delete newErrors.new_password;

        if (form.confirm_password) {
          if (value !== form.confirm_password) {
            newErrors.confirm_password = "Passwords do not match";
          } else {
            delete newErrors.confirm_password;
          }
        }
      }

      if (name === "confirm_password") {
        if (!value) newErrors.confirm_password = "Confirm your password";
        else if (value !== form.new_password) {
          newErrors.confirm_password = "Passwords do not match";
        } else {
          delete newErrors.confirm_password;
        }
      }

      return newErrors;
    });
  };

  const handleSubmit = async () => {
    // Run validation
    const validationErrors = validate();
    setErrors(validationErrors);

    // Stop if errors exist
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fix the highlighted errors");
      return;
    }

    // Show loading toast
    const loadingToast = toast.loading("Sending OTP...");

    try {
      await dispatch(
        changePasswordRequest({
          old_password: form.old_password,
          new_password: form.new_password,
          confirm_password: form.confirm_password,
        }),
      ).unwrap();

      // Success
      toast.dismiss(loadingToast);
      toast.success("OTP sent successfully");

      onSuccess(form.new_password);
    } catch (err) {
      // Error
      toast.dismiss(loadingToast);

      console.log("ERROR:", err);

      let errorMsg = "Something went wrong";
      if (typeof err === "string") {
        errorMsg = err;
      } else if (err?.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err?.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      } else if (err?.data?.message) {
        errorMsg = err.data.message;
      } else if (err?.data?.detail) {
        errorMsg = err.data.detail;
      } else if (err?.message) {
        errorMsg = err.message;
      } else if (err?.detail) {
        errorMsg = err.detail;
      }

      toast.error(errorMsg);
    }
  };

  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-card-bg rounded-2xl shadow-2xl w-full max-w-md border border-border-subtle flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-dashboard-bg/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Lock className="text-primary" size={20} />
            </div>
            <h3 className="text-lg font-bold text-text-main">
              Update Password
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-dashboard-bg rounded-full text-text-muted"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 bg-card-bg space-y-5">
          <InputField
            key="old_password"
            label="Old Password *"
            name="old_password"
            value={form.old_password}
            onChange={handleChange}
            error={errors.old_password}
          />

          <InputField
            key="new_password"
            label="New Password *"
            name="new_password"
            value={form.new_password}
            onChange={handleChange}
            error={errors.new_password}
          />

          <InputField
            key="confirm_password"
            label="Confirm Password *"
            name="confirm_password"
            value={form.confirm_password}
            onChange={handleChange}
            error={errors.confirm_password}
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t border-border-subtle bg-dashboard-bg/50">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            <RotateCcw size={14} /> Cancel
          </button>

          <Button
            onClick={handleSubmit}
            disabled={passwordLoading}
            className="bg-primary text-black h-10 px-8 font-bold rounded-xl flex items-center gap-2"
          >
            {passwordLoading ? "Sending OTP..." : "Update Password"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function InputField({ label, name, value, onChange, error }) {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-text-muted uppercase ml-1">
        {label}
      </label>

      <div className="relative">
        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          autoComplete="new-password"
          className={`w-full bg-dashboard-bg border rounded-xl px-4 py-2.5 pr-12 text-sm text-text-main focus:outline-none ${
            error
              ? "border-red-500"
              : "border-border-subtle focus:border-primary"
          }`}
        />

        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {/* Error Message */}
      {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
    </div>
  );
}
