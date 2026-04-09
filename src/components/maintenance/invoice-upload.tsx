"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { UploadIcon, FileIcon, CheckCircleIcon } from "lucide-react"
import type { LineItem } from "./line-items-editor"

interface InvoiceUploadProps {
  onLineItemsParsed: (items: LineItem[]) => void
  onInvoiceUrl: (url: string) => void
}

type UploadState = "idle" | "uploading" | "parsing" | "done" | "error"

export function InvoiceUpload({
  onLineItemsParsed,
  onInvoiceUrl,
}: InvoiceUploadProps) {
  const [state, setState] = React.useState<UploadState>("idle")
  const [progress, setProgress] = React.useState(0)
  const [fileName, setFileName] = React.useState<string | null>(null)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [dragOver, setDragOver] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const acceptedTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf",
  ]

  async function handleFile(file: File) {
    if (!acceptedTypes.includes(file.type)) {
      setErrorMsg("Please upload a JPEG, PNG, or PDF file.")
      return
    }

    setFileName(file.name)
    setErrorMsg(null)
    setState("uploading")
    setProgress(0)

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    try {
      const supabase = createClient()
      const formData = new FormData()
      formData.append("file", file)

      const { data, error } = await supabase.functions.invoke(
        "fleet-invoice-upload",
        { body: formData }
      )

      clearInterval(progressInterval)

      if (error) {
        throw error
      }

      setProgress(100)
      setState("parsing")

      // The edge function returns parsed line items and the file URL
      const invoiceUrl = data?.invoice_url as string | undefined
      const parsedItems = data?.line_items as Array<{
        description: string
        item_type: string
        quantity: number
        unit_cost: number
      }> | undefined

      if (invoiceUrl) {
        onInvoiceUrl(invoiceUrl)
      }

      if (parsedItems && parsedItems.length > 0) {
        const lineItems: LineItem[] = parsedItems.map((item) => ({
          id: crypto.randomUUID(),
          description: item.description || "",
          item_type: (item.item_type || "other") as LineItem["item_type"],
          quantity: item.quantity || 1,
          unit_cost: item.unit_cost || 0,
        }))
        onLineItemsParsed(lineItems)
      }

      setState("done")
    } catch (err) {
      clearInterval(progressInterval)
      setState("error")
      setErrorMsg(
        err instanceof Error ? err.message : "Upload failed. Please try again."
      )
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Invoice Upload</h3>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click()
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-slate-300 hover:border-slate-400"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          className="hidden"
          onChange={handleInputChange}
        />

        {state === "idle" && (
          <>
            <UploadIcon className="size-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                Drop invoice here or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPEG, PNG, or PDF
              </p>
            </div>
          </>
        )}

        {state === "uploading" && (
          <>
            <FileIcon className="size-8 text-muted-foreground" />
            <p className="text-sm">{fileName}</p>
            <div className="w-full max-w-xs bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Uploading... {progress}%
            </p>
          </>
        )}

        {state === "parsing" && (
          <>
            <FileIcon className="size-8 text-primary" />
            <p className="text-sm font-medium">{fileName}</p>
            <div className="w-full space-y-2 mt-2">
              <p className="text-xs text-muted-foreground">
                AI parsing invoice...
              </p>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </>
        )}

        {state === "done" && (
          <>
            <CheckCircleIcon className="size-8 text-green-600" />
            <p className="text-sm font-medium">{fileName}</p>
            <p className="text-xs text-green-600">
              Invoice parsed successfully
            </p>
          </>
        )}

        {state === "error" && (
          <>
            <UploadIcon className="size-8 text-destructive" />
            <p className="text-sm text-destructive">{errorMsg}</p>
            <p className="text-xs text-muted-foreground">
              Click to try again
            </p>
          </>
        )}
      </div>
    </div>
  )
}
