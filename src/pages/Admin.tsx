import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Lock,
  LogOut,
  Mail,
  Phone,
  RefreshCw,
  Target,
  User,
} from "lucide-react";
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

const hasAdminRole = (user: SupabaseUser | null) => user?.app_metadata?.role === "admin";

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
      setError("Could not load submissions. Check that the admin role and Supabase migration are configured.");
    } else {
      setFeedback(data as Feedback[]);
      setError("");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      const user = session?.user ?? null;
      setAdminUser(hasAdminRole(user) ? user : null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setAdminUser(hasAdminRole(user) ? user : null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (adminUser) {
      void fetchFeedback();
    } else {
      setFeedback([]);
    }
  }, [adminUser, fetchFeedback]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setPassword("");
    if (signInError) {
      setError("Sign-in failed. Check your email and password.");
      return;
    }

    if (!hasAdminRole(data.user)) {
      await supabase.auth.signOut();
      setError("This account is not authorized as an admin. Ask the Supabase project owner to grant the admin role.");
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
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="bg-card rounded-3xl p-8 sm:p-10 shadow-2xl border border-border">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold text-primary">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-2">Sign in with your authorized admin account.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => { setEmail(event.target.value); setError(""); }}
                placeholder="Admin email"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              />
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => { setPassword(event.target.value); setError(""); }}
                placeholder="Password"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              />
              {error && <p className="text-sm text-destructive flex items-start gap-2"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}</p>}
              <button type="submit" className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-dark-blue-light transition-all">
                Sign in
              </button>
            </form>
            <p className="mt-4 text-xs text-muted-foreground text-center">Use the email and password created for you in Supabase Authentication.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-5">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold">B-Panacea Admin</h1>
            <p className="text-sm text-primary-foreground/60">Client and contact submissions</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => void fetchFeedback()} className="p-2 rounded-lg hover:bg-primary-foreground/10 transition-colors" title="Refresh" aria-label="Refresh submissions">
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={() => void handleLogout()} className="p-2 rounded-lg hover:bg-primary-foreground/10 transition-colors" title="Logout" aria-label="Sign out">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 sm:px-6 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total", value: feedback.length },
            { label: "New", value: feedback.filter((item) => item.status === "new").length },
            { label: "This Week", value: feedback.filter((item) => new Date(item.created_at) > new Date(Date.now() - 7 * 86400000)).length },
            { label: "Today", value: feedback.filter((item) => new Date(item.created_at).toDateString() === new Date().toDateString()).length },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-2xl p-5 border border-border">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-3xl font-display font-bold mt-1 text-primary">{stat.value}</p>
            </div>
          ))}
        </div>

        {error && <p role="alert" className="mb-5 text-sm text-destructive flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</p>}
        {feedback.length === 0 && !loading ? (
          <div className="text-center py-20">
            <CheckCircle2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No submissions yet.</p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-secondary/50 border-b border-border">
                  <th className="px-4 py-3 text-left font-bold text-primary">Name</th>
                  <th className="px-4 py-3 text-left font-bold text-primary">Email</th>
                  <th className="px-4 py-3 text-left font-bold text-primary">WhatsApp</th>
                  <th className="px-4 py-3 text-left font-bold text-primary hidden sm:table-cell">Date</th>
                  <th className="px-4 py-3"></th>
                </tr></thead>
                <tbody>{feedback.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{item.parent_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.email || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.phone || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">{new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td className="px-4 py-3"><button onClick={() => setSelected(item)} className="p-2 rounded-lg hover:bg-accent/10 text-accent transition-colors" title="View details" aria-label={`View ${item.parent_name}'s submission`}><Eye className="w-4 h-4" /></button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {selected && (
        <div className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-3xl p-6 sm:p-8 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-border" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div><h2 className="font-display text-xl font-bold text-primary">{selected.parent_name}</h2><p className="text-xs text-muted-foreground mt-1"><Clock className="w-3 h-3 inline mr-1" />{new Date(selected.created_at).toLocaleString("en-GB")}</p></div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground" aria-label="Close details">✕</button>
            </div>
            <div className="space-y-4">
              {[
                { icon: Mail, label: "Email", value: selected.email },
                { icon: Phone, label: "WhatsApp / Phone", value: selected.phone },
                { icon: User, label: "Learner", value: selected.learner_name },
                { icon: BookOpen, label: "Year Group", value: selected.learner_year_group },
                { icon: BookOpen, label: "Subjects", value: selected.subjects },
                { icon: Target, label: "Learning Goals", value: selected.learning_goals },
                { icon: Calendar, label: "Session Preference", value: selected.session_preference },
                { icon: AlertCircle, label: "Additional Info", value: selected.additional_info },
              ].map(({ icon: Icon, label, value }) => value ? (
                <div key={label} className="flex gap-3"><Icon className="w-4 h-4 text-accent mt-1 shrink-0" /><div><p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p><p className="text-sm text-foreground mt-0.5">{value}</p></div></div>
              ) : null)}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Admin;
