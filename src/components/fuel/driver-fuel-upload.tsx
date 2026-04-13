"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { extractFunctionError } from "@/lib/supabase/extract-function-error";
import { useFleet } from "@/contexts/fleet-context";
import { toast } from "sonner";
import { Camera, CheckCircle2, Loader2, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Vehicle } from "@/types/database";

interface ParsedFuelReceipt {
  vehicle_registration: string | null;
  total_amount: number | null;
  odometer_reading: number | null;
  litres: number | null;
  date: string | null;
  fuel_type: string | null;
  station_name: string | null;
  confidence: number | null;
}

type UploadState = "idle" | "uploading" | "parsing" | "confirm" | "saving" | "saved";

interface DriverFuelUploadProps {
  onSaved?: () => void;
}

function normaliseReg(r: string | null | undefined): string {
  return (r ?? "").replace(/[\s-]/g, "").toUpperCase();
}

function mondayOf(dateStr: string | null): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

export function DriverFuelUpload({ onSaved }: DriverFuelUploadProps) {
  const supabase = createClient();
  const { fleetId, driverId } = useFleet();

  const [state, setState] = useState<UploadState>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [assignedVehicle, setAssignedVehicle] = useState<Vehicle | null>(null);

  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedFuelReceipt | null>(null);
  const [registration, setRegistration] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [odometer, setOdometer] = useState("");
  const [receiptDate, setReceiptDate] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!fleetId || !driverId) return;
    async function loadAssignedVehicle() {
      const { data } = await supabase
        .from("vehicle_driver_assignments")
        .select("vehicle:vehicles(*)")
        .eq("driver_id", driverId!)
        .eq("fleet_id", fleetId!)
        .is("unassigned_at", null)
        .maybeSingle();
      const vehicle = (data?.vehicle as unknown as Vehicle) ?? null;
      setAssignedVehicle(vehicle);
    }
    loadAssignedVehicle();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fleetId, driverId]);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select an image file.");
      return;
    }
    setFileName(file.name);
    setErrorMsg(null);
    setState("uploading");

    try {
      const formData = new FormData();
      formData.append("file", file);

      setState("parsing");
      const { data, error } = await supabase.functions.invoke(
        "fleet-fuel-receipt-upload",
        { body: formData }
      );

      if (error || (data && data.error)) {
        const msg = await extractFunctionError(error, data);
        throw new Error(msg);
      }

      const url = (data?.receipt_url as string) || null;
      const parsedData = (data?.parsed as ParsedFuelReceipt) || null;

      setReceiptUrl(url);
      setParsed(parsedData);
      setRegistration(parsedData?.vehicle_registration ?? "");
      setTotalAmount(
        parsedData?.total_amount != null ? String(parsedData.total_amount) : ""
      );
      setOdometer(
        parsedData?.odometer_reading != null ? String(parsedData.odometer_reading) : ""
      );
      setReceiptDate(parsedData?.date ?? new Date().toISOString().slice(0, 10));
      setState("confirm");
    } catch (err) {
      console.error(err);
      setState("idle");
      setErrorMsg(err instanceof Error ? err.message : "Upload failed.");
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  async function handleConfirm() {
    if (!fleetId || !driverId) {
      toast.error("Driver context not loaded.");
      return;
    }
    if (!assignedVehicle) {
      toast.error("No vehicle assigned to you. Ask your fleet owner to assign one.");
      return;
    }

    const total = Number(totalAmount);
    if (!isFinite(total) || total <= 0) {
      toast.error("Total amount must be a positive number.");
      return;
    }
    const odo = odometer ? Number(odometer) : null;
    if (odo !== null && (!isFinite(odo) || odo < 0)) {
      toast.error("Odometer must be a valid non-negative number.");
      return;
    }

    // Sanity check registration against assigned vehicle
    if (
      registration &&
      normaliseReg(registration) !== normaliseReg(assignedVehicle.registration)
    ) {
      const ok = window.confirm(
        `Receipt registration "${registration}" doesn't match your assigned vehicle "${assignedVehicle.registration}". Save anyway?`
      );
      if (!ok) return;
    }

    setState("saving");

    const { error } = await supabase.from("fuel_logs").insert({
      fleet_id: fleetId,
      vehicle_id: assignedVehicle.id,
      driver_id: driverId,
      week_starting: mondayOf(receiptDate),
      litres: parsed?.litres ?? null,
      cost: total,
      odometer_reading: odo,
      receipt_url: receiptUrl,
      ai_parse_confidence: parsed?.confidence ?? null,
    });

    if (error) {
      console.error(error);
      setState("confirm");
      toast.error("Could not save fuel log. Please try again.");
      return;
    }

    setState("saved");
    toast.success("Fuel log saved.");
    onSaved?.();
  }

  function reset() {
    setState("idle");
    setFileName(null);
    setReceiptUrl(null);
    setParsed(null);
    setRegistration("");
    setTotalAmount("");
    setOdometer("");
    setReceiptDate("");
    setErrorMsg(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="size-5" />
          Log Fuel Receipt
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {assignedVehicle ? (
          <p className="text-xs text-muted-foreground">
            Assigned vehicle: <span className="font-medium">{assignedVehicle.registration}</span>{" "}
            ({assignedVehicle.make} {assignedVehicle.model})
          </p>
        ) : (
          <p className="text-xs text-destructive">
            No vehicle assigned to you yet. Contact your fleet owner.
          </p>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleInputChange}
        />

        {(state === "idle" || state === "uploading" || state === "parsing") && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
            className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-slate-300 p-8 text-center cursor-pointer hover:border-slate-400"
          >
            {state === "idle" && (
              <>
                <UploadIcon className="size-10 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Tap to take a photo</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    AI will extract the total, odometer and registration
                  </p>
                </div>
              </>
            )}
            {state === "uploading" && (
              <>
                <Loader2 className="size-10 animate-spin text-muted-foreground" />
                <p className="text-sm">Uploading {fileName}...</p>
              </>
            )}
            {state === "parsing" && (
              <div className="w-full space-y-3">
                <Loader2 className="size-10 animate-spin text-primary mx-auto" />
                <p className="text-sm text-center">AI reading your receipt...</p>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            )}
            {errorMsg && (
              <p className="text-xs text-destructive">{errorMsg}</p>
            )}
          </div>
        )}

        {state === "confirm" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Confirm the details we extracted. Edit if anything is wrong.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Registration</Label>
                <Input
                  value={registration}
                  onChange={(e) => setRegistration(e.target.value)}
                  placeholder={assignedVehicle?.registration ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Total Amount (ZAR) *</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Odometer (km)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                />
              </div>
            </div>
            {parsed?.confidence != null && (
              <p className="text-xs text-muted-foreground">
                AI confidence: {Math.round((parsed.confidence ?? 0) * 100)}%
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={reset} className="cursor-pointer">
                Retake
              </Button>
              <Button onClick={handleConfirm} className="flex-1 cursor-pointer">
                Save Fuel Log
              </Button>
            </div>
          </div>
        )}

        {state === "saving" && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Saving...
          </div>
        )}

        {state === "saved" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 className="size-10 text-green-600" />
            <p className="text-sm font-medium">Fuel log saved.</p>
            <Button onClick={reset} className="cursor-pointer">
              Log Another
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
