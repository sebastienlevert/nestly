import React, { useState, useEffect } from 'react';
import { Folder, ChevronRight, Image as ImageIcon, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocale } from '../../contexts/LocaleContext';
import { onedriveService } from '../../services/onedrive.service';
import type { DriveItem } from '../../services/onedrive.service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface GenericFolderPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (folderId: string, folderName: string) => void;
}

export const GenericFolderPicker: React.FC<GenericFolderPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const { accounts, getAccessToken } = useAuth();
  const { t } = useLocale();
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [items, setItems] = useState<DriveItem[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<Array<{ id: string; name: string }>>([
    { id: 'root', name: t.photos.oneDrive },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadFolder(currentFolderId);
    }
  }, [currentFolderId, isOpen]);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCurrentFolderId('root');
      setBreadcrumb([{ id: 'root', name: t.photos.oneDrive }]);
      setError(null);
    }
  }, [isOpen, t.photos.oneDrive]);

  const loadFolder = async (folderId: string) => {
    if (accounts.length === 0) {
      setError(t.photos.signInToAccess);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const accessToken = await getAccessToken(accounts[0].homeAccountId);
      let folderItems: DriveItem[];

      if (folderId === 'root') {
        const root = await onedriveService.getRootFolder(accessToken);
        folderItems = await onedriveService.getFolderContents(root.id, accessToken);
      } else {
        folderItems = await onedriveService.getFolderContents(folderId, accessToken);
      }

      setItems(folderItems);
    } catch (err: any) {
      console.error('Failed to load folder:', err);
      setError(err.message || t.photos.failedToLoadFolder);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToFolder = (item: DriveItem) => {
    setCurrentFolderId(item.id);
    setBreadcrumb(prev => [...prev, { id: item.id, name: item.name }]);
  };

  const navigateToBreadcrumb = (index: number) => {
    const newBreadcrumb = breadcrumb.slice(0, index + 1);
    setBreadcrumb(newBreadcrumb);
    setCurrentFolderId(newBreadcrumb[newBreadcrumb.length - 1].id);
  };

  const selectFolder = (item: DriveItem) => {
    onSelect(item.id, item.name);
  };

  const folders = items.filter(item => onedriveService.isFolder(item));
  const hasImages = items.some(item => onedriveService.isImage(item));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl">{t.photos.selectFolder}</DialogTitle>
              <DialogDescription className="sr-only">
                Choose a folder from OneDrive
              </DialogDescription>
            </div>
            <Button variant="secondary" onClick={onClose}>
              {t.actions.cancel}
            </Button>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm overflow-x-auto pt-4">
            {breadcrumb.map((crumb, index) => (
              <React.Fragment key={crumb.id}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateToBreadcrumb(index)}
                  className="text-primary hover:text-primary font-medium whitespace-nowrap px-2 h-8"
                >
                  {crumb.name}
                </Button>
                {index < breadcrumb.length - 1 && (
                  <ChevronRight size={16} className="text-muted-foreground" />
                )}
              </React.Fragment>
            ))}
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader size={48} className="animate-spin text-primary" />
            </div>
          ) : folders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Folder size={48} className="mx-auto mb-3 text-muted" />
              <p>{t.photos.noFolders}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {folders.map(folder => (
                <div
                  key={folder.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Button
                    variant="ghost"
                    onClick={() => navigateToFolder(folder)}
                    className="flex items-center gap-3 flex-1 text-left justify-start h-auto py-2"
                  >
                    <Folder size={24} className="text-primary flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">{folder.name}</p>
                      {folder.folder && (
                        <p className="text-sm text-muted-foreground">
                          {folder.folder.childCount} {t.photos.items}
                        </p>
                      )}
                    </div>
                  </Button>

                  <Button
                    onClick={() => selectFolder(folder)}
                    className="ml-3"
                  >
                    {t.actions.select}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Current folder selection */}
          {currentFolderId !== 'root' && hasImages && (
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <ImageIcon size={24} className="text-primary flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">
                      {breadcrumb[breadcrumb.length - 1].name}
                    </p>
                    <p className="text-sm text-muted-foreground">{t.photos.containsPhotos}</p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    const currentFolder = breadcrumb[breadcrumb.length - 1];
                    selectFolder({ id: currentFolder.id, name: currentFolder.name } as DriveItem);
                  }}
                >
                  {t.photos.selectThisFolder}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
