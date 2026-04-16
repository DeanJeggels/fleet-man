import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Terms of Service / Service Agreement template.
// Operator details populated from CH-ISE (Pty) Ltd CIPC registration
// (2025/332098/07) and Information Regulator K2 certificate (2026-008754).
// Consider having a South African attorney review the final language for
// compliance with the Consumer Protection Act 68 of 2008 (CPA), Electronic
// Communications and Transactions Act 25 of 2002 (ECTA), and any
// sector-specific obligations.

const LAST_UPDATED = "14 April 2026";

export const metadata = {
  title: "Terms of Service — Fleet Manager",
  description:
    "Terms of Service governing your use of the Fleet Manager platform.",
};

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="prose prose-slate mt-8 max-w-none text-sm text-slate-700">
          <p>
            These Terms of Service (&quot;Terms&quot;) govern your access to
            and use of the Fleet Manager platform (the &quot;Service&quot;)
            operated by{" "}
            <strong>CH-ISE (Pty) Ltd</strong> (&quot;we&quot;,
            &quot;us&quot;). By creating an account, accepting an invitation,
            or using the Service, you agree to be bound by these Terms.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">
            1. Definitions
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Fleet Owner</strong> — the person or entity that signs
              up to manage a fleet on the Service.
            </li>
            <li>
              <strong>Driver</strong> — a person invited by a Fleet Owner to
              log fuel receipts and contract trips against vehicles in their
              fleet.
            </li>
            <li>
              <strong>User</strong> — any natural person with a Fleet Manager
              account, regardless of role.
            </li>
            <li>
              <strong>Personal Information</strong> — has the meaning given
              to it in the Protection of Personal Information Act, 2013
              (POPIA).
            </li>
          </ul>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">
            2. Eligibility &amp; account creation
          </h2>
          <p>
            You must be at least 18 years old to use the Service. Accounts are
            invite-only — you cannot self-register. By accepting an invitation
            you confirm you are authorised to provide the personal
            information requested and that the information is accurate and
            current.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">
            3. Acceptable use
          </h2>
          <p>You agree NOT to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Use the Service for any unlawful purpose.</li>
            <li>
              Attempt to access data belonging to other fleets or other users.
            </li>
            <li>
              Reverse engineer, decompile, or attempt to extract source code
              from the Service.
            </li>
            <li>
              Upload content that contains malware, infringes third-party
              rights, or contains personal information about persons who have
              not consented to its processing.
            </li>
            <li>
              Use the Service to harass, defame, or harm any other person.
            </li>
          </ul>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">
            4. Fleet Owner responsibilities
          </h2>
          <p>
            If you are a Fleet Owner, you act as the &quot;responsible
            party&quot; under POPIA in respect of personal information about
            your drivers, contract clients and suppliers. You agree:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              To obtain valid POPIA consent from each driver before adding
              their personal information to the platform.
            </li>
            <li>
              To register an Information Officer with the Information
              Regulator and publish a privacy notice describing your
              processing.
            </li>
            <li>
              To respond to data subject requests (access, correction,
              deletion) within the time periods required by POPIA.
            </li>
            <li>
              To use the platform in compliance with all applicable South
              African laws including SARS tax invoice requirements (VAT Act
              §20) and labour law.
            </li>
          </ul>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">
            5. Driver responsibilities
          </h2>
          <p>
            If you are a Driver, you agree to provide accurate trip and fuel
            information, to use the Service only on vehicles you are
            authorised to operate, and to keep your login credentials
            confidential.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">
            6. Privacy
          </h2>
          <p>
            Our processing of personal information is described in the{" "}
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#3B82F6] underline"
            >
              Privacy Notice
            </Link>
            , which forms part of these Terms.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">
            7. Intellectual property
          </h2>
          <p>
            All software, designs, logos and content forming part of the
            Service are owned by{" "}
            <strong>CH-ISE (Pty) Ltd</strong> or its licensors.
            Nothing in these Terms grants you any right or licence other than
            the limited right to use the Service in accordance with these
            Terms.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">
            8. Disclaimers
          </h2>
          <p>
            The Service is provided &quot;as is&quot; without warranty of any
            kind. We do not warrant that the Service will be uninterrupted,
            error-free, or free from third-party interference. AI-extracted
            data from receipts and invoices is provided as a convenience —
            you remain responsible for verifying the accuracy of every
            extracted field before using it for any financial or legal
            purpose.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">
            9. Limitation of liability
          </h2>
          <p>
            To the maximum extent permitted by law, our aggregate liability
            arising out of or relating to your use of the Service shall not
            exceed the fees paid by you for the Service in the twelve months
            preceding the event giving rise to the claim. Nothing in these
            Terms excludes liability for death, personal injury caused by
            negligence, fraud, or any other liability that cannot lawfully be
            excluded under the Consumer Protection Act 68 of 2008.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">
            10. Termination
          </h2>
          <p>
            We may suspend or terminate your access to the Service at any
            time for breach of these Terms or for any other reason on
            reasonable notice. You may close your account at any time by
            contacting your Fleet Owner (if you are a Driver) or the
            Information Officer (if you are a Fleet Owner).
          </p>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">
            11. Changes to these Terms
          </h2>
          <p>
            We may update these Terms from time to time. Material changes
            will be notified by email or in-app notice at least 14 days
            before they take effect. Continued use of the Service after the
            effective date constitutes acceptance.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">
            12. Governing law &amp; dispute resolution
          </h2>
          <p>
            These Terms are governed by the laws of the Republic of South
            Africa. Any dispute arising from these Terms shall first be
            referred to good-faith negotiation between the parties, then to
            mediation, and only failing that to the courts of the Republic of
            South Africa.
          </p>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">
            13. Contact
          </h2>
          <p>
            <strong>CH-ISE (Pty) Ltd</strong>
            <br />
            Reg. 2025/332098/07
            <br />
            15 Daggeraad Street, Jeffreys Bay, Eastern Cape, 6330
            <br />
            Email:{" "}
            <a href="mailto:dean@ch-ise.co.za" className="text-[#3B82F6] underline">
              dean@ch-ise.co.za
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
