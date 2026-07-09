import React from "react";
import { motion } from "motion/react";
import logo from "../../assets/images/RO-2.png";

export function Loader() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] w-full space-y-6">
      <div className="relative flex items-center justify-center">
        <motion.div
          className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        />
        
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <motion.img
            src={logo}
            alt="Loading..."
            className="w-17 h-20 object-contain"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          />
        </div>
      </div>

      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold text-text-main tracking-tight">Loading Profile</h2>
        <p className="text-xs text-text-muted font-medium uppercase tracking-[0.2em] animate-pulse">
          Retrieving your details...
        </p>
      </div>
    </div>
  );
}