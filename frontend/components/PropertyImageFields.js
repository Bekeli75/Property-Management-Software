import { useState } from 'react';

const slots = [
  ['image_1', 'Main photo'],
  ['image_2', 'Alternate view'],
  ['image_3', 'Additional view'],
];

export function imageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, '') || 'http://localhost:8000';
  return `${baseUrl}/storage/${path}`;
}

export default function PropertyImageFields({ files, setFiles, existing = {} }) {
  const [error, setError] = useState('');
  const handleChange = (key, file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Choose a JPG, PNG, or WEBP image up to 5 MB.');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = () => setFiles((current) => ({ ...current, [key]: { file, preview: reader.result, remove: false } }));
    reader.readAsDataURL(file);
  };

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-slate-800">Property photos <span className="font-normal text-slate-500">(optional)</span></legend>
      {error && <p role="alert" className="text-xs font-medium text-red-700">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-3">
        {slots.map(([key, label]) => (
          <div key={key} className="rounded-lg border border-dashed border-slate-300 p-3 hover:border-teal-500">
            <label htmlFor={`property-${key}`} className="block cursor-pointer text-xs font-semibold text-slate-700">{label}</label>
            {(!files[key]?.remove && (files[key]?.preview || existing[key])) && <div role="img" aria-label={`${label} preview`} className="mt-2 h-20 w-full rounded bg-cover bg-center" style={{ backgroundImage: `url(${files[key]?.preview || imageUrl(existing[key])})` }} />}
            <span className="mt-2 block truncate text-xs text-slate-500">{files[key]?.file?.name || (existing[key] ? 'Replace photo' : 'Choose image')}</span>
            <input id={`property-${key}`} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => handleChange(key, event.target.files?.[0])} />
            {(!files[key]?.remove && (files[key]?.preview || existing[key])) && <button type="button" onClick={() => setFiles((current) => ({ ...current, [key]: { file: null, preview: null, remove: true } }))} className="mt-2 text-xs font-semibold text-red-700">Remove</button>}
          </div>
        ))}
      </div>
    </fieldset>
  );
}
