import Script from "next/script";
import "./telegram-app.css";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1c1612",
};

export const metadata = {
  title: "Запись · Craft Barbershop",
};

export default function TelegramLayout({ children }) {
  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />
      {children}
    </>
  );
}
