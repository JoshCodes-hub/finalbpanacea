import { useState } from "react";
import { CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const inputClassName =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

const ContactLeadForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const { error: submissionError } = await supabase.from("feedback").insert({
      parent_name: name.trim(),
      email: email.trim(),
      phone: whatsapp.trim(),
    });

    setSubmitting(false);
    if (submissionError) {
      setError("We couldn't send your details just now. Please try again.");
      return;
    }

    setSubmitted(true);
  };

  return (
    <section id="contact-form" className="bg-secondary/30 py-16 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-12">
        <div>
          <div className="mb-5 flex items-center gap-3">
            <div className="gold-bar" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Take the next step</span>
          </div>
          <h2 className="font-display text-3xl font-bold leading-tight text-primary sm:text-4xl">
            Let’s find the right support for your learner.
          </h2>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Leave your contact details and our team will get in touch to talk through your needs and next steps.
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-primary/5 sm:p-8">
          {submitted ? (
            <div className="py-8 text-center" role="status">
              <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-accent" />
              <h3 className="font-display text-2xl font-bold text-primary">Thank you for getting in touch!</h3>
              <p className="mt-2 text-muted-foreground">Your details have been sent. Our team will be in touch soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="lead-name" className="mb-1.5 block text-sm font-semibold text-foreground">Your name</label>
                <input id="lead-name" name="name" autoComplete="name" required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className={inputClassName} placeholder="Full name" />
              </div>
              <div>
                <label htmlFor="lead-email" className="mb-1.5 block text-sm font-semibold text-foreground">Email address</label>
                <input id="lead-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className={inputClassName} placeholder="you@gmail.com" />
              </div>
              <div>
                <label htmlFor="lead-whatsapp" className="mb-1.5 block text-sm font-semibold text-foreground">WhatsApp number</label>
                <input id="lead-whatsapp" name="whatsapp" type="tel" autoComplete="tel" required maxLength={32} value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} className={inputClassName} placeholder="Include your country code, e.g. +44" />
              </div>
              <label className="flex items-start gap-3 text-sm text-muted-foreground">
                <input type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-4 w-4 rounded border-border accent-primary" />
                <span>I agree that B-Panacea Education may use these details to contact me about its services. See the <Link to="/privacy" className="text-accent underline underline-offset-2">Privacy Policy</Link>.</span>
              </label>
              {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
              <button type="submit" disabled={submitting || !consent} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 font-bold text-primary-foreground transition hover:bg-dark-blue-light disabled:cursor-not-allowed disabled:opacity-60">
                {submitting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4" />}
                {submitting ? "Sending…" : "Request a call back"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default ContactLeadForm;
