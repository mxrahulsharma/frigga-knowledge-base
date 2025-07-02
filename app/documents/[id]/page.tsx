'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@radix-ui/react-switch';
import { Label } from '@/components/ui/label';
import VersionHistory from '@/components/VersionHistory';
import { ArrowLeft } from 'lucide-react';
import { renderMentionList } from '@/components/MentionList';

export default function DocumentEditorPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const documentId = params?.id as string;

  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PRIVATE');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [isOwner, setIsOwner] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Mention.configure({
        HTMLAttributes: {
          class: 'mention text-blue-600 font-semibold bg-blue-100 px-1 rounded',
        },
        suggestion: {
          items: async ({ query }) => {
            if (query.length < 1) return [];
            
            try {
              const res = await fetch(`/api/users?search=${encodeURIComponent(query)}`);
              if (!res.ok) return [];
              const users = await res.json();
              // Transform users to include label for display
              return users.map((user: any) => ({
                ...user,
                label: user.name || user.email
              }));
            } catch (error) {
              console.error('Error fetching users:', error);
              return [];
            }
          },
          render: renderMentionList,
        },
      }),
    ],
    content: '',
    autofocus: true,
    editable: isOwner,
  });

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const res = await fetch(`/api/documents/${documentId}`);
        if (!res.ok) throw new Error('Failed to load document');
        const data = await res.json();
        setTitle(data.title);
        setVisibility(data.visibility || 'PRIVATE');
        setIsOwner(data.isOwner || false);
        editor?.commands.setContent(data.content || '');
      } catch (err) {
        console.error(err);
        alert('Failed to fetch document');
      } finally {
        setLoading(false);
      }
    };

    if (editor && documentId) fetchDocument();
  }, [editor, documentId]);

  // Update editor editable state when isOwner changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(isOwner);
    }
  }, [editor, isOwner]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const content = editor?.getJSON();
      const res = await fetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          content, 
          visibility,
          userId: session?.user?.id 
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = () => {
    const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/documents/${documentId}`;
    navigator.clipboard.writeText(publicUrl)
      .then(() => {
        setCopySuccess('Link copied!');
        setTimeout(() => setCopySuccess(''), 2000);
      })
      .catch(() => alert('Failed to copy link'));
  };

  if (loading || !editor) return <div className="p-4">Loading document...</div>;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
      {/* Back Button */}
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="flex items-center mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Title Input */}
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Document Title"
        className="text-xl font-bold"
        readOnly={!isOwner}
      />

      {isOwner && (
        <>
          {/* Visibility Toggle */}
          <div className="flex items-center gap-4">
            <Label htmlFor="visibility-switch">Visibility:</Label>
            <Switch
              id="visibility-switch"
              checked={visibility === 'PUBLIC'}
              onCheckedChange={(checked: boolean) => setVisibility(checked ? 'PUBLIC' : 'PRIVATE')}
              className={`w-10 h-6 rounded-full relative outline-none cursor-pointer transition-colors ${
                visibility === 'PUBLIC' 
                  ? 'bg-green-500' 
                  : 'bg-gray-300'
              }`}
            >
              <span
                className={`block w-4 h-4 bg-white rounded-full shadow absolute top-1 left-1 transition-transform ${
                  visibility === 'PUBLIC' ? 'translate-x-4' : ''
                }`}
              />
            </Switch>
            <span className="text-sm text-muted-foreground">{visibility}</span>
          </div>

          {visibility === 'PUBLIC' && (
            <div className="flex gap-2 items-center">
              <Button 
                variant="secondary" 
                onClick={handleCopyLink}
                className="transition-colors hover:bg-blue-100 hover:text-blue-700"
              >
                Copy Public Link
              </Button>
              {copySuccess && <span className="text-green-600 text-sm">{copySuccess}</span>}
            </div>
          )}

          <div className="flex gap-2 items-center">
            <Button 
              variant="outline" 
              onClick={() => router.push(`/documents/${documentId}/access`)}
            >
              Manage Access
            </Button>
          </div>
        </>
      )}

      {!isOwner && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Visibility: {visibility}</span>
          {visibility === 'PUBLIC' && (
            <Button 
              size="sm"
              variant="secondary" 
              onClick={handleCopyLink}
              className="transition-colors hover:bg-blue-100 hover:text-blue-700"
            >
              Copy Public Link
            </Button>
          )}
        </div>
      )}

      {/* Editor */}
      <div className="border rounded p-4 min-h-[300px] bg-white">
        <EditorContent editor={editor} />
      </div>

      {isOwner && (
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save & Go to Dashboard'}
        </Button>
      )}

      <VersionHistory documentId={documentId} />
    </div>
  );
}
