import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, Clock, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Subject {
  id: string;
  name: string;
  color: string;
}

interface StudySession {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  completed: boolean;
  subject_id: string | null;
  subjects?: Subject;
}

const Planner = () => {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generatingSubtopics, setGeneratingSubtopics] = useState(false);
  const [newSession, setNewSession] = useState({
    title: "",
    date: "",
    start_time: "",
    end_time: "",
    subject_id: "",
  });

  useEffect(() => {
    fetchSessions();
    fetchSubjects();
  }, []);

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from("study_sessions")
      .select(`
        *,
        subjects(id, name, color)
      `)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      toast.error("Error fetching sessions");
      return;
    }
    setSessions(data || []);
  };

  const generateSubtopicsWithAI = async (subjectId: string, subjectName: string) => {
    setGeneratingSubtopics(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-subtopics', {
        body: { subjectName }
      });

      if (error) throw error;

      if (data?.subtopics && Array.isArray(data.subtopics)) {
        const subtopicsToInsert = data.subtopics.map((name: string) => ({
          name,
          subject_id: subjectId,
        }));

        const { error: insertError } = await supabase
          .from("subtopics")
          .insert(subtopicsToInsert);

        if (insertError) throw insertError;

        toast.success(`Generated ${data.subtopics.length} subtopics!`);
      }
    } catch (error: any) {
      console.error('Error generating subtopics:', error);
      if (error.message?.includes('429')) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else if (error.message?.includes('402')) {
        toast.error("AI credits depleted. Please add credits to continue.");
      } else {
        toast.error("Error generating subtopics");
      }
    } finally {
      setGeneratingSubtopics(false);
    }
  };

  const fetchSubjects = async () => {
    const { data, error } = await supabase
      .from("subjects")
      .select("*");

    if (error) return;
    setSubjects(data || []);
  };

  const addSession = async () => {
    if (!newSession.title || !newSession.date || !newSession.start_time || !newSession.end_time) {
      toast.error("Please fill all fields");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("study_sessions")
      .insert([{
        ...newSession,
        user_id: user.id,
        subject_id: newSession.subject_id || null,
      }]);

    if (error) {
      toast.error("Error adding session");
      return;
    }

    toast.success("Session scheduled!");
    setNewSession({ title: "", date: "", start_time: "", end_time: "", subject_id: "" });
    setDialogOpen(false);
    fetchSessions();
  };

  const toggleSession = async (session: StudySession) => {
    const { error } = await supabase
      .from("study_sessions")
      .update({ completed: !session.completed })
      .eq("id", session.id);

    if (error) {
      toast.error("Error updating session");
      return;
    }

    if (!session.completed) {
      toast.success("Great work! Session completed! 🎉");
    }
    fetchSessions();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen p-6 pt-8">
      <div className="flex justify-between items-center mb-6">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-bold"
        >
          Study Planner
        </motion.h1>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full w-12 h-12 p-0 bg-gradient-primary hover:opacity-90">
              <Plus className="w-6 h-6" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Study Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input
                placeholder="Session title"
                value={newSession.title}
                onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
              />
              <div className="space-y-2">
                <Select
                  value={newSession.subject_id}
                  onValueChange={(value) => setNewSession({ ...newSession, subject_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {newSession.subject_id && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const subject = subjects.find(s => s.id === newSession.subject_id);
                      if (subject) {
                        generateSubtopicsWithAI(subject.id, subject.name);
                      }
                    }}
                    disabled={generatingSubtopics}
                    className="w-full"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {generatingSubtopics ? "Generating..." : "Generate Subtopics with AI"}
                  </Button>
                )}
              </div>
              <Input
                type="date"
                value={newSession.date}
                onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                min={today}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="time"
                  value={newSession.start_time}
                  onChange={(e) => setNewSession({ ...newSession, start_time: e.target.value })}
                />
                <Input
                  type="time"
                  value={newSession.end_time}
                  onChange={(e) => setNewSession({ ...newSession, end_time: e.target.value })}
                />
              </div>
              <Button onClick={addSession} className="w-full">
                Schedule Session
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {sessions.map((session, index) => {
          const isPast = session.date < today;
          const subject = session.subjects;

          return (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`p-5 shadow-soft ${
                  session.completed ? "opacity-75" : ""
                } ${isPast && !session.completed ? "border-l-4 border-l-destructive" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {subject && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: subject.color }}
                        />
                      )}
                      <h3 className={`font-semibold ${session.completed ? "line-through text-muted-foreground" : ""}`}>
                        {session.title}
                      </h3>
                    </div>
                    
                    {subject && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {subject.name}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(session.date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {session.start_time} - {session.end_time}
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={session.completed ? "outline" : "default"}
                    onClick={() => toggleSession(session)}
                    className="shrink-0"
                  >
                    {session.completed ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      "Complete"
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}

        {sessions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No study sessions scheduled yet. Add your first session!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Planner;
