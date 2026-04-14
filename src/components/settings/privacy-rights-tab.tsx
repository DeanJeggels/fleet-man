"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Download, ExternalLink, Mail, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * POPI Act §23 (right of access) + §24 (right to correction) + §11(2)(b)
 * (right to withdraw consent). Surfaced inside the app for ALL users —
 * drivers, members and owners — so personal information rights are
 * exercisable without an email round-trip.
 */
export function PrivacyRightsTab() {
  const [exporting, setExporting] = useState(false);

  async function handleExportMyData() {
    setExporting(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("export_my_personal_data");
      if (error) {
        console.error("[export-my-data]", error);
        toast.error("Failed to export your data. Please try again.");
        return;
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fleet-manager-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Your data has been downloaded.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your privacy rights (POPIA)</CardTitle>
          <CardDescription>
            Under the Protection of Personal Information Act, you have the
            following rights as a data subject. Use the actions below to
            exercise them. For full details see the{" "}
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#3B82F6] underline"
            >
              Privacy Notice
            </Link>
            .
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Right of access (§23)</CardTitle>
          <CardDescription>
            Download a copy of every piece of personal information we hold
            about you — your profile, driver record (if applicable), vehicle
            assignment history, fuel logs, contract trips and payouts.
            Returned as a JSON file you can save or share with anyone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleExportMyData}
            disabled={exporting}
            className="cursor-pointer"
          >
            {exporting ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-1.5 h-4 w-4" />
            )}
            {exporting ? "Preparing..." : "Download My Data"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Right to correction (§24)</CardTitle>
          <CardDescription>
            If any personal information about you is inaccurate, contact your
            fleet owner directly to have it corrected. Drivers can ask their
            fleet owner to update licence numbers, contact details, banking
            information or vehicle assignments at any time.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Right to withdraw consent &amp; deletion (§11 / §24)
          </CardTitle>
          <CardDescription>
            You may withdraw your POPIA consent at any time. To request
            anonymisation of your personal information — your name, contact
            details, licence and bank account are permanently scrubbed,
            including from historical audit logs — contact the Information
            Officer at the email address in the{" "}
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#3B82F6] underline"
            >
              Privacy Notice
            </Link>
            . Note that financial records (payouts, invoices) may be retained
            for up to 5 years to meet SARS obligations even after
            anonymisation.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Right to lodge a complaint
          </CardTitle>
          <CardDescription>
            If you believe your rights under POPIA have been infringed and the
            Information Officer has not resolved your concern, you may lodge a
            complaint with the Information Regulator (South Africa).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>Information Regulator</strong>
            <br />
            JD House, 27 Stiemens Street
            <br />
            Braamfontein, Johannesburg 2001
          </p>
          <a
            href="mailto:complaints.IR@justice.gov.za"
            className="inline-flex items-center gap-1.5 text-[#3B82F6] hover:underline"
          >
            <Mail className="h-3.5 w-3.5" />
            complaints.IR@justice.gov.za
          </a>
          <a
            href="https://inforegulator.org.za/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[#3B82F6] hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            inforegulator.org.za
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
