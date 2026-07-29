"use client";

interface FloatingIcon {
  icon: React.ComponentType<{ className?: string }>;
  className: string;
  position: string;
}

interface FloatingBackgroundProps {
  icons: FloatingIcon[];
}

export function FloatingBackground({ icons }: FloatingBackgroundProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {icons.map((item, i) => (
        <div
          key={i}
          className={`absolute hidden lg:block ${item.position}`}
        >
          <item.icon className={`size-6 ${item.className}`} />
        </div>
      ))}
    </div>
  );
}
