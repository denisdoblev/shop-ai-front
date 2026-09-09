export default function AuthLayout({ children }: LayoutProps<"/">) {
  return <div className="min-h-svh bg-auth-surface text-auth-ink">{children}</div>;
}
