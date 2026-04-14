import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Privacy Notice (Protection of Personal Information Act, 2013)
// This page is intentionally outside the (dashboard) route group so it is
// publicly accessible — the middleware exempts /privacy via the
// PUBLIC_PATHS list.
//
// Items marked TODO must be filled in by the responsible party (the fleet
// owner operating this instance) before the platform processes real driver
// data in production.

const LAST_UPDATED = "14 April 2026";
const CONSENT_VERSION = "2026-04-14";

export const metadata = {
  title: "Privacy Notice — Fleet Manager",
  description:
    "How Fleet Manager processes personal information under the Protection of Personal Information Act (POPIA).",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Privacy Notice
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: {LAST_UPDATED} · Consent version: {CONSENT_VERSION}
        </p>

        <div className="prose prose-slate mt-8 max-w-none text-sm text-slate-700">
          <p>
            This Privacy Notice explains how Fleet Manager processes your
            personal information under the Protection of Personal Information
            Act, 2013 (POPIA). Please read it carefully — by accepting an
            invitation and setting a password you confirm that you have read
            and consented to the processing described below.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">
            1. Who we are (responsible party)
          </h2>
          <p>
            <strong>[TODO — Operator / Fleet Owner Legal Name]</strong>
            <br />
            <strong>[TODO — Registered address]</strong>
            <br />
            Email: <strong>[TODO — operator email]</strong>
            <br />
            Information Officer:{" "}
            <strong>[TODO — name of Information Officer registered with the Information Regulator]</strong>
            <br />
            Information Officer email:{" "}
            <strong>[TODO — info-officer@yourcompany.co.za]</strong>
          </p>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">
            2. What personal information we collect
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Identity</strong>: full name, driver&apos;s licence
              number, licence expiry date.
            </li>
            <li>
              <strong>Contact</strong>: email address, phone number.
            </li>
            <li>
              <strong>Financial</strong>: bank account number for payouts (encrypted at rest).
            </li>
            <li>
              <strong>Vehicle &amp; trip records</strong>: vehicle assignments,
              fuel purchases, contract trips, odometer readings, locations
              (areas served), and dates/times of trips.
            </li>
            <li>
              <strong>Account &amp; access</strong>: email used for login,
              password (hashed), session timestamps, audit logs of changes you
              make to records.
            </li>
            <li>
              <strong>Receipts &amp; invoice images</strong>: photographs of
              fuel receipts and maintenance invoices you upload, which may
              themselves contain personal information (vehicle registration,
              attendant name, driver signature).
            </li>
          </ul>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">
            3. Why we collect it (purpose)
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Operating the fleet management service you signed up for.</li>
            <li>Recording fuel purchases, trips, maintenance and payouts.</li>
            <li>
              Generating contract invoices for clients of the fleet you work
              with.
            </li>
            <li>Calculating driver commissions and processing payouts.</li>
            <li>
              Sending operational notifications (service reminders, licence
              expiry warnings) where you have opted in.
            </li>
            <li>Meeting legal and tax record-keeping obligations (5 years for SARS).</li>
          </ul>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">
            4. Legal basis
          </h2>
          <p>
            We process your personal information based on (a) your{" "}
            <strong>consent</strong> obtained when you accept your invitation,
            and (b) the{" "}
            <strong>performance of a contract</strong> between you and the
            fleet operator. You may withdraw consent at any time by contacting
            the Information Officer above; withdrawal will not affect lawful
            processing carried out before the withdrawal.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">
            5. Who we share it with (operators)
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Supabase Inc.</strong> — database and authentication
              hosting. Data is stored in the European Union (Ireland,
              eu-west-1).
            </li>
            <li>
              <strong>Anthropic PBC</strong> — AI extraction of fields from
              uploaded fuel receipts and maintenance invoices. The image is
              sent to Anthropic&apos;s API and is not used to train models.
            </li>
            <li>
              <strong>Google LLC</strong> — Places Autocomplete API for
              suggesting trip area names. Only the typed query is sent; no
              personal information is forwarded.
            </li>
            <li>
              <strong>Netlify Inc.</strong> — static hosting and edge routing
              for the web application.
            </li>
            <li>
              <strong>The fleet operator</strong> (your employer or contractor)
              — has full read access to your records and is the responsible
              party for them.
            </li>
          </ul>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">
            6. Cross-border transfer
          </h2>
          <p>
            Some of the operators above process your personal information
            outside South Africa (Supabase in the European Union, Anthropic and
            Google in the United States). Under POPIA §72, transfers to the
            European Union are permitted because the EU&apos;s GDPR provides an
            adequate level of protection. Transfers to the United States are
            covered by Anthropic and Google&apos;s contractual data processing
            addenda, which incorporate the EU Standard Contractual Clauses.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">
            7. How we protect your information
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>TLS 1.2+ in transit, HSTS enforced.</li>
            <li>
              Database row-level security (RLS) restricts every record to
              authorised callers within your fleet only.
            </li>
            <li>
              Bank account numbers are encrypted at rest using AES-256 with a
              key held in Supabase Vault, never in application code.
            </li>
            <li>
              All changes to records are recorded in an audit log accessible
              only to fleet owners and admins.
            </li>
            <li>Strict Content-Security-Policy and X-Frame-Options on all pages.</li>
          </ul>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">
            8. How long we keep it (retention)
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Driver records</strong>: retained while you are
              associated with a fleet, then either anonymised on request or
              automatically anonymised 12 months after archival.
            </li>
            <li>
              <strong>Financial records</strong> (invoices, payouts, fuel
              logs): retained for 5 years to meet South African Revenue
              Service requirements.
            </li>
            <li>
              <strong>Audit logs</strong>: retained for up to 7 years.
            </li>
            <li>
              <strong>Authentication sessions</strong>: 1 hour idle, 7 days
              maximum.
            </li>
          </ul>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">
            9. Your rights as a data subject
          </h2>
          <p>You have the right, under POPIA, to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Access</strong> the personal information we hold about
              you (POPIA §23).
            </li>
            <li>
              <strong>Correct</strong> any inaccurate or incomplete information
              (POPIA §24).
            </li>
            <li>
              <strong>Object</strong> to processing on reasonable grounds
              (POPIA §11(3)).
            </li>
            <li>
              <strong>Withdraw consent</strong> at any time without affecting
              the lawfulness of processing already carried out.
            </li>
            <li>
              <strong>Request deletion / anonymisation</strong> of your
              personal information once you no longer use the service (POPIA
              §24(1)(b)). The driver row is retained for accounting integrity
              but every personal field — including bank account, licence and
              contact details — is permanently scrubbed from both the live
              database and the audit history.
            </li>
            <li>
              <strong>Lodge a complaint</strong> with the Information
              Regulator if you believe your rights have been infringed:
              <br />
              Information Regulator (South Africa)
              <br />
              JD House, 27 Stiemens Street, Braamfontein, Johannesburg
              <br />
              complaints.IR@justice.gov.za
            </li>
          </ul>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">
            10. Contact
          </h2>
          <p>
            For any questions about this notice, or to exercise any of the
            rights above, contact the Information Officer at{" "}
            <strong>[TODO — info-officer@yourcompany.co.za]</strong>.
          </p>

          <hr className="my-8" />
          <p className="text-xs text-muted-foreground">
            This notice is a starting template. The &quot;TODO&quot; placeholders must
            be completed by the operator before the platform processes real
            driver data in production. The Information Officer must be
            registered with the Information Regulator under POPIA §55.
          </p>
        </div>
      </div>
    </div>
  );
}
