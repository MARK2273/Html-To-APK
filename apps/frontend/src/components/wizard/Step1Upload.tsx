import React, { useState, useRef } from 'react';
import { Upload, CheckCircle2, AlertCircle, FileCode, Folder } from 'lucide-react';
import { ExtractedWebsiteInfo } from '../../types';
import { api } from '../../services/api';

interface Step1UploadProps {
  projectId: string;
  filesInfo: ExtractedWebsiteInfo | null;
  onFilesUpdated: (info: ExtractedWebsiteInfo) => void;
  selectedEntryPoint: string;
  onEntryPointChanged: (entry: string) => void;
}

export const Step1Upload: React.FC<Step1UploadProps> = ({
  projectId,
  filesInfo,
  onFilesUpdated,
  selectedEntryPoint,
  onEntryPointChanged
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleUploadFiles = async (fileList: FileList) => {
    if (!fileList || fileList.length === 0) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      for (let i = 0; i < fileList.length; i++) {
        formData.append('files', fileList[i]);
      }

      const info = await api.uploadFiles(projectId, formData);
      onFilesUpdated(info);
      if (info.defaultEntryPoint && !selectedEntryPoint) {
        onEntryPointChanged(info.defaultEntryPoint);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload files.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-100">Upload Website Files</h3>
        <p className="text-xs text-slate-400 mt-1">
          Upload your static web project. You can drag and drop a <strong>.zip</strong> archive or individual HTML, CSS, JavaScript, and asset files.
        </p>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-slate-700 hover:border-slate-600 bg-slate-900/50 hover:bg-slate-800/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".zip,.html,.htm,.css,.js,.png,.jpg,.jpeg,.svg,.json,.woff,.woff2"
          className="hidden"
          onChange={(e) => e.target.files && handleUploadFiles(e.target.files)}
        />
        <input
          ref={folderInputRef}
          type="file"
          // @ts-ignore
          webkitdirectory="true"
          directory="true"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleUploadFiles(e.target.files)}
        />

        <div className="w-16 h-16 rounded-2xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center mb-4 text-blue-400 shadow-inner">
          <Upload className="w-8 h-8" />
        </div>

        <p className="font-semibold text-slate-200 text-sm">
          {isUploading ? 'Extracting & Validating Project...' : 'Drag and drop your website ZIP or files here'}
        </p>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Preserves original relative paths and nested asset folders. Zip slip and bomb protections active.
        </p>

        <div className="flex items-center gap-3 mt-4" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            Browse Files or ZIP
          </button>
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Folder className="w-3.5 h-3.5" />
            <span>Upload Directory</span>
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Project Files Inspection */}
      {filesInfo && filesInfo.totalFiles > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="font-semibold text-sm text-slate-200">
                Uploaded {filesInfo.totalFiles} files ({(filesInfo.totalSize / 1024).toFixed(1)} KB)
              </span>
            </div>

            {/* Entry point selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Entry HTML:</span>
              <select
                value={selectedEntryPoint}
                onChange={(e) => onEntryPointChanged(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:ring-1 focus:ring-blue-500"
              >
                {filesInfo.entryPoints.map((ep) => (
                  <option key={ep} value={ep}>
                    {ep}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* File list preview */}
          <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-xs pr-2">
            {filesInfo.files.map((f, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-800/40 text-slate-300"
              >
                <div className="flex items-center gap-2 truncate">
                  {f.isDirectory ? (
                    <Folder className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  ) : (
                    <FileCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span className="truncate">{f.relativePath}</span>
                  {f.relativePath === selectedEntryPoint && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-500/20 text-blue-400 font-sans font-semibold">
                      Main Entry
                    </span>
                  )}
                </div>
                {!f.isDirectory && (
                  <span className="text-slate-400 text-[11px] shrink-0">
                    {(f.size / 1024).toFixed(1)} KB
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
