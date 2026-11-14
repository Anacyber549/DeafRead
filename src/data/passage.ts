import { countWords } from '../utils/textParser';

export interface ReadingPassage {
  id: string;
  title: string;
  gradeLevel: string;
  topic: string;
  imageSrc: string;
  imageAlt: string;
  sentences: string[];
  wordCount: number;
}

const PASSAGE_SENTENCES = [
  'Sea otters are playful marine mammals that live along the rocky Pacific coast.',
  'Unlike whales or seals, sea otters do not have thick blubber to stay warm.',
  'Instead, they rely on the densest fur of any animal on Earth for insulation.',
  'Every day, a sea otter spends hours grooming its coat to trap tiny air bubbles.',
  'Before going to sleep, otters often wrap themselves in long ribbons of giant kelp.',
  'The kelp works like a natural anchor so the ocean current does not carry them away.',
  'Sometimes, floating otters even hold paws with each other while they rest on the surface.',
  'Sea otters are clever hunters that tuck a favorite flat rock inside a loose skin pouch.',
  'They use that rock as a hammer to crack open hard clams and spiky sea urchins.',
  'By eating hungry urchins, sea otters protect the kelp forest ecosystem from disappearing.',
];

export const ANIMAL_PASSAGE: ReadingPassage = {
  id: 'sea-otters',
  title: 'Guardians of the Kelp Forest',
  gradeLevel: 'Grade 5',
  topic: 'Animals',
  imageSrc: '/src/assets/images/sea_otter_kelp_1794674854410.jpg',
  imageAlt:
    'Illustration of a smiling sea otter floating on its back in clear blue ocean water wrapped gently in green kelp leaves while holding a shell.',
  sentences: PASSAGE_SENTENCES,
  wordCount: countWords(PASSAGE_SENTENCES),
};
