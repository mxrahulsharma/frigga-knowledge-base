// This file should be renamed to 'page.tsx' for Next.js routing to work properly.
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DocumentPage({ params }: { params: { id: string } }) {
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('PRIVATE');
  const router = useRouter();

  // Fetch document on mount
  useEffect(() => {
    fetch(`/api/documents/${params.id}`)
      .then(async (res) => {
        if (!res.ok) return router.replace('/not-found');
        const data = await res.json();
        setDoc(data);
        setContent(data.content || '');
        setVisibility(data.visibility || 'PRIVATE');
        setLoading(false);
      });
  }, [params.id, router]);

  const handleSave = async () => {
    const res = await fetch(`/api/documents/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, visibility }),
    });
    if (res.ok) {
      alert('Document saved!');
    } else {
      alert('Failed to save document.');
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!doc) return null;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-4">{doc.title}</h1>
      <div className="mb-4">
        <label className="mr-2 font-medium">Visibility:</label>
        <select
          value={visibility}
          onChange={e => setVisibility(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="PUBLIC">Public</option>
          <option value="PRIVATE">Private</option>
        </select>
      </div>
      <textarea
        className="w-full min-h-[300px] p-4 border border-gray-300 rounded"
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Start writing your document here..."
      />
      <button
        onClick={handleSave}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Save
      </button>
    </div>
  );
}
