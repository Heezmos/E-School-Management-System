import "./globals.css";

export const metadata = {
  title: "E-School Management System",
  description: "Multi-school academic management and student development platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
