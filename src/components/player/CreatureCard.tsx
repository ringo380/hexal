// CreatureCard — Individual creature display for encounter overlay

interface CreatureCardProps {
  name: string;
  count: number;
  cr?: string;
}

function CreatureCard({ name, count, cr }: CreatureCardProps) {
  return (
    <div className="creature-card">
      <div className="creature-card-name">{name}</div>
      <div className="creature-card-meta">
        <span className="creature-card-count">
          x{count}
        </span>
        {cr && (
          <span className="creature-card-cr">CR {cr}</span>
        )}
      </div>
    </div>
  );
}

export default CreatureCard;
