"use client";

import { useState } from "react";
import { Download, FileImage, FileText } from "lucide-react";
import type { PractitionerDocument } from "@/types/document";
import { DocumentViewer } from "./DocumentViewer";

const uploadedOn = (iso: string) => {
  const day = new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return iso.length > 10 ? `${day}, ${iso.slice(11, 16)}` : day;
};

/**
 * The verification documents a practitioner has uploaded, newest first, each with what the file really is
 * (category, type, size, upload time). Shared by the practitioner page and the credentials review.
 */
export function DocumentList({ documents, personName }: { documents: PractitionerDocument[]; personName: string }) {
  const [viewDoc, setViewDoc] = useState<PractitionerDocument | null>(null);
  const sorted = [...documents].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

  if (sorted.length === 0) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center" }}>
        <div style={{ fontWeight: 600, fontSize: 14.5 }}>No documents uploaded</div>
        <div className="subtle" style={{ marginTop: 4, fontSize: 13 }}>Credential documents appear here once {personName} uploads them.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ boxShadow: "0 0 0 1px var(--ml-ring)", borderRadius: 12, overflow: "hidden" }}>
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Category</th>
                <th>Uploaded</th>
                <th style={{ textAlign: "right", paddingRight: 20 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((d) => {
                const Icon = d.contentType?.startsWith("image/") ? FileImage : FileText;
                return (
                  <tr key={d.id} style={{ cursor: "default" }}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <span className="kpi-icon" style={{ width: 36, height: 36, borderRadius: 10 }}><Icon size={16} /></span>
                        <span className="truncate" style={{ fontWeight: 500, color: "var(--ml-ink)", maxWidth: 280 }}>{d.name}</span>
                      </div>
                    </td>
                    <td>{d.category}</td>
                    <td className="tnum" style={{ whiteSpace: "nowrap" }}>{uploadedOn(d.uploadedAt)}</td>
                    <td style={{ textAlign: "right", paddingRight: 20 }}>
                      <span style={{ display: "inline-flex", gap: 8 }}>
                        {d.hasFile ? (
                          <>
                            <button className="btn btn-sm btn-primary" onClick={() => setViewDoc(d)}>View</button>
                            <a className="btn btn-sm" href={`/documents/${d.id}?download=1`} title={`Download ${d.name}`} aria-label={`Download ${d.name}`} style={{ padding: 0, width: 32 }}><Download size={15} /></a>
                          </>
                        ) : (
                          // Always the same two actions; with no file stored there is nothing to open, so both are off.
                          <>
                            <button className="btn btn-sm btn-primary" disabled title="No file is stored for this record">View</button>
                            <button className="btn btn-sm" disabled title="No file is stored for this record" aria-label="Download unavailable" style={{ padding: 0, width: 32 }}><Download size={15} /></button>
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <DocumentViewer docs={sorted.filter((d) => d.hasFile)} active={viewDoc} onSelect={setViewDoc} onClose={() => setViewDoc(null)} personName={personName} />
    </div>
  );
}
