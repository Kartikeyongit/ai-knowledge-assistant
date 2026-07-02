"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, Upload, Search, Trash2, File as FileIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header";
import { api, setAuthTokenGetter, type Document } from "@/lib/api";
import { formatBytes, formatDate } from "@/lib/utils";
import { useToast } from "@/lib/use-toast";

const fileIconMap: Record<string, string> = {
  pdf: "text-neutral-500 dark:text-neutral-400",
  md: "text-neutral-500 dark:text-neutral-400",
  txt: "text-neutral-500 dark:text-neutral-400",
  csv: "text-neutral-500 dark:text-neutral-400",
  json: "text-neutral-500 dark:text-neutral-400",
  xml: "text-neutral-500 dark:text-neutral-400",
  html: "text-neutral-500 dark:text-neutral-400",
};

function getDocIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return fileIconMap[ext] || "text-neutral-500 dark:text-neutral-400";
}

export default function DocumentsPage() {
  const { getToken } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadZoneRef = useRef<HTMLDivElement>(null);
  const { toasts, toast, removeToast } = useToast();

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);

  useEffect(() => {
    document.title = "Documents - AI Knowledge Assistant";
  }, []);

  const loadDocs = useCallback(async () => {
    try {
      const res = await api.documents.list();
      setDocuments(res.documents);
    } catch {
      toast("Failed to load documents. Check that the backend is running.", "error");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    try {
      await api.documents.upload(file, setUploadProgress);
      toast("Document uploaded successfully", "success");
      await loadDocs();
    } catch {
      toast("Upload failed. Make sure the backend is running.", "error");
    }
    setUploading(false);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const ACCEPTED_EXTS = ["pdf", "txt", "md", "csv", "json", "xml", "html"];

  const isAcceptedFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    return ACCEPTED_EXTS.includes(ext);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!isAcceptedFile(file)) {
      toast(`Unsupported file type. Accepted: ${ACCEPTED_EXTS.join(", ")}`, "error");
      return;
    }
    await handleUpload(file);
  };

  const handleDelete = async (id: string) => {
    setConfirmDelete(null);
    setDeleting(id);
    try {
      const doc = documents.find((d) => d.id === id);
      await api.documents.delete(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      toast(`"${doc?.title || "Document"}" deleted`, "success");
    } catch {
      toast("Delete failed.", "error");
    }
    setDeleting(null);
  };

  const acceptedTypes = ACCEPTED_EXTS.map((e) => `.${e}`).join(",");

  const filteredDocs = documents.filter((doc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(q) ||
      doc.filename.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        rightContent={
          <>
            <Link href="/chat"><Button variant="ghost" size="sm">Chat</Button></Link>
          </>
        }
      />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Documents</h1>
              <p className="text-sm text-neutral-500 mt-0.5">Upload and manage your knowledge base</p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedTypes}
                onChange={handleFileInput}
                className="hidden"
              />
              <div className="flex items-center gap-3">
                {uploading && (
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                      <div className="h-full rounded-full bg-neutral-500 dark:bg-neutral-400 transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <span className="text-xs text-neutral-500 w-8">{uploadProgress}%</span>
                  </div>
                )}
                <Button
                  variant="default"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="gap-2"
                >
                  <Upload className="size-4" />
                  {uploading ? "Uploading..." : "Upload Document"}
                </Button>
              </div>
            </div>
          </div>

          <div className={`relative mb-4 transition-opacity ${documents.length === 0 ? 'opacity-30 pointer-events-none' : ''}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400/50 dark:focus:ring-neutral-500/50 focus:border-neutral-400 dark:focus:border-neutral-500 transition-all placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
            />
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-neutral-200 dark:bg-neutral-700" />
                    <div className="space-y-2">
                      <div className="h-4 w-48 rounded bg-neutral-200 dark:bg-neutral-700" />
                      <div className="h-3 w-32 rounded bg-neutral-200 dark:bg-neutral-700" />
                    </div>
                  </div>
                  <div className="h-8 w-16 rounded-lg bg-neutral-200 dark:bg-neutral-700" />
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div
              ref={uploadZoneRef}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`relative text-center py-16 rounded-2xl border-2 border-dashed transition-all ${
                dragOver
                  ? "border-neutral-400 dark:border-neutral-500 bg-neutral-100 dark:bg-neutral-900/20"
                  : "border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600"
              }`}
            >
              <div className="size-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                <Upload className={`size-7 transition-colors ${dragOver ? "text-neutral-600 dark:text-neutral-400" : "text-neutral-500"}`} />
              </div>
              <h3 className="text-lg font-medium mb-2">No documents yet</h3>
              <p className="text-sm text-neutral-500 mb-6 max-w-sm mx-auto">
                Drag and drop a file here, or click to browse. Supports PDF, TXT, Markdown, CSV, JSON, XML, and HTML.
              </p>
              <div className="flex flex-col items-center gap-3">
                {uploading && (
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                      <div className="h-full rounded-full bg-neutral-500 dark:bg-neutral-400 transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <span className="text-xs text-neutral-500 w-8">{uploadProgress}%</span>
                  </div>
                )}
                <Button variant="default" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2">
                  <Upload className="size-4" />
                  {uploading ? "Uploading..." : "Upload your first document"}
                </Button>
              </div>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-16">
              <div className="size-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="size-6 text-neutral-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No matches</h3>
              <p className="text-sm text-neutral-500">No documents match your search query.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocs.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className="group flex items-center justify-between p-4 rounded-xl border border-neutral-200/70 dark:border-neutral-800/50 bg-white dark:bg-neutral-900 hover:border-neutral-300/50 dark:hover:border-neutral-700/50 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                      {doc.filename.endsWith(".pdf") ? (
                        <FileText className={`size-5 ${getDocIcon(doc.filename)}`} />
                      ) : (
                        <FileIcon className={`size-5 ${getDocIcon(doc.filename)}`} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{doc.title}</div>
                      <div className="text-sm text-neutral-500">
                        {doc.filename} &middot; {doc.file_size ? formatBytes(doc.file_size) : "?"} &middot; {formatDate(doc.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {confirmDelete === doc.id ? (
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(doc.id)} disabled={deleting === doc.id}>Confirm</Button>
                        <Button size="sm" variant="outline" onClick={() => setConfirmDelete(null)} disabled={deleting === doc.id}>Cancel</Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 text-neutral-400 hover:text-red-600 opacity-40 group-hover:opacity-100 transition-all"
                        onClick={() => setConfirmDelete(doc.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              onClick={() => removeToast(t.id)}
              className={`px-4 py-3 rounded-xl text-sm shadow-lg cursor-pointer ${
                t.type === "success"
                  ? "bg-emerald-600 text-white"
                  : "bg-red-600 text-white"
              } ${t.exiting ? "toast-exit" : ""}`}
            >
              {t.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
