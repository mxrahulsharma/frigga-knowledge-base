'use client';

import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import { useState, useEffect, useRef } from 'react';
import { User } from 'lucide-react';

type User = {
  id: string;
  name: string;
  email: string;
  label: string;
};

type MentionListProps = {
  items: User[];
  command: (item: User) => void;
};

export default function MentionList({ items, command }: MentionListProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [users, setUsers] = useState<User[]>(items);

  const selectItem = (index: number) => {
    const item = users[index];
    if (item) {
      command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + users.length - 1) % users.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % users.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => {
    setUsers(items);
    setSelectedIndex(0);
  }, [items]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [selectedIndex, users]);

  if (users.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
      {users.map((item, index) => (
        <button
          key={item.id}
          className={`w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
            index === selectedIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
          }`}
          onClick={() => selectItem(index)}
        >
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">
              {item.label}
            </div>
            <div className="text-sm text-gray-500 truncate">
              {item.email}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// Tippy.js renderer for the mention suggestions
export function renderMentionList() {
  let reactRenderer: ReactRenderer;
  let popup: any;

  return {
    onStart: (props: any) => {
      reactRenderer = new ReactRenderer(MentionList, {
        props,
        editor: props.editor,
      });

      popup = tippy('body', {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: reactRenderer.element,
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        placement: 'bottom-start',
      });
    },
    onUpdate(props: any) {
      reactRenderer.updateProps(props);

      popup[0].setProps({
        getReferenceClientRect: props.clientRect,
      });
    },
    onKeyDown(props: any) {
      if (props.event.key === 'Escape') {
        popup[0].hide();
        return true;
      }

      return false;
    },
    onExit() {
      popup[0].destroy();
      reactRenderer.destroy();
    },
  };
} 