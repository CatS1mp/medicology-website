import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ["latin", "vietnamese"],
  variable: "--font-be-vietnam",
});

export const metadata: Metadata = {
  title: "Medicology",
  description: "Cách miễn phí, thú vị và hiệu quả để học kiến thức y khoa!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${beVietnamPro.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
