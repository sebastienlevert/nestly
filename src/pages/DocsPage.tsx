import React from 'react';
import { DocsSection } from '../components/common/DocsSection';

export const DocsPage: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto bg-background">
      <DocsSection />
    </div>
  );
};
