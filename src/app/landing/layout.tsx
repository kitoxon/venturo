// app/landing/layout.tsx
export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="min-h-screen bg-gray-50 p-6">{children}</main>;
}
