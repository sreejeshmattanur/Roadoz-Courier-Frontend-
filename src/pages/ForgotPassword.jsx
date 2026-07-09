import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, ShieldQuestion } from "lucide-react";
import Logo from "../assets/images/RO-2.png";
import { Button } from "../components/ui/button";

export function ForgotPassword() {
  return (
    <div className="min-h-screen bg-dashboard-bg flex flex-col items-center justify-center p-4 transition-colors duration-300">
      <div className="mb-10 text-center">
        <img 
          src={Logo} 
          alt="Roadoz Logo" 
          className="h-16 w-auto mx-auto mb-4 object-contain"
        />
      </div>

      <div className="w-full max-w-[450px] bg-card-bg rounded-2xl border border-border-subtle shadow-2xl p-8 md:p-10 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldQuestion className="text-primary" size={32} />
        </div>
        
        <h2 className="text-3xl font-bold text-text-main mb-3">Reset Password</h2>
        <p className="text-text-muted mb-8 text-sm leading-relaxed">
          Enter your registered email address and we'll send you instructions to reset your password.
        </p>

        <div className="space-y-6">
           <div className="space-y-2 text-left">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider block ml-1">Email Address</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  placeholder="name@company.com"
                  className="w-full bg-dashboard-bg border border-border-subtle rounded-xl pl-12 pr-4 py-4 text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-text-muted"
                  required
                />
              </div>
           </div>

           <Button className="w-full bg-primary text-black font-bold py-7 rounded-xl shadow-lg hover:bg-primary/90 transition-all text-base uppercase tracking-widest">
              Send Reset Link
           </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-border-subtle">
          <Link to="/login" className="text-primary font-bold hover:underline flex items-center justify-center gap-2 text-sm uppercase tracking-wider">
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}