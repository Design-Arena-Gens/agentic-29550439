export const metadata = {
  title: "Deen Ply Doors ? Instagram Video Generator",
  description:
    "Create 1-minute Instagram promo videos with Tamil copy for Deen Ply Doors.",
};

import "./globals.css";
import React from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ta">
      <body>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span className="brand">Deen Ply Doors</span>
            <a href="https://agentic-29550439.vercel.app" className="brand">agentic-29550439</a>
          </div>
          {children}
        </div>
      </body>
    </html>
  );
}

