import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, BookOpen, CheckCircle2, Circle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Subject {
  id: string;
  name: string;
  color: string;
}

interface Subtopic {
  id: string;
  subject_id: string;
  name: string;
  completed: boolean;
}

const Subjects = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [newSubtopic, setNewSubtopic] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generatingSubtopics, setGeneratingSubtopics] = useState(false);

  useEffect(() => {
    fetchSubjects();
    fetchSubtopics();
  }, []);

  const fetchSubjects = async () => {
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error fetching subjects");
      return;
    }
    setSubjects(data || []);
  };

  const fetchSubtopics = async () => {
    const { data, error } = await supabase
      .from("subtopics")
      .select("*");

    if (error) {
      toast.error("Error fetching subtopics");
      return;
    }
    setSubtopics(data || []);
  };

  const generateSubtopicsWithAI = async (subjectId: string, subjectName: string) => {
    setGeneratingSubtopics(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-subtopics', {
        body: { subjectName }
      });

      if (error) throw error;

      if (data?.subtopics && Array.isArray(data.subtopics)) {
        // Insert all subtopics
        const subtopicsToInsert = data.subtopics.map((name: string) => ({
          name,
          subject_id: subjectId,
        }));

        const { error: insertError } = await supabase
          .from("subtopics")
          .insert(subtopicsToInsert);

        if (insertError) throw insertError;

        toast.success(`Generated ${data.subtopics.length} subtopics!`);
        fetchSubtopics();
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

  const addSubject = async () => {
    if (!newSubject.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("subjects")
      .insert([{ name: newSubject, user_id: user.id }])
      .select()
      .single();

    if (error) {
      toast.error("Error adding subject");
      return;
    }

    toast.success("Subject added!");
    setNewSubject("");
    setDialogOpen(false);
    fetchSubjects();

    // Auto-generate subtopics with AI
    if (data) {
      generateSubtopicsWithAI(data.id, data.name);
    }
  };

  const addSubtopic = async (subjectId: string) => {
    if (!newSubtopic.trim()) return;

    const { error } = await supabase
      .from("subtopics")
      .insert([{ name: newSubtopic, subject_id: subjectId }]);

    if (error) {
      toast.error("Error adding subtopic");
      return;
    }

    toast.success("Subtopic added!");
    setNewSubtopic("");
    fetchSubtopics();
  };

  const toggleSubtopic = async (subtopic: Subtopic) => {
    const { error } = await supabase
      .from("subtopics")
      .update({ completed: !subtopic.completed })
      .eq("id", subtopic.id);

    if (error) {
      toast.error("Error updating subtopic");
      return;
    }

    fetchSubtopics();
  };

  const getSubtopicsForSubject = (subjectId: string) => {
    return subtopics.filter((st) => st.subject_id === subjectId);
  };

  return (
    <div className="min-h-screen p-6 pt-8">
      <div className="flex justify-between items-center mb-6">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-bold"
        >
          My Subjects
        </motion.h1>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full w-12 h-12 p-0 bg-gradient-primary hover:opacity-90">
              <Plus className="w-6 h-6" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Subject</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input
                placeholder="Subject name (e.g., Mathematics)"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addSubject()}
              />
              <Button onClick={addSubject} className="w-full">
                Add Subject
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {subjects.map((subject, index) => {
          const subjectSubtopics = getSubtopicsForSubject(subject.id);
          const completedCount = subjectSubtopics.filter(st => st.completed).length;

          return (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 shadow-soft">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: subject.color + "20" }}
                  >
                    <BookOpen className="w-6 h-6" style={{ color: subject.color }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{subject.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {completedCount}/{subjectSubtopics.length} subtopics completed
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  {subjectSubtopics.map((subtopic) => (
                    <div
                      key={subtopic.id}
                      onClick={() => toggleSubtopic(subtopic)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    >
                      {subtopic.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      )}
                      <span className={subtopic.completed ? "line-through text-muted-foreground" : ""}>
                        {subtopic.name}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add subtopic..."
                      value={selectedSubjectId === subject.id ? newSubtopic : ""}
                      onFocus={() => setSelectedSubjectId(subject.id)}
                      onChange={(e) => setNewSubtopic(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && selectedSubjectId === subject.id) {
                          addSubtopic(subject.id);
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => addSubtopic(subject.id)}
                      disabled={selectedSubjectId !== subject.id || !newSubtopic.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {subjectSubtopics.length === 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generateSubtopicsWithAI(subject.id, subject.name)}
                      disabled={generatingSubtopics}
                      className="w-full"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {generatingSubtopics ? "Generating..." : "Generate with AI"}
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}

        {subjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No subjects yet. Add your first subject to get started!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Subjects;
