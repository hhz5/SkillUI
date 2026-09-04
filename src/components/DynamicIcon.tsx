import React from 'react';
import * as LucideIcons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, className = 'w-5 h-5', size }) => {
  // Try direct match, camelCase, or common aliases
  const formattedName = name
    ? name.charAt(0).toUpperCase() + name.slice(1)
    : 'Sparkles';

  // @ts-ignore
  const IconComponent = (LucideIcons as any)[formattedName] || (LucideIcons as any)[name] || LucideIcons.Sparkles;

  return <IconComponent className={className} size={size} />;
};
