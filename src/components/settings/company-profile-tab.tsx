"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useFleet } from "@/contexts/fleet-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function CompanyProfileTab() {
  const { fleetId } = useFleet()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [companyName, setCompanyName] = useState("")
  const [addressLine, setAddressLine] = useState("")
  const [city, setCity] = useState("")
  const [province, setProvince] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [bankHolder, setBankHolder] = useState("")
  const [bankName, setBankName] = useState("")
  const [bankAccountType, setBankAccountType] = useState("")
  const [bankAccountNumber, setBankAccountNumber] = useState("")
  const [bankBranchCode, setBankBranchCode] = useState("")

  useEffect(() => {
    if (!fleetId) return
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from("fleet_settings")
        .select("*")
        .eq("fleet_id", fleetId!)
        .single()

      if (data) {
        setCompanyName(data.company_name ?? "")
        setAddressLine(data.company_address_line ?? "")
        setCity(data.company_city ?? "")
        setProvince(data.company_province ?? "")
        setPostalCode(data.company_postal_code ?? "")
        setPhone(data.company_phone ?? "")
        setEmail(data.company_email ?? "")
        setBankHolder(data.bank_account_holder ?? "")
        setBankName(data.bank_name ?? "")
        setBankAccountType(data.bank_account_type ?? "")
        setBankAccountNumber(data.bank_account_number ?? "")
        setBankBranchCode(data.bank_branch_code ?? "")
      }
      setLoading(false)
    }
    load()
  }, [fleetId])

  async function handleSave() {
    if (!fleetId) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("fleet_settings")
      .update({
        company_name: companyName || null,
        company_address_line: addressLine || null,
        company_city: city || null,
        company_province: province || null,
        company_postal_code: postalCode || null,
        company_phone: phone || null,
        company_email: email || null,
        bank_account_holder: bankHolder || null,
        bank_name: bankName || null,
        bank_account_type: bankAccountType || null,
        bank_account_number: bankAccountNumber || null,
        bank_branch_code: bankBranchCode || null,
      })
      .eq("fleet_id", fleetId!)

    setSaving(false)
    if (error) {
      console.error(error)
      toast.error("Failed to save company profile.")
      return
    }
    toast.success("Company profile saved.")
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>
            Displayed in the header of every generated contract invoice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Company Name</Label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. MJ Capital Corporation"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              placeholder="e.g. 74 Selbourne Road, University Estate"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Province</Label>
              <Input value={province} onChange={(e) => setProvince(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Postal Code</Label>
              <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Banking Details</CardTitle>
          <CardDescription>
            Copied into every new invoice at creation. Each invoice can override its own banking details later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Account Holder</Label>
            <Input
              value={bankHolder}
              onChange={(e) => setBankHolder(e.target.value)}
              placeholder="e.g. MJ Capital Corporation (Pty) Ltd"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Bank Name</Label>
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. ABSA" />
            </div>
            <div className="space-y-1.5">
              <Label>Account Type</Label>
              <Input value={bankAccountType} onChange={(e) => setBankAccountType(e.target.value)} placeholder="e.g. Current Account" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Account Number</Label>
              <Input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Branch Code</Label>
              <Input value={bankBranchCode} onChange={(e) => setBankBranchCode(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="cursor-pointer">
          {saving ? "Saving..." : "Save Company Profile"}
        </Button>
      </div>
    </div>
  )
}
