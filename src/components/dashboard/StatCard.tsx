import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  gradient?: boolean;
  onClick?: () => void;
}

const StatCard = ({ title, value, change, changeType = "neutral", icon: Icon, gradient, onClick }: StatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card-elevated p-5 ${gradient ? "gradient-primary border-0" : ""} ${onClick ? "cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-medium uppercase tracking-wider ${gradient ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            {title}
          </p>
          <p className={`stat-value mt-2 ${gradient ? "text-primary-foreground" : "text-card-foreground"}`}>
            {value}
          </p>
          {change && (
            <p className={`text-xs mt-1 font-medium ${
              changeType === "positive"
                ? "text-signal-low"
                : changeType === "negative"
                ? "text-signal-high"
                : gradient ? "text-primary-foreground/60" : "text-muted-foreground"
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          gradient ? "bg-primary-foreground/15" : "bg-primary/8"
        }`}>
          <Icon className={`w-5 h-5 ${gradient ? "text-primary-foreground" : "text-primary"}`} />
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;
