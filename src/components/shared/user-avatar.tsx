import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/initials";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  name: string;
  className?: string;
};

export function UserAvatar({ name, className }: UserAvatarProps) {
  return (
    <Avatar className={cn("size-8", className)}>
      <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
