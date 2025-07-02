'use client';
import { useEffect, useState } from 'react';

type Version = {
  id: string;
  createdAt: string;
  author: { 
    id: string;
    email: string; 
    name: string | null;
  };
};

export default function VersionHistory({ documentId }: { documentId: string }) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const res = await fetch(`/api/documents/${documentId}/versions`);
        if (!res.ok) throw new Error('Failed to fetch versions');
        const data = await res.json();
        setVersions(data);
      } catch (error) {
        console.error('Error fetching versions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, [documentId]);

  if (loading) {
    return (
      <div className="mt-6">
        <h2 className="font-semibold mb-2">Edit History</h2>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="mt-6">
        <h2 className="font-semibold mb-2">Edit History</h2>
        <p className="text-sm text-muted-foreground">No edit history available.</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="font-semibold mb-2">Edit History</h2>
      <ul className="text-sm text-muted-foreground space-y-1">
        {versions.map((version) => (
          <li key={version.id} className="flex items-center gap-2">
            <span className="font-medium">
              {version.author?.name || version.author?.email || 'Unknown'}
            </span>
            <span>edited on {new Date(version.createdAt).toLocaleString()}</span>
            <span className="text-green-600 font-medium">— Added</span>
          </li>
        ))}
      </ul>
    </div>
  );
} 