'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LogOut, Plus, User, FileText, Users, Clock, Archive, Search } from 'lucide-react';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import SearchShortcut from '@/components/SearchShortcut';
import Notifications from '@/components/Notifications';

const navItems = [
  { name: 'Dashboard', icon: FileText, href: '/dashboard' },
  { name: 'Search', icon: Search, href: '/search' },
  { name: 'My Documents', icon: FileText, href: '/my-documents' },
  { name: 'Shared with Me', icon: Users, href: '/shared' },
  { name: 'Recent', icon: Clock, href: '/recent' },
  { name: 'Archived', icon: Archive, href: '/archived' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div className="flex h-screen bg-[#f8f8f8]">
      <SearchShortcut />
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r p-6 flex flex-col">
        <h1 className="text-xl font-bold text-blue-600 mb-8">KnowledgeFlow</h1>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
            >
              <item.icon className="h-4 w-4 mr-3" />
              {item.name}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => alert('Create New Document')}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md text-sm font-semibold"
        >
          Create Document
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* Topbar */}
        <div className="flex justify-between items-center mb-6">
          <SearchBar />

          <div className="flex items-center gap-6">
            <Notifications />
            <div className="flex items-center gap-2">
              <User className="h-6 w-6 text-blue-600" />
              <span className="text-sm font-medium text-gray-800">{session?.user?.email}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-xs text-gray-500 hover:text-red-500 ml-2"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main content passed as children */}
        {children}
      </main>
    </div>
  );
}
