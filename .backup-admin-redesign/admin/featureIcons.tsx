import { Video, Users, Mail, FileText, Palette, Bell, Sparkles } from "lucide-react";
import type { ComponentType } from "react";

const ICONS: Record<string, ComponentType<{ size?: number }>> = {
  Video, Users, Mail, FileText, Palette, Bell,
};

export function FeatureIcon({ name, size = 16 }: { name: string; size?: number }) {
  const Cmp = ICONS[name] ?? Sparkles;
  return <Cmp size={size} />;
}
