import { DIFFICULTY_COLORS } from '../../types/Campaign';

interface DifficultyBadgeProps {
  difficulty?: string;
  size?: 'small' | 'normal';
}

function DifficultyBadge({ difficulty, size = 'normal' }: DifficultyBadgeProps) {
  if (!difficulty) return null;

  const color = DIFFICULTY_COLORS[difficulty] || '#666666';

  return (
    <span
      className={`difficulty-badge ${size === 'small' ? 'difficulty-badge--small' : ''}`}
      style={{ backgroundColor: `${color}22`, color, borderColor: `${color}44` }}
    >
      {difficulty}
    </span>
  );
}

export default DifficultyBadge;
