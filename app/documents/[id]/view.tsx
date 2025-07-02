'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export default function PublicDocumentViewer() {
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);

  const editor = useEditor({ editable: false, extensions: [StarterKit], content: '' });

  useEffect(() => {
    const loadDocument = async () => {
      try {
        const res = await fetch(`/api/documents/${id}`);
        const data = await res.json();
        if (data.visibility !== 'PUBLIC') {
          alert('This document is not public.');
          return;
        }
        setTitle(data.title);
        editor?.commands.setContent(data.content || '');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id && editor) loadDocument();
  }, [id, editor]);

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <EditorContent editor={editor} />
    </div>
  );
}
