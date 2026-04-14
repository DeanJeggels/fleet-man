"use client"

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { format, parseISO } from "date-fns"
import type { ContractInvoice, ContractTrip, ContractClient, FleetSettings } from "@/types/database"

const zar = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", lineHeight: 1.4 },
  company: { fontSize: 18, color: "#2563eb", marginBottom: 4, fontFamily: "Helvetica-Bold" },
  // @react-pdf/renderer built-in fonts don't include italic variants,
  // so use color + fontFamily for visual distinction instead of fontStyle.
  companyMeta: { fontSize: 9, color: "#666" },
  spacer: { height: 14 },
  boldHead: { fontFamily: "Helvetica-Bold", fontSize: 10, marginBottom: 2 },
  toBlock: { fontFamily: "Helvetica-Bold", fontSize: 13, color: "#2563eb" },
  meta: { fontSize: 9, marginTop: 2, color: "#555" },
  table: { marginTop: 14, borderWidth: 1, borderColor: "#000" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#000", minHeight: 18 },
  headerRow: { backgroundColor: "#f5f5f5", fontFamily: "Helvetica-Bold" },
  cellNo: { width: 28, padding: 4, borderRightWidth: 1, borderColor: "#000", textAlign: "center" },
  cellDate: { width: 64, padding: 4, borderRightWidth: 1, borderColor: "#000" },
  cellTime: { width: 44, padding: 4, borderRightWidth: 1, borderColor: "#000" },
  cellCompany: { width: 60, padding: 4, borderRightWidth: 1, borderColor: "#000" },
  cellArea: { flex: 1, padding: 4, borderRightWidth: 1, borderColor: "#000" },
  cellPax: { width: 36, padding: 4, borderRightWidth: 1, borderColor: "#000", textAlign: "right" },
  cellAmount: { width: 70, padding: 4, textAlign: "right" },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 0 },
  totalCell: { width: 70, padding: 6, borderWidth: 1, borderTopWidth: 0, borderColor: "#000", textAlign: "right", fontFamily: "Helvetica-Bold" },
  totalLabel: { padding: 6, textAlign: "right", fontFamily: "Helvetica-Bold" },
  bankingTitle: { fontFamily: "Helvetica-Bold", marginTop: 30, marginBottom: 6, textDecoration: "underline" },
  bankingBox: { borderWidth: 1, borderColor: "#000", padding: 8, width: 240 },
  thanks: { marginTop: 18, fontFamily: "Helvetica-Bold" },
})

interface InvoicePDFProps {
  invoice: ContractInvoice
  client: ContractClient
  trips: ContractTrip[]
  settings: FleetSettings | null
}

function fmtDate(s: string | null): string {
  if (!s) return ""
  try {
    return format(parseISO(s), "dd.MM.yyyy")
  } catch {
    return s
  }
}

function fmtTime(s: string | null): string {
  if (!s) return ""
  // Convert HH:MM or HH:MM:SS to "HHhMM"
  const match = s.match(/^(\d{2}):(\d{2})/)
  if (match) return `${match[1]}h${match[2]}`
  return s
}

