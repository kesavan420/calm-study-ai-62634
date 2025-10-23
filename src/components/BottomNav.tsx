import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, Calendar, TrendingUp, Settings as SettingsIcon } from "lucide-react";
import { motion } from "framer-motion";

const BottomNav = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/subjects", icon: BookOpen, label: "Subjects" },
    { path: "/planner", icon: Calendar, label: "Planner" },
    { path: "/progress", icon: TrendingUp, label: "Progress" },
    { path: "/settings", icon: SettingsIcon, label: "Settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-medium z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 relative"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-accent rounded-lg"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <div className="relative z-10 flex flex-col items-center">
                <Icon
                  className={`w-5 h-5 mb-1 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-xs transition-colors ${
                    isActive ? "text-primary font-medium" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
