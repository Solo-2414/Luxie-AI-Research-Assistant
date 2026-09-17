"use client"

import { Clipboard, Download, FileText, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ExportFooterProps {
  paperCount: number
  status: string | null
  disabled: boolean
  onExport: (format: string) => void
}

const FORMATS = ["APA", "MLA", "Chicago"]

export function ExportFooter({ paperCount, status, disabled, onExport }: ExportFooterProps) {
  return (
    <footer className="luxcie-fade-in sticky bottom-0 z-30 border-t border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-2.5">
        <p role="status" className="text-xs text-gray-500">
          {status ?? (disabled
            ? "No results to export"
            : `${paperCount} source${paperCount === 1 ? "" : "s"} ready to export`)}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                disabled={disabled}
                className="gap-1.5 border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              />
            }
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Citation style</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {FORMATS.map((format) => (
                <DropdownMenuItem key={format} onClick={() => onExport(format)}>
                  {format}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onExport("copy")}>
                <Clipboard className="h-4 w-4" aria-hidden="true" /> Copy to clipboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport("markdown")}>
                <FileText className="h-4 w-4" aria-hidden="true" /> Download Markdown
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport("print")}>
                <Printer className="h-4 w-4" aria-hidden="true" /> Print / Save PDF
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </footer>
  )
}
