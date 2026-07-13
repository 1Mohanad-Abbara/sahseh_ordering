import "./globals.css";

export const metadata = {
  title: "صَح صِح | الطلبات",
  description: "منيو الطلبات من صَح صِح"
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
