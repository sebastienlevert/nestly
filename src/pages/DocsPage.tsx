import React from 'react';
import { useParams } from 'react-router-dom';
import { DocsSection } from '../components/common/DocsSection';

export const DocsPage: React.FC = () => {
  const { sectionId, articleId } = useParams<{ sectionId?: string; articleId?: string }>();

  return (
    <div className="h-full overflow-y-auto bg-background">
      <DocsSection initialSection={sectionId} initialArticle={articleId} />
    </div>
  );
};
