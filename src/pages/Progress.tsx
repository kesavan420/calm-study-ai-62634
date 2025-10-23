import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { TrendingUp, BookOpen, CheckCircle2, Target } from "lucide-react";
import { motion } from "framer-motion";

interface Subject {
  id: string;
  name: string;
  color: string;
}

interface Subtopic {
  subject_id: string;
  completed: boolean;
}

const Progress = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    completed: 0,
    thisWeek: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: subjectsData } = await supabase
      .from("subjects")
      .select("*");

    const { data: subtopicsData } = await supabase
      .from("subtopics")
      .select("subject_id, completed");

    const { data: allSessions } = await supabase
      .from("study_sessions")
      .select("*");

    const { data: completedSessions } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("completed", true);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data: thisWeekSessions } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("completed", true)
      .gte("date", weekAgo.toISOString().split("T")[0]);

    setSubjects(subjectsData || []);
    setSubtopics(subtopicsData || []);
    setSessionStats({
      total: allSessions?.length || 0,
      completed: completedSessions?.length || 0,
      thisWeek: thisWeekSessions?.length || 0,
    });
  };

  const getSubjectProgress = (subjectId: string) => {
    const subjectSubtopics = subtopics.filter((st) => st.subject_id === subjectId);
    if (subjectSubtopics.length === 0) return 0;
    const completed = subjectSubtopics.filter((st) => st.completed).length;
    return (completed / subjectSubtopics.length) * 100;
  };

  const overallProgress = sessionStats.total > 0 
    ? (sessionStats.completed / sessionStats.total) * 100 
    : 0;

  return (
    <div className="min-h-screen p-6 pt-8">
      <motion.h1
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-3xl font-bold mb-6"
      >
        Your Progress
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <Card className="p-6 bg-gradient-primary shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <Target className="w-6 h-6 text-white" />
            <h2 className="text-xl font-semibold text-white">
              Overall Progress
            </h2>
          </div>
          <ProgressBar value={overallProgress} className="h-3 mb-2" />
          <p className="text-white/90 text-sm">
            {sessionStats.completed} of {sessionStats.total} sessions completed
          </p>
        </Card>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <h3 className="font-medium text-sm text-muted-foreground">
                This Week
              </h3>
            </div>
            <p className="text-3xl font-bold text-success">
              {sessionStats.thisWeek}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              sessions completed
            </p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-medium text-sm text-muted-foreground">
                Completion Rate
              </h3>
            </div>
            <p className="text-3xl font-bold text-primary">
              {Math.round(overallProgress)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              of all sessions
            </p>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-xl font-semibold mb-4">Subject Progress</h2>
        <div className="space-y-4">
          {subjects.map((subject, index) => {
            const progress = getSubjectProgress(subject.id);
            const subjectSubtopics = subtopics.filter((st) => st.subject_id === subject.id);
            const completed = subjectSubtopics.filter((st) => st.completed).length;

            return (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card className="p-5 shadow-soft">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: subject.color + "20" }}
                    >
                      <BookOpen className="w-5 h-5" style={{ color: subject.color }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{subject.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {completed}/{subjectSubtopics.length} subtopics
                      </p>
                    </div>
                    <span className="text-lg font-bold text-primary">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <ProgressBar value={progress} className="h-2" />
                </Card>
              </motion.div>
            );
          })}

          {subjects.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Add subjects and complete sessions to track your progress!
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Progress;
