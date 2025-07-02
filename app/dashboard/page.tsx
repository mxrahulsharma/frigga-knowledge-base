'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import DashboardLayout from '../dashlayout';

type Document = {
  id: string;
  title: string;
  updatedAt: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  isOwner: boolean;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetch(`/api/documents?authorId=${session.user.id}`)
        .then(async (res) => {
          if (!res.ok) throw new Error(await res.text());
          return res.json();
        })
        .then((data) => {
          setDocuments(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to fetch documents:', err);
          setLoading(false);
        });
    }
  }, [status, session?.user?.id]);

  const handleCreate = async () => {
    const title = prompt('Enter document title');
    if (!title || !session?.user?.id) return;

    try {
      setCreating(true);
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, authorId: session.user.id }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Unknown error occurred');
      }

      const newDoc = await res.json();
      setDocuments((prev) => [newDoc, ...prev]);
    } catch (error) {
      console.error('Error creating document:', error);
      alert('Failed to create document. See console for details.');
    } finally {
      setCreating(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-10 text-muted-foreground">Loading documents...</div>
      </DashboardLayout>
    );
  }

  if (status !== 'authenticated') {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Please login to view your dashboard.
        <div className="mt-4 flex justify-center gap-4">
          <a href="/login" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Login</a>
          <a href="/register" className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Register</a>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-4">
          <Button variant="default" onClick={handleCreate} disabled={creating}>
            <Plus className="mr-2 h-4 w-4" />
            {creating ? 'Creating...' : 'New Document'}
          </Button>
          <Button variant="outline" onClick={() => signOut({ callbackUrl: '/login' })}>
            Logout
          </Button>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Documents</h2>

      {documents.length === 0 ? (
        <div className="text-muted-foreground text-center py-10">No documents found.</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <FileText className="text-primary" />
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      doc.visibility === 'PUBLIC'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {doc.visibility}
                  </span>
                </div>
                <h2 className="text-lg font-semibold mt-4 truncate">{doc.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Last updated: {new Date(doc.updatedAt).toLocaleDateString()}
                </p>
                <div className="flex gap-2 mt-4">
                  <Button 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/documents/${doc.id}`);
                    }}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  {doc.isOwner && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/documents/${doc.id}/access`);
                      }}
                    >
                      Access
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