export function InvoicePDF({ invoice, client, trips, settings }: InvoicePDFProps) {
  const companyName = settings?.company_name ?? "Fleet Company"
  const companyAddress = settings?.company_address_line
  const companyCityLine = [settings?.company_city, settings?.company_province, settings?.company_postal_code]
    .filter(Boolean)
    .join(", ")
  const companyContact = [settings?.company_phone, settings?.company_email].filter(Boolean).join(" / ")

  // VAT snapshot lives on the invoice (not pulled live from settings) so
  // historical invoices stay accurate if the operator changes settings later.
  // Existing pre-VAT invoices have vat_registered_snapshot=false and render
  // exactly as before — no behaviour change.
  const inv = invoice as ContractInvoice & {
    vat_registered_snapshot?: boolean
    vat_registration_number_snapshot?: string | null
    vat_rate_snapshot?: number | null
    vat_amount?: number | null
    subtotal_excl_vat?: number | null
  }
  const isTaxInvoice = Boolean(inv.vat_registered_snapshot)
  const vatRate = Number(inv.vat_rate_snapshot ?? 0.15)
  const vatRatePct = Math.round(vatRate * 100)
  const subtotalExcl = Number(inv.subtotal_excl_vat ?? invoice.total)
  const vatAmount = Number(inv.vat_amount ?? 0)
  const vatNumber = inv.vat_registration_number_snapshot ?? null

  const docTitle = isTaxInvoice ? "TAX INVOICE" : "INVOICE"
  const periodLabel = `Service from ${fmtDate(invoice.service_period_start)} - ${fmtDate(invoice.service_period_end)}`

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <Text style={styles.company}>{companyName}</Text>
        {companyAddress && <Text style={styles.companyMeta}>{companyAddress}</Text>}
        {companyCityLine && <Text style={styles.companyMeta}>{companyCityLine}</Text>}
        {companyContact && <Text style={styles.companyMeta}>{companyContact}</Text>}
        {isTaxInvoice && vatNumber && (
          <Text style={styles.companyMeta}>VAT Reg: {vatNumber}</Text>
        )}

        <View style={styles.spacer} />

        <Text style={[styles.boldHead, { fontSize: 14 }]}>{docTitle}</Text>
        <Text style={styles.boldHead}>{periodLabel}</Text>
        <View style={styles.spacer} />

        <Text style={styles.boldHead}>{isTaxInvoice ? "TAX INVOICE TO:" : "INVOICE TO:"}</Text>
        <Text style={styles.toBlock}>{client.name}</Text>
        {client.address_line && <Text>{client.address_line}</Text>}
        {(client.city || client.province || client.postal_code) && (
          <Text>{[client.city, client.province, client.postal_code].filter(Boolean).join(", ")}</Text>
        )}
        {client.phone && <Text>{client.phone}</Text>}

        <View style={styles.spacer} />
        <Text style={styles.meta}>Invoice No: {invoice.invoice_number}</Text>
        <Text style={styles.meta}>Invoice Date: {fmtDate(invoice.invoice_date)}</Text>
        <Text style={[styles.meta, { fontFamily: "Helvetica-Bold", textDecoration: "underline" }]}>
          DRIVER: {invoice.driver_name_snapshot ?? ""} {invoice.vehicle_registration_snapshot ?? ""}
        </Text>

        {/* Trips table */}
        <View style={styles.table}>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={styles.cellNo}>N0.</Text>
            <Text style={styles.cellDate}>DATE</Text>
            <Text style={styles.cellTime}>TIME</Text>
            <Text style={styles.cellCompany}>Company</Text>
            <Text style={styles.cellArea}>Areas</Text>
            <Text style={styles.cellPax}>Pax</Text>
            <Text style={styles.cellAmount}>AMOUNT</Text>
          </View>
          {trips.map((t, i) => (
            <View key={t.id} style={styles.row}>
              <Text style={styles.cellNo}>{i + 1}</Text>
              <Text style={styles.cellDate}>{fmtDate(t.trip_date)}</Text>
              <Text style={styles.cellTime}>{fmtTime(t.trip_time)}</Text>
              <Text style={styles.cellCompany}>{t.company_label ?? ""}</Text>
              <Text style={styles.cellArea}>{t.area}</Text>
              <Text style={styles.cellPax}>{t.pax ?? ""}</Text>
              <Text style={styles.cellAmount}>R{Math.round(Number(t.amount))}</Text>
            </View>
          ))}
        </View>

        {/* Total */}
        {isTaxInvoice ? (
          <>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal (excl VAT):</Text>
              <Text style={styles.totalCell}>{zar.format(subtotalExcl)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>VAT @ {vatRatePct}%:</Text>
              <Text style={styles.totalCell}>{zar.format(vatAmount)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total (incl VAT):</Text>
              <Text style={styles.totalCell}>{zar.format(Number(invoice.total))}</Text>
            </View>
          </>
        ) : (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}></Text>
            <Text style={styles.totalCell}>{zar.format(Number(invoice.total))}</Text>
          </View>
        )}

        {/* Banking details */}
        <Text style={styles.bankingTitle}>BANKING DETAILS</Text>
        <View style={styles.bankingBox}>
          {invoice.bank_account_holder && <Text>{invoice.bank_account_holder}</Text>}
          {(invoice.bank_name || invoice.bank_account_type) && (
            <Text>{[invoice.bank_name, invoice.bank_account_type].filter(Boolean).join(" ")}</Text>
          )}
          {invoice.bank_account_number && <Text>ACC: {invoice.bank_account_number}</Text>}
          {invoice.bank_branch_code && <Text>BRANCH CODE: {invoice.bank_branch_code}</Text>}
        </View>

        <Text style={styles.thanks}>Thank You</Text>
      </Page>
    </Document>
  )
}
