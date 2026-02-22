import type { EncounterReward } from '../../types/Campaign';
import { createEncounterReward } from '../../types/Campaign';
import Icon from '../icons/Icon';

interface RewardListProps {
  rewards: EncounterReward[];
  onChange: (rewards: EncounterReward[]) => void;
}

const REWARD_TYPES: EncounterReward['type'][] = ['gold', 'item', 'xp', 'other'];

function RewardList({ rewards, onChange }: RewardListProps) {
  const addReward = () => {
    onChange([...rewards, createEncounterReward('')]);
  };

  const updateReward = (id: string, updates: Partial<EncounterReward>) => {
    onChange(rewards.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const removeReward = (id: string) => {
    onChange(rewards.filter(r => r.id !== id));
  };

  return (
    <div className="reward-list">
      <label>Rewards</label>
      {rewards.map((reward) => (
        <div key={reward.id} className="reward-row">
          <select
            className="reward-type"
            value={reward.type}
            onChange={(e) => updateReward(reward.id, { type: e.target.value as EncounterReward['type'] })}
            aria-label="Reward type"
          >
            {REWARD_TYPES.map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
          <input
            type="text"
            className="reward-description"
            value={reward.description}
            onChange={(e) => updateReward(reward.id, { description: e.target.value })}
            placeholder="Description"
            aria-label="Reward description"
          />
          <input
            type="number"
            className="reward-quantity"
            value={reward.quantity ?? ''}
            onChange={(e) => updateReward(reward.id, { quantity: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="Qty"
            aria-label="Reward quantity"
          />
          <button
            className="btn-icon-small danger"
            onClick={() => removeReward(reward.id)}
            title="Remove reward"
            aria-label="Remove reward"
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      ))}
      <button className="add-item-btn" onClick={addReward}>
        + Add Reward
      </button>
    </div>
  );
}

export default RewardList;
