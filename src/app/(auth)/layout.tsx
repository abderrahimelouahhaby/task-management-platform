export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="text-2xl font-semibold tracking-tight">Mohima</div>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
