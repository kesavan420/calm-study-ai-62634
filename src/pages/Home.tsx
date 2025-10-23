import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";

const Home = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSubjects: 0,
    completedSessions: 0,
    upcomingSessions: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: subjects } = await supabase
        .from("subjects")
        .select("*");

      const today = new Date().toISOString().split("T")[0];
      const { data: completedSessions } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("completed", true);

      const { data: upcomingSessions } = await supabase
        .from("study_sessions")
        .select("*")
        .gte("date", today)
        .eq("completed", false);

      setStats({
        totalSubjects: subjects?.length || 0,
        completedSessions: completedSessions?.length || 0,
        upcomingSessions: upcomingSessions?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen p-6 pt-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Hey there! 👋
            </h1>
            <p className="text-muted-foreground">
              Let's make today productive
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleLogout}
            className="rounded-full"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gradient-primary p-6 mb-6 shadow-soft">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-5 h-5 text-white" />
            <h2 className="text-xl font-semibold text-white">
              Daily Motivation
            </h2>
          </div>
          <p className="text-white/90">
            "Small progress is still progress. Keep going!"
          </p>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 shadow-soft">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Active Subjects
            </h3>
            <p className="text-3xl font-bold text-primary">
              {stats.totalSubjects}
            </p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 shadow-soft">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Sessions Completed
            </h3>
            <p className="text-3xl font-bold text-success">
              {stats.completedSessions}
            </p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6 shadow-soft">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Upcoming Sessions
            </h3>
            <p className="text-3xl font-bold text-secondary">
              {stats.upcomingSessions}
            </p>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-2 gap-4"
      >
        <Button
          onClick={() => navigate("/subjects")}
          className="h-24 bg-gradient-primary hover:opacity-90 flex flex-col items-center justify-center gap-2"
        >
          <span className="text-2xl">📚</span>
          <span>Add Subject</span>
        </Button>
        <Button
          onClick={() => navigate("/planner")}
          variant="outline"
          className="h-24 flex flex-col items-center justify-center gap-2 border-2"
        >
          <span className="text-2xl">📅</span>
          <span>Plan Session</span>
        </Button>
      </motion.div>
    </div>
  );
};

export default Home;
