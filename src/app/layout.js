import { Fira_Code, Manrope, Unbounded } from "next/font/google";
import "./globals.css";
import { SHOP } from "@/lib/shop";

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--font-unbounded",
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
});

const fira = Fira_Code({
  subsets: ["latin", "cyrillic"],
  variable: "--font-fira",
});

export const metadata = {
  title: SHOP.name,
  description: "Запись к барберу в Craft Barbershop",
};

const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('craft-theme');
    if (t !== 'dark' && t !== 'light') {
      t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.classList.add(t);
  } catch (e) {
    document.documentElement.classList.add('light');
  }
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${unbounded.variable} ${manrope.variable} ${fira.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
