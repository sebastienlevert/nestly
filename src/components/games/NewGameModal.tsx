import React, { useState } from 'react';
import { useLocale } from '../../contexts/LocaleContext';
import { useGame } from '../../contexts/GameContext';
import { BUILT_IN_GAMES } from '../../types/game.types';
import type { GameTemplate, GameSession } from '../../types/game.types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Plus, X, Dices, TreePine, Bird, Gamepad2 } from 'lucide-react';

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGameCreated: (session: GameSession) => void;
}

const gameIcons: Record<string, React.ReactNode> = {
  'dice-hospital': <Dices size={20} />,
  'parks': <TreePine size={20} />,
  'wingspan': <Bird size={20} />,
};

export const NewGameModal: React.FC<NewGameModalProps> = ({ isOpen, onClose, onGameCreated }) => {
  const { t } = useLocale();
  const { allTemplates, createSession, addCustomTemplate } = useGame();
  const [step, setStep] = useState<'select' | 'players'>('select');
  const [selectedTemplate, setSelectedTemplate] = useState<GameTemplate | null>(null);
  const [customName, setCustomName] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [hasRounds, setHasRounds] = useState(true);
  const [players, setPlayers] = useState<string[]>(['', '']);
  const [error, setError] = useState('');

  const reset = () => {
    setStep('select');
    setSelectedTemplate(null);
    setCustomName('');
    setIsCustom(false);
    setHasRounds(true);
    setPlayers(['', '']);
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSelectGame = (template: GameTemplate) => {
    setSelectedTemplate(template);
    setIsCustom(false);
    setHasRounds(template.hasRounds);
    setStep('players');
  };

  const handleSelectCustom = () => {
    setIsCustom(true);
    setSelectedTemplate(null);
    setStep('players');
  };

  const handleAddPlayer = () => {
    setPlayers(prev => [...prev, '']);
  };

  const handleRemovePlayer = (index: number) => {
    if (players.length <= 2) return;
    setPlayers(prev => prev.filter((_, i) => i !== index));
  };

  const handlePlayerChange = (index: number, name: string) => {
    setPlayers(prev => prev.map((p, i) => i === index ? name : p));
  };

  const handleStart = () => {
    const validPlayers = players.filter(p => p.trim());
    if (validPlayers.length < 2) {
      setError(t.games.minPlayersRequired);
      return;
    }

    let gameId: string;
    let gameName: string;

    if (isCustom) {
      if (!customName.trim()) {
        setError(t.games.gameNameRequired);
        return;
      }
      const template = {
        name: customName.trim(),
        minPlayers: 2,
        maxPlayers: 10,
        hasRounds,
        roundLabel: 'Round',
      };
      addCustomTemplate(template);
      gameId = `custom_${Date.now()}`;
      gameName = customName.trim();
    } else if (selectedTemplate) {
      gameId = selectedTemplate.id;
      gameName = selectedTemplate.name;
    } else {
      return;
    }

    const session = createSession(gameId, gameName, validPlayers, hasRounds);
    handleClose();
    onGameCreated(session);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-md mx-auto max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{step === 'select' ? t.games.selectGame : t.games.players}</DialogTitle>
        </DialogHeader>

        {step === 'select' && (
          <div className="space-y-3">
            {/* Built-in games */}
            {BUILT_IN_GAMES.map(game => (
              <button
                key={game.id}
                onClick={() => handleSelectGame(game)}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {gameIcons[game.id] || <Gamepad2 size={20} />}
                </div>
                <div>
                  <div className="font-medium text-foreground">{game.name}</div>
                  <div className="text-sm text-muted-foreground">{game.minPlayers}–{game.maxPlayers} {t.games.players.toLowerCase()}</div>
                </div>
              </button>
            ))}

            {/* Custom templates */}
            {allTemplates.filter(t => !t.isBuiltIn).map(game => (
              <button
                key={game.id}
                onClick={() => handleSelectGame(game)}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
                  <Gamepad2 size={20} />
                </div>
                <div>
                  <div className="font-medium text-foreground">{game.name}</div>
                  <div className="text-sm text-muted-foreground">{game.minPlayers}–{game.maxPlayers} {t.games.players.toLowerCase()}</div>
                </div>
              </button>
            ))}

            {/* Custom game option */}
            <button
              onClick={handleSelectCustom}
              className="w-full flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-accent/50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <Plus size={20} />
              </div>
              <div className="font-medium text-muted-foreground">{t.games.customGame}</div>
            </button>
          </div>
        )}

        {step === 'players' && (
          <div className="space-y-4">
            {/* Back button */}
            <Button variant="ghost" size="sm" onClick={() => setStep('select')} className="mb-2">
              ← {t.games.selectGame}
            </Button>

            {/* Custom game name */}
            {isCustom && (
              <div className="space-y-2">
                <Label>{t.games.gameName}</Label>
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={t.games.gameNamePlaceholder}
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="hasRounds"
                    checked={hasRounds}
                    onChange={(e) => setHasRounds(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="hasRounds">{t.games.addRound}</Label>
                </div>
              </div>
            )}

            {/* Selected game name */}
            {!isCustom && selectedTemplate && (
              <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                {gameIcons[selectedTemplate.id] || <Gamepad2 size={18} />}
                <span className="font-medium text-primary">{selectedTemplate.name}</span>
              </div>
            )}

            {/* Player list */}
            <div className="space-y-2">
              <Label>{t.games.players}</Label>
              {players.map((player, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={player}
                    onChange={(e) => handlePlayerChange(index, e.target.value)}
                    placeholder={`${t.games.playerNamePlaceholder} ${index + 1}`}
                    className="flex-1"
                  />
                  {players.length > 2 && (
                    <Button variant="ghost" size="sm" onClick={() => handleRemovePlayer(index)}>
                      <X size={16} />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={handleAddPlayer} className="w-full mt-2">
                <Plus size={16} className="mr-1" /> {t.games.addPlayer}
              </Button>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button onClick={handleStart} className="w-full">
              {t.games.startGame}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
