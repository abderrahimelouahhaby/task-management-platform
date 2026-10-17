import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

type TopbarProps = {
  user: { name: string; email: string };
};

export function Topbar({ user }: TopbarProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background px-4">
      <MobileNav />
      <div className="flex-1" />
      <ThemeToggle />
      <UserMenu user={user} />
    </header>
  );
}
