import { type Lang } from '@/lib/i18n';
import { AgentTeamSection } from './AgentTeamSection';
import { IndexSectionsTop } from './IndexSectionsTop';
import { IndexSectionsMiddle } from './IndexSectionsMiddle';
import { IndexSectionsBottom } from './IndexSectionsBottom';

interface Props { lang: Lang; }

export function IndexSections({ lang }: Props) {
  return (
    <>
      <AgentTeamSection lang={lang} />
      <IndexSectionsTop lang={lang} />
      <IndexSectionsMiddle lang={lang} />
      <IndexSectionsBottom lang={lang} />
    </>
  );
}
