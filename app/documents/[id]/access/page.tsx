'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type Permission = {
  id: string;
  user: { 
    id: string;
    email: string;
    name?: string;
  };
  level: 'VIEW' | 'EDIT';
};

export default function AccessControlPage() {
  const { id: documentId } = useParams() as { id: string };
  const [email, setEmail] = useState('');
  const [level, setLevel] = useState<'VIEW' | 'EDIT'>('VIEW');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/documents/${documentId}/permissions`)
      .then((res) => res.json())
      .then(setPermissions)
      .catch(() => toast.error('Failed to load permissions'))
      .finally(() => setLoading(false));
  }, [documentId]);

  const handleShare = async () => {
    const res = await fetch(`/api/documents/${documentId}/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, level }),
    });

    if (!res.ok) return toast.error('Failed to share document');

    const newPerm = await res.json();
    setPermissions((prev) => [...prev, newPerm]);
    setEmail('');
    toast.success(`Access granted to ${email}`);
  };

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-bold">Manage Access</h1>

      <div className="flex gap-4 items-end">
        <Input
          placeholder="User's email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Select value={level} onValueChange={(val: string) => setLevel(val as 'VIEW' | 'EDIT')}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Permission" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="VIEW">View</SelectItem>
            <SelectItem value="EDIT">Edit</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleShare}>Share</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading permissions...</p>
      ) : permissions.length === 0 ? (
        <p className="text-muted-foreground">No users have access yet.</p>
      ) : (
        <ul className="space-y-2">
          {permissions.map((perm) => (
            <li key={perm.id} className="flex justify-between items-center border p-2 rounded">
              <div>
                <span className="font-medium">{perm.user.email}</span>
                <span className="text-sm text-muted-foreground ml-2">{perm.level}</span>
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/documents/${documentId}/permissions?userId=${perm.user.id}`, {
                      method: 'DELETE',
                    });
                    if (!res.ok) throw new Error('Failed to remove permission');
                    setPermissions((prev) => prev.filter((p) => p.id !== perm.id));
                    toast.success(`Access removed for ${perm.user.email}`);
                  } catch (error) {
                    toast.error('Failed to remove access');
                  }
                }}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
