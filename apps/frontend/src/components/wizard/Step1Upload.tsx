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
        <h3 className="text-lg font-semibold text-stone-900 tracking-tight">Upload Website Files</h3>
        <p className="text-xs text-stone-500 mt-1 leading-relaxed">
          Provide your static web project files. You can drop a <strong>.zip</strong> archive or individual HTML, CSS, JavaScript, and image assets.
        </p>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-stone-500 bg-stone-100/70'
            : 'border-stone-300 hover:border-stone-400 bg-stone-50/60 hover:bg-stone-50'
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

        <div className="w-14 h-14 rounded-2xl bg-white border border-stone-200/80 flex items-center justify-center mb-4 text-stone-700 shadow-sm">
          <Upload className="w-6 h-6" />
        </div>

        <p className="font-medium text-stone-900 text-sm">
          {isUploading ? 'Extracting & Validating Project...' : 'Drag and drop your website ZIP or files here'}
        </p>
        <p className="text-xs text-stone-500 mt-1 max-w-sm">
          Original relative paths, assets, and folders are preserved automatically.
        </p>

        <div className="flex items-center gap-2.5 mt-5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-medium shadow-sm transition-all"
          >
            Browse Files or ZIP
          </button>
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-medium transition-all shadow-sm flex items-center gap-1.5"
          >
            <Folder className="w-3.5 h-3.5 text-stone-500" />
            <span>Upload Folder</span>
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Project Files Inspection */}
      {filesInfo && filesInfo.totalFiles > 0 && (
        <div className="bg-stone-50/70 border border-stone-200/70 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/70 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-medium text-sm text-stone-800">
                Uploaded {filesInfo.totalFiles} files ({(filesInfo.totalSize / 1024).toFixed(1)} KB)
              </span>
            </div>

            {/* Entry point selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-stone-500 font-medium">Entry HTML:</span>
              <select
                value={selectedEntryPoint}
                onChange={(e) => onEntryPointChanged(e.target.value)}
                className="bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-stone-800 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-stone-400 shadow-sm"
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
                className="flex items-center justify-between py-1 px-2.5 rounded-lg hover:bg-stone-200/50 text-stone-700 transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  {f.isDirectory ? (
                    <Folder className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  ) : (
                    <FileCode className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  )}
                  <span className="truncate">{f.relativePath}</span>
                  {f.relativePath === selectedEntryPoint && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-stone-200/80 text-stone-700 font-sans font-medium">
                      Main Entry
                    </span>
                  )}
                </div>
                {!f.isDirectory && (
                  <span className="text-stone-400 text-[11px] shrink-0 font-sans">
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
