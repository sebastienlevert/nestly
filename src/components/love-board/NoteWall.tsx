import React, { useState } from 'react';
import { Heart, Pin, PinOff, Trash2, Plus } from 'lucide-react';
import { useLoveBoard } from '../../contexts/LoveBoardContext';
import { useLocale } from '../../contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import type { LoveNote } from '../../types/loveboard.types';

const NOTE_COLORS = ['#FFF3E0', '#E8F5E9', '#E3F2FD', '#FCE4EC', '#F3E5F5', '#FFF8E1', '#E0F7FA', '#FBE9E7'];

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

interface NoteCardProps {
  note: LoveNote;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
  anonymous: string;
  pinLabel: string;
  unpinLabel: string;
  deleteLabel: string;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onTogglePin, onDelete, anonymous, pinLabel, unpinLabel, deleteLabel }) => {
  // Determine if the note color is light (for dark text) by default all pastel colors are light
  return (
    <div
      className="group relative rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
      style={{ backgroundColor: note.color }}
    >
      {/* Action buttons - visible on hover/focus */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
        <button
          onClick={() => onTogglePin(note.id)}
          className="p-2 rounded-lg hover:bg-black/10 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={note.isPinned ? unpinLabel : pinLabel}
          title={note.isPinned ? unpinLabel : pinLabel}
        >
          {note.isPinned ? <PinOff size={16} className="text-gray-700" /> : <Pin size={16} className="text-gray-700" />}
        </button>
        <button
          onClick={() => onDelete(note.id)}
          className="p-2 rounded-lg hover:bg-red-100 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={deleteLabel}
          title={deleteLabel}
        >
          <Trash2 size={16} className="text-gray-500 hover:text-red-600" />
        </button>
      </div>

      {/* Pin indicator */}
      {note.isPinned && (
        <Pin size={14} className="absolute top-2 left-3 text-gray-500 rotate-45" />
      )}

      {/* Content */}
      <div className={note.isPinned ? 'mt-4' : ''}>
        <p className="text-gray-800 whitespace-pre-wrap break-words leading-relaxed">
          {note.emoji && <span className="mr-1">{note.emoji}</span>}
          {note.message}
        </p>
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span className="font-medium">{note.author || anonymous}</span>
          <span>{getRelativeTime(note.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};

export const NoteWall: React.FC = () => {
  const { notes, addNote, deleteNote, togglePinNote } = useLoveBoard();
  const { t } = useLocale();

  const [message, setMessage] = useState('');
  const [author, setAuthor] = useState('');
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0]);

  const pinnedNotes = notes.filter(n => n.isPinned).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const unpinnedNotes = notes.filter(n => !n.isPinned).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    addNote({
      message: trimmed,
      author: author.trim(),
      color: selectedColor,
      isPinned: false,
    });

    setMessage('');
    setAuthor('');
  };

  return (
    <div className="space-y-6">
      {/* Empty state */}
      {notes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Heart size={48} className="text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">{t.loveBoard.emptyNotes}</p>
        </div>
      )}

      {/* Pinned notes */}
      {pinnedNotes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Pin size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">{t.loveBoard.pinnedNotes}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pinnedNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onTogglePin={togglePinNote}
                onDelete={deleteNote}
                anonymous={t.loveBoard.anonymous}
                pinLabel={t.loveBoard.pinNote}
                unpinLabel={t.loveBoard.unpinNote}
                deleteLabel={t.loveBoard.deleteNote}
              />
            ))}
          </div>
          {unpinnedNotes.length > 0 && <Separator className="mt-6" />}
        </div>
      )}

      {/* Unpinned notes */}
      {unpinnedNotes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {unpinnedNotes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onTogglePin={togglePinNote}
              onDelete={deleteNote}
              anonymous={t.loveBoard.anonymous}
              pinLabel={t.loveBoard.pinNote}
              unpinLabel={t.loveBoard.unpinNote}
              deleteLabel={t.loveBoard.deleteNote}
            />
          ))}
        </div>
      )}

      {/* Add note form */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Plus size={16} />
          {t.loveBoard.addNote}
        </h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Textarea
              placeholder={t.loveBoard.messagePlaceholder}
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
          <div>
            <Input
              placeholder={t.loveBoard.authorPlaceholder}
              value={author}
              onChange={e => setAuthor(e.target.value)}
            />
          </div>

          {/* Color picker */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">{t.loveBoard.pickColor}</p>
            <div className="flex flex-wrap gap-2">
              {NOTE_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                  style={{
                    borderColor: selectedColor === color ? '#666' : 'transparent',
                  }}
                  aria-label={`Select color ${color}`}
                >
                  <span
                    className="w-7 h-7 rounded-full block"
                    style={{ backgroundColor: color }}
                  />
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={!message.trim()} className="min-h-[44px]">
            <Plus size={16} />
            {t.loveBoard.addNote}
          </Button>
        </form>
      </div>
    </div>
  );
};
