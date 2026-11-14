import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, BookOpen, Calendar, CheckCircle2, Clock, Eye, Lock, LogOut, Mail, Phone, RefreshCw, Target, User } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Feedback = {
  id: string;
  parent_name: string;
  email: string | null;
  phone: string | null;
  learner_name: string | null;
  learner_year_group: string | null;
  subjects: string | null;
  learning_goals: string | null;
  session_preference: string | null;
  additional_info: string | null;
  status: string;
  created_at: string;
};

const isAdmin = (user: SupabaseUser | null) => user?.app_metadata?.role === "admin";

const Admin = () => {
  const [adminUser, setAdminUser] = useState<SupabaseUser | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Feedback | null>(null);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });
    if (fetchError) {
      setError("Could not load submissions. Check your admin access and try again.");
    } else {
      setFeedback(data as Feedback[]);
      setError("");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const user = data.session?.user ?? null;
      if (isAdmin(user)) setAdminUser(user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setAdminUser(isAdmin(user) ? user : null);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (adminUser) void fetchFeedback();
    else setFeedback([]);
  }, [adminUser, fetchFeedback]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    setPassword("");
    if (loginError || !isAdmin(data.user)) {
      if (!loginError && data.user) await supabase.auth.signOut();
      setError("Sign-in failed or this account does not have admin access.");
      return;
    }
    setAdminUser(data.user);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAdminUser(null);
    setSelected(null);
  };

  if (!adminUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-2xl sm:p-10">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"><Lock className="h-8 w-8 text-primary" /></div>
              <h1 className="font-display text-2xl font-bold text-primary">Admin Dashboard</h1>
              <p className="mt-2 text-sm text-muted-foreground">Sign in with your authorised admin account to view contact submissions.</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Admin email" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/50" />
              <input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/50" />
              {error && <p className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4" />{error}</p>}
              <button type="submit" className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground transition hover:bg-dark-blue-light">Sign in</button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary py-5 text-primary-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-6">
          <div><h1 className="font-display text-xl font-bold sm:text-2xl">B-Panacea Admin</h1><p className="text-sm text-primary-foreground/70">Contact and questionnaire submissions</p></div>
          <div className="flex items-center gap-3">
            <button onClick={() => void fetchFeedback()} className="rounded-lg p-2 hover:bg-primary-foreground/10" title="Refresh submissions" aria-label="Refresh submissions"><RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} /></button>
            <button onClick={() => void handleLogout()} className="rounded-lg p-2 hover:bg-primary-foreground/10" title="Sign out" aria-label="Sign out"><LogOut className="h-5 w-5" /></button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-6">
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total submissions", value: feedback.length },
            { label: "New", value: feedback.filter((item) => item.status === "new").length },
            { label: "This week", value: feedback.filter((item) => new Date(item.created_at) > new Date(Date.now() - 7 * 86400000)).length },
            { label: "Today", value: feedback.filter((item) => new Date(item.created_at).toDateString() === new Date().toDateString()).length },
          ].map((stat) => <div key={stat.label} className="rounded-2xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">{stat.label}</p><p className="mt-1 font-display text-3xl font-bold text-primary">{stat.value}</p></div>)}
        </div>
        {error && <p className="mb-5 flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4" />{error}</p>}
        {feedback.length === 0 && !loading ? (
          <div className="py-20 text-center"><CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" /><p className="text-muted-foreground">No submissions yet. New contact form entries will appear here.</p></div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-secondary/50"><th className="px-4 py-3 text-left font-bold text-primary">Name</th><th className="px-4 py-3 text-left font-bold text-primary">Email</th><th className="px-4 py-3 text-left font-bold text-primary">WhatsApp</th><th className="hidden px-4 py-3 text-left font-bold text-primary sm:table-cell">Date</th><th className="px-4 py-3"></th></tr></thead>
              <tbody>{feedback.map((item) => <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/20">
                <td className="px-4 py-3 font-semibold text-foreground">{item.parent_name}</td><td className="px-4 py-3 text-muted-foreground"><a href={`mailto:${item.email}`} className="hover:text-accent">{item.email || "—"}</a></td><td className="px-4 py-3 text-muted-foreground"><a href={item.phone ? `https://wa.me/${item.phone.replace(/\D/g, "")}` : undefined} target="_blank" rel="noreferrer" className="hover:text-accent">{item.phone || "—"}</a></td><td className="hidden px-4 py-3 text-xs text-muted-foreground sm:table-cell">{new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td><td className="px-4 py-3"><button onClick={() => setSelected(item)} className="rounded-lg p-2 text-accent hover:bg-accent/10" title="View submission details" aria-label={`View ${item.parent_name}'s submission`}><Eye className="h-4 w-4" /></button></td>
              </tr>)}</tbody>
            </table></div>
          </div>
        )}
      </main>
      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl sm:p-8" onClick={(event) => event.stopPropagation()}>
          <div className="mb-6 flex items-start justify-between"><div><h2 className="font-display text-xl font-bold text-primary">{selected.parent_name}</h2><p className="mt-1 text-xs text-muted-foreground"><Clock className="mr-1 inline h-3 w-3" />{new Date(selected.created_at).toLocaleString("en-GB")}</p></div><button onClick={() => setSelected(null)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary" aria-label="Close details">✕</button></div>
          <div className="space-y-4">{[
            { icon: Mail, label: "Email", value: selected.email },
            { icon: Phone, label: "WhatsApp / Phone", value: selected.phone },
            { icon: User, label: "Learner", value: selected.learner_name },
            { icon: BookOpen, label: "Year Group", value: selected.learner_year_group },
            { icon: BookOpen, label: "Subjects", value: selected.subjects },
            { icon: Target, label: "Learning Goals", value: selected.learning_goals },
            { icon: Calendar, label: "Session Preference", value: selected.session_preference },
            { icon: AlertCircle, label: "Additional Info", value: selected.additional_info },
          ].map(({ icon: Icon, label, value }) => value ? <div key={label} className="flex gap-3"><Icon className="mt-1 h-4 w-4 shrink-0 text-accent" /><div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-0.5 text-sm text-foreground">{value}</p></div></div> : null)}</div>
        </motion.div>
      </div>}
    </div>
  );
};

export default Admin;
