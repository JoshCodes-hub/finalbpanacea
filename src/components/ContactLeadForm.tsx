import { useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle, Send, X } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const LEAD_FORM_COMPLETED_KEY = "bpanacea-lead-form-completed";

const inputClassName =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

const hasCompletedLeadForm = () => {
  try {
    return window.localStorage.getItem(LEAD_FORM_COMPLETED_KEY) === "true";
  } catch {
    return false;
  }
};

const ContactLeadForm = () => {
  const [isOpen, setIsOpen] = useState(() => !hasCompletedLeadForm());
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const { error: submissionError } = await supabase.from("feedback").insert({
        parent_name: name.trim(),
        email: email.trim(),
        phone: whatsapp.trim(),
      });

      if (submissionError) {
        setError("We couldn't send your details just now. Please try again.");
        return;
      }

      setSubmitted(true);
      try {
        window.localStorage.setItem(LEAD_FORM_COMPLETED_KEY, "true");
      } catch {
        // The confirmation still works if browser storage is unavailable.
      }
    } catch {
      setError("We couldn't send your details just now. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {!isOpen && !hasCompletedLeadForm() && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-40 rounded-full bg-primary px-5 py-3 font-bold text-primary-foreground shadow-xl transition hover:bg-dark-blue-light"
        >
          Request a call back
        </button>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-foreground/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-lead-heading"
            className="relative my-auto w-full max-w-xl rounded-3xl border border-border bg-card p-6 shadow-2xl sm:p-8"
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close contact form"
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            {submitted ? (
              <div className="py-10 text-center" role="status">
                <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-accent" />
                <h2 id="contact-lead-heading" className="font-display text-2xl font-bold text-primary">
                  Thank you for getting in touch!
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Your details have been sent. Our team will be in touch soon.
                </p>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="mt-6 rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground hover:bg-dark-blue-light"
                >
                  Continue browsing
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6 pr-8">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="gold-bar" />
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Take the next step</span>
                  </div>
                  <h2 id="contact-lead-heading" className="font-display text-2xl font-bold leading-tight text-primary sm:text-3xl">
                    Let’s find the right support for your learner.
                  </h2>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Share your contact details and our team will get in touch about your needs and next steps.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                    <span>I agree that B-Panacea Education may use these details to contact me about its services. See the <Link to="/privacy" onClick={() => setIsOpen(false)} className="text-accent underline underline-offset-2">Privacy Policy</Link>.</span>
                  </label>
                  {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
                  <button type="submit" disabled={submitting || !consent} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 font-bold text-primary-foreground transition hover:bg-dark-blue-light disabled:cursor-not-allowed disabled:opacity-60">
                    {submitting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4" />}
                    {submitting ? "Sending…" : "Request a call back"}
                  </button>
                  <p className="text-center text-xs text-muted-foreground">Your details are used only to respond to your enquiry.</p>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
};

export default ContactLeadForm;
