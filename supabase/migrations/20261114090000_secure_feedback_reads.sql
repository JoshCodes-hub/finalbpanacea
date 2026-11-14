-- Contact details are personal data: do not expose questionnaire/contact submissions publicly.
DROP POLICY IF EXISTS "Anyone can read feedback" ON public.feedback;

CREATE POLICY "Admins can read feedback"
ON public.feedback
FOR SELECT
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
