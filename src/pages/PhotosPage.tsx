import React from 'react';
import { Image } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { LoginButton } from '../components/auth/LoginButton';
import { PhotoSlideshow } from '../components/photos/PhotoSlideshow';

export const PhotosPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <Image size={64} className="mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            {t.photos.title}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t.photos.signInMessage}
          </p>
          <LoginButton />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <PhotoSlideshow onSelectFolder={() => navigate('/settings?tab=photos')} />
    </div>
  );
};
