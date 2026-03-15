import React, { useState } from 'react';
import { Hash, Plus, History, Trophy, RotateCcw, Crown, ArrowUpDown, X, Check } from 'lucide-react';
import { useScoreboard } from '../../contexts/ScoreboardContext';
import { useLocale } from '../../contexts/LocaleContext';
import type { ScorePlayer, ScoreEntry } from '../../types/funnight.types';

const PLAYER_COLORS: Record<string, string> = {
  Red: 'bg-red-500',
  Blue: 'bg-blue-500',
  Green: 'bg-emerald-500',
  Purple: 'bg-purple-500',
  Orange: 'bg-orange-500',
  Pink: 'bg-pink-500',
  Cyan: 'bg-cyan-500',
  Yellow: 'bg-yellow-500',
};

const PLAYER_TEXT_COLORS: Record<string, string> = {
  Red: 'text-red-400',
  Blue: 'text-blue-400',
  Green: 'text-emerald-400',
  Purple: 'text-purple-400',
  Orange: 'text-orange-400',
  Pink: 'text-pink-400',
  Cyan: 'text-cyan-400',
  Yellow: 'text-yellow-400',
};

function PlayerAvatar({ player, size = 'md' }: { player: ScorePlayer; size?: 'sm' | 'md' | 'lg' }) {
  const bg = PLAYER_COLORS[player.color] || 'bg-muted';
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  return (
    <div className={`${sizes[size]} ${bg} rounded-full flex items-center justify-center font-bold text-white shadow-md`}>
      {player.name.charAt(0).toUpperCase()}
    </div>
  );
}

// ─── Score Input Modal ──────────────────────────────────────────────────────

