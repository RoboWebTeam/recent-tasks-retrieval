import React from 'react';
import * as LucideIcons from 'lucide-react';
import { LucideProps } from 'lucide-react';

interface IconProps extends LucideProps {
  name: string;
  fallback?: string;
}

const Icon: React.FC<IconProps> = ({ name, fallback = 'CircleAlert', ...props }) => {
  // Декоративные по умолчанию: прячем от скринридеров, если не задан явный aria-label/role.
  const a11y = props['aria-label'] || props.role
    ? {}
    : { 'aria-hidden': true as const, focusable: false as const };
  const IconComponent = (LucideIcons as Record<string, React.FC<LucideProps>>)[name];

  if (!IconComponent) {
    // Если иконка не найдена, используем fallback иконку
    const FallbackIcon = (LucideIcons as Record<string, React.FC<LucideProps>>)[fallback];

    // Если даже fallback не найден, возвращаем пустой span
    if (!FallbackIcon) {
      return <span className="text-xs text-gray-400" aria-hidden="true">[icon]</span>;
    }

    return <FallbackIcon {...a11y} {...props} />;
  }

  return <IconComponent {...a11y} {...props} />;
};

export default Icon;
