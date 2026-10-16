import { getCollection, render } from 'astro:content';
import { url, timelineIncludesProjects } from './lib';

export type TLType = 'work' | 'education' | 'home' | 'milestone' | 'idea' | 'project';

export interface TLItem {
  id: string;
  title: string;
  type: TLType;
  date?: Date;
  end?: Date;
  ongoing: boolean;
  place?: string;
  link?: string;
  summary?: string;
  Content?: Awaited<ReturnType<typeof render>>['Content'];
  placeholder: boolean;
}

export const TYPE_LABELS: Record<TLType, string> = {
  work: 'Work',
  project: 'Projects',
  education: 'Education',
  home: 'Places lived',
  milestone: 'Milestones',
  idea: 'Ideas',
};

export const TYPE_SINGULAR: Record<TLType, string> = {
  work: 'Work', project: 'Project', education: 'Education', home: 'Home', milestone: 'Milestone', idea: 'Idea',
};

export const fmtYM = (d?: Date) => (d ? `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}` : '');

/** Timeline entries plus (optionally) every project, newest first. Ideas are returned separately. */
export async function getTimeline() {
  const entries = await getCollection('timeline');
  const items: TLItem[] = await Promise.all(entries.map(async (e) => ({
    id: e.id,
    ...e.data,
    link: e.data.link ? url(e.data.link) : undefined,
    Content: e.body?.trim() ? (await render(e)).Content : undefined,
  })));
  if (timelineIncludesProjects) {
    for (const p of await getCollection('projects')) {
      items.push({
        id: `project-${p.id}`, title: p.data.title, type: 'project', date: p.data.date,
        ongoing: p.data.status === 'in-progress', link: url(`/projects/${p.id}/`), summary: p.data.summary,
        placeholder: p.data.placeholder,
      });
    }
  }
  const ideas = items.filter((i) => i.type === 'idea');
  const dated = items.filter((i) => i.type !== 'idea' && i.date).sort((a, b) => b.date!.getTime() - a.date!.getTime());
  return { dated, ideas };
}
