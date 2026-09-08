'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { UploadCloud, X, FileText, FileImage, AlertCircle } from 'lucide-react';

function byteSizeLabel(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`;
}

function fileTypeLabel(name) {
  const ext = name.split('.').pop()?.toLowerCase();
  return ext ? ext.toUpperCase() : 'FILE';
}

export default function FileUpload({
  id,
  label,
  hint,
  accept = ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
  maxSizeMB = 5,
  maxFiles = 5,
  multiple = true,
  files,
  onChange,
  error,
  className = '',
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState('');

  const acceptMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', pdf: 'application/pdf' };
  const acceptValue = accept.filter((ext) => acceptMap[ext]).map((ext) => acceptMap[ext]).join(',');
  const extPattern = accept.join('|');

  const currentFiles = useMemo(() => (Array.isArray(files) ? files : []), [files]);

  const validateFile = useCallback(
    (file) => {
      if (!extPattern.split('|').includes(file.name.split('.').pop()?.toLowerCase())) {
        return `"${file.name}" is not a supported file type (${accept.join(', ')}).`;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        return `"${file.name}" is larger than ${maxSizeMB} MB.`;
      }
      return null;
    },
    [accept, maxSizeMB, extPattern],
  );

  const addFiles = useCallback(
    (incoming) => {
      setValidationError('');
      const list = Array.from(incoming);
      if (!multiple && list.length > 0) list.splice(1);
      if (currentFiles.length + list.length > maxFiles) {
        setValidationError(`You can attach up to ${maxFiles} file${maxFiles > 1 ? 's' : ''}.`);
        return;
      }
      for (const file of list) {
        const problem = validateFile(file);
        if (problem) {
          setValidationError(problem);
          return;
        }
      }
      onChange([...currentFiles, ...list]);
    },
    [multiple, maxFiles, currentFiles, onChange, validateFile, setValidationError],
  );

  const removeFile = (index) => {
    onChange(currentFiles.filter((_, i) => i !== index));
  };

  return (
    <div className={className}>
      {label && <span className="field-label">{label}</span>}

      <button
        type="button"
        id={id}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
        className={`flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${
          dragOver
            ? 'border-teal-500 bg-teal-50/60'
            : 'border-slate-300 bg-slate-50/40 hover:border-teal-400 hover:bg-teal-50/30'
        }`}
        aria-controls={id ? `${id}-list` : undefined}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-100 text-teal-700">
          <UploadCloud size={22} strokeWidth={1.75} />
        </span>
        <span className="mt-3 text-sm font-semibold text-slate-800">
          {dragOver ? 'Drop files here' : `Click to upload or drag & drop`}
        </span>
        <span className="mt-1 text-xs text-slate-500">
          {accept.join(', ').toUpperCase()}, up to {maxSizeMB} MB each
        </span>
        <input
          ref={inputRef}
          id={id ? `${id}-input` : undefined}
          type="file"
          accept={acceptValue}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </button>

      <input
        type="file"
        accept={acceptValue}
        multiple={multiple}
        className="hidden"
        tabIndex={-1}
        readOnly
        aria-hidden="true"
      />

      {hint && <p className="field-hint">{hint}</p>}
      {(validationError || error) && (
        <p className="mt-2 flex items-start gap-1.5 text-xs font-medium text-red-600" role="alert">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          {validationError || error}
        </p>
      )}

      {currentFiles.length > 0 && (
        <ul id={id ? `${id}-list` : undefined} className="mt-3 space-y-2">
          {currentFiles.map((file, index) => {
            const isImage = file.type?.startsWith('image/');
            const preview = isImage ? URL.createObjectURL(file) : null;
            return (
              <li key={`${file.name}-${file.lastModified}-${index}`} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5">
                {isImage && preview ? (
                  <img src={preview} alt={`${file.name} preview`} className="h-10 w-10 shrink-0 rounded-md object-cover" />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                    {file.name.split('.').pop()?.toLowerCase() === 'pdf' ? <FileText size={18} /> : <FileImage size={18} />}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{file.name}</p>
                  <p className="text-xs text-slate-400">{byteSizeLabel(file.size)}</p>
                </div>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                  {fileTypeLabel(file.name)}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  aria-label={`Remove ${file.name}`}
                  className="rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <X size={16} />
                </button>
              </li>
);
        })}
      </ul>
    )}
  </div>
  );
}