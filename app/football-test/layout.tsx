'use client';

export default function FootballTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <style jsx global>{`
        .football-test-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        /* ... rest of your CSS styles ... */
      `}</style>
      {children}
    </div>
  );
}