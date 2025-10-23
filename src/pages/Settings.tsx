import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Moon, Sun, LogOut, User, Bell, Palette, Info } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const Settings = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [motivationalMessages, setMotivationalMessages] = useState(true);

  useEffect(() => {
    // Check if dark mode is enabled
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    
    toast.success(`${newDarkMode ? 'Dark' : 'Light'} mode enabled`);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/auth");
    }
  };

  const settingsSections = [
    {
      title: "Appearance",
      icon: Palette,
      items: [
        {
          label: "Dark Mode",
          description: "Toggle dark theme",
          icon: darkMode ? Moon : Sun,
          checked: darkMode,
          onChange: toggleDarkMode,
        },
      ],
    },
    {
      title: "Notifications",
      icon: Bell,
      items: [
        {
          label: "Push Notifications",
          description: "Receive study reminders",
          checked: notifications,
          onChange: setNotifications,
        },
        {
          label: "Sound Effects",
          description: "Play sounds for actions",
          checked: soundEffects,
          onChange: setSoundEffects,
        },
        {
          label: "Motivational Messages",
          description: "Show encouraging messages",
          checked: motivationalMessages,
          onChange: setMotivationalMessages,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen p-6 pt-8 pb-24">
      <motion.h1
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-3xl font-bold mb-6"
      >
        Settings
      </motion.h1>

      <div className="space-y-6 max-w-2xl">
        {settingsSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
          >
            <Card className="p-6 shadow-soft">
              <div className="flex items-center gap-3 mb-4">
                <section.icon className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">{section.title}</h2>
              </div>
              <Separator className="mb-4" />
              <div className="space-y-4">
                {section.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {item.icon && <item.icon className="w-5 h-5 text-muted-foreground" />}
                      <div>
                        <Label htmlFor={`setting-${sectionIndex}-${itemIndex}`} className="font-medium">
                          {item.label}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id={`setting-${sectionIndex}-${itemIndex}`}
                      checked={item.checked}
                      onCheckedChange={item.onChange}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 shadow-soft">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">Account</h2>
            </div>
            <Separator className="mb-4" />
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 shadow-soft">
            <div className="flex items-center gap-3 mb-4">
              <Info className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">About</h2>
            </div>
            <Separator className="mb-4" />
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>AI Study Buddy - Smart Study Scheduler</p>
              <p>Version 1.0.0</p>
              <p>Made with ❤️ for students</p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