function ScoreInputModal({ player, onClose, onSubmit }: { player: ScorePlayer; onClose: () => void; onSubmit: (v: number) => void }) {
  const [value, setValue] = useState('');
  const [isNegative, setIsNegative] = useState(false);
  const { t } = useLocale();

  const handleKey = (key: string) => {
    if (key === 'backspace') setValue(v => v.slice(0, -1));
    else if (key === '±') setIsNegative(n => !n);
    else if (key === '.') { if (!value.includes('.')) setValue(v => v + '.'); }
    else if (value.length < 7) setValue(v => v + key);
  };

  const submit = () => {
    const num = parseFloat(value);
    if (isNaN(num) || num === 0) return;
    onSubmit(isNegative ? -num : num);
  };

  const displayValue = value ? `${isNegative ? '-' : ''}${value}` : '0';
  const keys = [['7','8','9'],['4','5','6'],['1','2','3'],['±','0','.']];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <PlayerAvatar player={player} />
              <div>
                <h3 className="font-semibold text-foreground">{player.name}</h3>
                <p className="text-xs text-muted-foreground">{t.scoreboard.current}: {player.score}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground" style={{ minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={20} />
            </button>
          </div>

          {/* Display */}
          <div className={`text-center text-4xl font-mono font-bold py-4 mb-4 rounded-xl bg-muted ${isNegative && value ? 'text-destructive' : 'text-foreground'}`}>
            {displayValue}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {keys.flat().map(key => (
              <button
                key={key}
                onClick={() => handleKey(key)}
                className="flex items-center justify-center h-14 rounded-xl bg-muted hover:bg-muted/80 active:bg-primary/20 text-xl font-semibold text-foreground transition-colors"
                style={{ minHeight: 44 }}
              >
                {key}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleKey('backspace')}
              className="flex items-center justify-center h-14 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground font-medium transition-colors"
              style={{ minHeight: 44 }}
            >
              ⌫ {t.scoreboard.delete}
            </button>
            <button
              onClick={submit}
              disabled={!value || parseFloat(value) === 0}
              className="btn-primary flex items-center justify-center gap-1 h-14 rounded-xl font-bold disabled:opacity-30 transition-colors"
              style={{ minHeight: 44 }}
            >
              <Check size={18} />
              {t.scoreboard.add}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── History Modal ──────────────────────────────────────────────────────────

function HistoryModal({ player, entries, onClose }: { player: ScorePlayer; entries: ScoreEntry[]; onClose: () => void }) {
  const { t } = useLocale();
  const playerEntries = entries.filter(e => e.playerId === player.id).reverse();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <PlayerAvatar player={player} />
              <h3 className="font-semibold text-foreground">{player.name} — {t.scoreboard.history}</h3>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground" style={{ minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={20} />
            </button>
          </div>
          {playerEntries.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 text-sm">{t.scoreboard.noScoresYet}</p>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-1">
              {playerEntries.map((entry, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span className="text-xs text-muted-foreground">{t.scoreboard.round} {entry.round}</span>
                  <span className={`font-mono font-bold ${entry.value >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                    {entry.value >= 0 ? '+' : ''}{entry.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Reset Confirmation Modal ───────────────────────────────────────────────

function ResetModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const { t } = useLocale();
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-5 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <RotateCcw size={28} className="text-destructive" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">{t.scoreboard.resetGame}?</h3>
          <p className="text-muted-foreground text-sm mb-6">{t.scoreboard.resetConfirm}</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={onClose} className="p-3 rounded-xl bg-muted hover:bg-muted/80 font-medium text-foreground transition-colors" style={{ minHeight: 44 }}>
              {t.scoreboard.cancel}
            </button>
            <button onClick={onConfirm} className="p-3 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold transition-colors" style={{ minHeight: 44 }}>
              {t.scoreboard.reset}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Finish Confirmation Modal ──────────────────────────────────────────────

function FinishModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const { t } = useLocale();
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-5 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Trophy size={28} className="text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">{t.scoreboard.finishGame}?</h3>
          <p className="text-muted-foreground text-sm mb-6">{t.scoreboard.finishConfirm}</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={onClose} className="p-3 rounded-xl bg-muted hover:bg-muted/80 font-medium text-foreground transition-colors" style={{ minHeight: 44 }}>
              {t.scoreboard.cancel}
            </button>
            <button onClick={onConfirm} className="btn-primary p-3 rounded-xl font-bold transition-colors" style={{ minHeight: 44 }}>
              {t.scoreboard.finish}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Active Game Session ────────────────────────────────────────────────────

export const ActiveSession: React.FC = () => {
  const { currentSession, addScoreEntry, nextRound, finishSession, clearSession } = useScoreboard();
  const { t } = useLocale();
  const [scoreModal, setScoreModal] = useState<ScorePlayer | null>(null);
  const [historyModal, setHistoryModal] = useState<ScorePlayer | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [showFinish, setShowFinish] = useState(false);

  if (!currentSession) return null;

  const sorted = [...currentSession.players].sort((a, b) =>
    currentSession.scoringMode === 'highest' ? b.score - a.score : a.score - b.score
  );

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="space-y-4">
      {/* Game header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{currentSession.gameName}</h3>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Hash size={14} /> {t.scoreboard.round} {currentSession.round}
            </span>
            <span className="flex items-center gap-1">
              <ArrowUpDown size={14} /> {currentSession.scoringMode === 'highest' ? t.scoreboard.highestWins : t.scoreboard.lowestWins}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={nextRound}
            className="px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium text-foreground transition-colors"
            style={{ minHeight: 44 }}
          >
            {t.scoreboard.nextRound}
          </button>
          <button
            onClick={() => setShowFinish(true)}
            className="px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-sm font-medium text-primary transition-colors"
            style={{ minHeight: 44 }}
          >
            <Trophy size={16} className="inline mr-1" />
            {t.scoreboard.finish}
          </button>
          <button
            onClick={() => setShowReset(true)}
            className="text-muted-foreground hover:text-destructive transition-colors"
            style={{ minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Player cards */}
      <div className="space-y-3">
        {currentSession.players.map((player) => {
          const textColor = PLAYER_TEXT_COLORS[player.color] || 'text-foreground';
          return (
            <div key={player.id} className="card flex items-center gap-3">
              <PlayerAvatar player={player} size="lg" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate">{player.name}</h4>
                <p className={`text-2xl font-mono font-bold ${textColor}`}>{player.score}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setScoreModal(player)}
                  className={`${PLAYER_COLORS[player.color] || 'bg-primary'} text-white rounded-xl shadow-md active:scale-95 transition-transform`}
                  style={{ minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Plus size={20} />
                </button>
                <button
                  onClick={() => setHistoryModal(player)}
                  className="rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                  style={{ minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <History size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Leaderboard */}
      <div className="card">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Trophy size={14} /> {t.scoreboard.leaderboard}
        </h4>
        <div className="space-y-2">
          {sorted.map((player, i) => {
            const textColor = PLAYER_TEXT_COLORS[player.color] || 'text-foreground';
            return (
              <div key={player.id} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${i === 0 ? 'bg-primary/5 border border-primary/20' : 'bg-muted'}`}>
                <div className="w-6 text-center text-sm">
                  {i < 3 ? medals[i] : <span className="text-muted-foreground font-mono">{i + 1}</span>}
                </div>
                <PlayerAvatar player={player} size="sm" />
                <span className="flex-1 font-medium text-foreground text-sm truncate">
                  {player.name}
                  {i === 0 && <Crown size={14} className="inline ml-1 text-yellow-500" />}
                </span>
                <span className={`font-mono font-bold ${textColor}`}>{player.score}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {scoreModal && (
        <ScoreInputModal
          player={scoreModal}
          onClose={() => setScoreModal(null)}
          onSubmit={v => { addScoreEntry(scoreModal.id, v); setScoreModal(null); }}
        />
      )}
      {historyModal && (
        <HistoryModal
          player={historyModal}
          entries={currentSession.entries}
          onClose={() => setHistoryModal(null)}
        />
      )}
      {showReset && (
        <ResetModal
          onClose={() => setShowReset(false)}
          onConfirm={() => { clearSession(); setShowReset(false); }}
        />
      )}
      {showFinish && (
        <FinishModal
          onClose={() => setShowFinish(false)}
          onConfirm={() => { finishSession(); setShowFinish(false); }}
        />
      )}
    </div>
  );
};
