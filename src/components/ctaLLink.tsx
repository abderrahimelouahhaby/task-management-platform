import Link from "next/link";
export default function CtaLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-md bg-neutral-900 px-6 py-2 font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
    >
      {children}
    </Link>
  );
}
