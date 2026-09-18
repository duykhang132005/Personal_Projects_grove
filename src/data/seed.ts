import type { GroveData } from '../types';
import { uid } from '../utils/id';
import { createFreshGarden } from '../utils/garden';

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const projectIds = {
  academics: uid('proj'),
  music: uid('proj'),
  life: uid('proj'),
  health: uid('proj'),
};

export function createSeedData(): GroveData {
  const now = new Date().toISOString();

  return {
    version: 1,
    garden: createFreshGarden(),
    projects: [
      {
        id: projectIds.academics,
        name: 'Academics',
        color: '#5a8f6b',
        description: 'Courses, readings, and study sessions',
        emoji: '📚',
      },
      {
        id: projectIds.music,
        name: 'Music',
        color: '#7a9e6e',
        description: 'Practice, composition, and listening',
        emoji: '🎵',
      },
      {
        id: projectIds.life,
        name: 'Life',
        color: '#8b7355',
        description: 'Errands, home, and personal admin',
        emoji: '🌿',
      },
      {
        id: projectIds.health,
        name: 'Health',
        color: '#6b9e8a',
        description: 'Movement, rest, and wellbeing',
        emoji: '🍃',
      },
    ],
    tasks: [
      {
        id: uid('task'),
        title: 'Finish literature review draft',
        description:
          'Compile sources and write the first draft of the literature review section for the research paper.',
        status: 'in-progress',
        priority: 'high',
        projectId: projectIds.academics,
        dueDate: daysFromNow(0),
        dueTime: '17:00',
        tags: ['writing', 'research'],
        links: [
          {
            id: uid('link'),
            label: 'Google Scholar',
            url: 'https://scholar.google.com',
          },
          {
            id: uid('link'),
            label: 'Zotero library',
            url: 'https://www.zotero.org',
          },
        ],
        notes:
          'Focus on the last 5 years of publications. Cite at least 12 sources.',
        breakdowns: [
          {
            id: uid('bd'),
            title: 'Research phase',
            steps: [
              { id: uid('step'), title: 'Gather 15 candidate papers', completed: true },
              { id: uid('step'), title: 'Annotate key findings', completed: true },
              { id: uid('step'), title: 'Outline argument structure', completed: false },
            ],
          },
          {
            id: uid('bd'),
            title: 'Writing phase',
            steps: [
              { id: uid('step'), title: 'Draft introduction', completed: false },
              { id: uid('step'), title: 'Write thematic sections', completed: false },
              { id: uid('step'), title: 'Polish citations', completed: false },
            ],
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uid('task'),
        title: 'Practice piano: Chopin Nocturne',
        description: 'Work through the middle section slowly with metronome.',
        status: 'todo',
        priority: 'medium',
        projectId: projectIds.music,
        dueDate: daysFromNow(0),
        dueTime: '19:30',
        tags: ['practice', 'piano'],
        links: [
          {
            id: uid('link'),
            label: 'Sheet music',
            url: 'https://imslp.org',
          },
        ],
        notes: 'Hands separately at 60 bpm, then together at 72.',
        breakdowns: [
          {
            id: uid('bd'),
            title: 'Warm-up',
            steps: [
              { id: uid('step'), title: 'Scales in Db major', completed: false },
              { id: uid('step'), title: 'Arpeggios', completed: false },
            ],
          },
          {
            id: uid('bd'),
            title: 'Piece work',
            steps: [
              { id: uid('step'), title: 'Bars 17-32 slowly', completed: false },
              { id: uid('step'), title: 'Pedal markings', completed: false },
            ],
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uid('task'),
        title: 'Grocery run & meal prep',
        description: 'Restock pantry staples and prep lunches for the week.',
        status: 'todo',
        priority: 'medium',
        projectId: projectIds.life,
        dueDate: daysFromNow(1),
        dueTime: '11:00',
        tags: ['errands', 'food'],
        links: [],
        notes: 'Remember oat milk and fresh herbs.',
        breakdowns: [
          {
            id: uid('bd'),
            title: 'Shopping list',
            steps: [
              { id: uid('step'), title: 'Vegetables & fruit', completed: false },
              { id: uid('step'), title: 'Proteins', completed: false },
              { id: uid('step'), title: 'Pantry staples', completed: false },
            ],
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uid('task'),
        title: 'Morning trail walk',
        description: '45-minute walk on the riverside trail. Phone on Do Not Disturb.',
        status: 'todo',
        priority: 'low',
        projectId: projectIds.health,
        dueDate: daysFromNow(0),
        dueTime: '07:30',
        tags: ['outdoors', 'movement'],
        links: [],
        notes: 'Bring water bottle. Stretch afterward.',
        breakdowns: [],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uid('task'),
        title: 'Submit midterm problem set',
        description: 'Complete and upload the differential equations problem set.',
        status: 'todo',
        priority: 'urgent',
        projectId: projectIds.academics,
        dueDate: daysFromNow(2),
        dueTime: '23:59',
        tags: ['math', 'deadline'],
        links: [
          {
            id: uid('link'),
            label: 'Course portal',
            url: 'https://example.com/course',
          },
        ],
        notes: 'Problems 1-4 require Laplace transforms.',
        breakdowns: [
          {
            id: uid('bd'),
            title: 'Problems',
            steps: [
              { id: uid('step'), title: 'Problem 1: IVP', completed: true },
              { id: uid('step'), title: 'Problem 2: systems', completed: false },
              { id: uid('step'), title: 'Problem 3: Fourier', completed: false },
              { id: uid('step'), title: 'Problem 4: review', completed: false },
              { id: uid('step'), title: 'Upload PDF', completed: false },
            ],
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}
