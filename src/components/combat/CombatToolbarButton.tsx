// CombatToolbarButton - subscribes to CombatContext itself so combat
// dispatches (HP ticks, initiative edits) don't re-render all of MainEditor
// just to update the round badge

import { useCombat } from '../../stores/CombatContext';
import Icon from '../icons/Icon';

interface CombatToolbarButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

function CombatToolbarButton({ isOpen, onToggle }: CombatToolbarButtonProps) {
  const { combat } = useCombat();
  return (
    <button
      className={`btn btn-secondary${isOpen ? ' btn-active' : ''}`}
      onClick={onToggle}
    >
      <Icon name="sword" size={16} /> Combat
      {combat.isActive && <span className="filter-badge">R{combat.round}</span>}
    </button>
  );
}

export default CombatToolbarButton;
