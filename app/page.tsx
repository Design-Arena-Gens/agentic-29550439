/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Aspect = "9:16" | "4:5";

function parseAspect(aspect: Aspect) {
  const [w, h] = aspect.split(":").map(Number);
  return { w, h, ratio: w / h };
}

function constrainSize(aspect: Aspect, maxWidth = 540) {
  const { ratio } = parseAspect(aspect);
  const width = maxWidth;
  const height = Math.round(width / ratio);
  return { width, height };
}

export default function Page() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [aspect, setAspect] = useState<Aspect>("9:16");
  const [durationSec, setDurationSec] = useState<number>(60);
  const [isRecording, setIsRecording] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const animRef = useRef<number | null>(null);

  const size = useMemo(() => constrainSize(aspect, 540), [aspect]);

  // Default copy (Tamil)
  const headline =
    "???? ???? ???????????????? Deen Ply Doors ???? perfect choice!";
  const points = [
    "Doors, Plywoods, Interior Items, Iron Doors, WPVC, UPVC ? ??? ????????",
    "Design super, price friendly, quality strong",
    "????? ???????? Bus Stop ???????",
  ];
  const cta = "DM ???????? ? catalog ???? ???????????!";

  // Draw loop with Ken Burns effect
  const drawFrame = (now: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const img = imageRef.current;
    if (!canvas || !ctx || !img) return;

    const elapsed = (now - startTimeRef.current) / 1000;
    const t = Math.min(elapsed / durationSec, 1);

    // Clear
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ken Burns: slow zoom in + pan
    const zoom = 1.05 + t * 0.12;
    const panX = Math.sin(t * Math.PI * 2) * 0.05; // -5%..+5%
    const panY = Math.cos(t * Math.PI * 2) * 0.04; // -4%..+4%

    // Fit image to cover canvas
    const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight) * zoom;
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const centerX = canvas.width / 2 + panX * canvas.width;
    const centerY = canvas.height / 2 + panY * canvas.height;
    const dx = Math.round(centerX - drawW / 2);
    const dy = Math.round(centerY - drawH / 2);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, dx, dy, drawW, drawH);

    // Gradient overlay for text readability
    const grad = ctx.createLinearGradient(0, canvas.height * 0.6, 0, canvas.height);
    grad.addColorStop(0, "rgba(0,0,0,0.0)");
    grad.addColorStop(1, "rgba(0,0,0,0.65)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Watermark/Badge
    const pad = 16;
    ctx.font = "700 16px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    const badge = "Deen Ply Doors";
    const badgeWidth = ctx.measureText(badge).width + 24;
    ctx.fillRect(pad, pad, badgeWidth, 32);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.strokeRect(pad + 0.5, pad + 0.5, badgeWidth - 1, 31);
    ctx.fillStyle = "#fff";
    ctx.fillText(badge, pad + 12, pad + 22);

    // Headline with subtle entrance over first 2 seconds
    const ease = (x: number) => 1 - Math.pow(1 - x, 3);
    const headAlpha = t < 0.05 ? ease(Math.min(elapsed / 2, 1)) : 1;
    ctx.globalAlpha = headAlpha;
    ctx.font = "800 22px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
    ctx.fillStyle = "#eaf2ff";
    wrapText(ctx, headline, pad, canvas.height - 160, canvas.width - pad * 2, 28);
    ctx.globalAlpha = 1;

    // Bullet points staggered
    ctx.font = "600 16px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
    ctx.fillStyle = "#d6e4ff";
    points.forEach((p, i) => {
      const appearAt = 4 + i * 3;
      const alpha = Math.min(Math.max((elapsed - appearAt) / 1.5, 0), 1);
      ctx.globalAlpha = alpha;
      const y = canvas.height - 120 + i * 22;
      ctx.fillText("? " + p, pad, y);
      ctx.globalAlpha = 1;
    });

    // CTA pill
    const ctaAppear = 12;
    const ctaAlpha = Math.min(Math.max((elapsed - ctaAppear) / 1.5, 0), 1);
    if (ctaAlpha > 0) {
      ctx.globalAlpha = ctaAlpha;
      const ctaPaddingX = 12;
      const ctaPaddingY = 8;
      ctx.font = "800 16px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
      const ctaW = ctx.measureText(cta).width + ctaPaddingX * 2;
      const ctaH = 34;
      const ctaX = canvas.width - ctaW - pad;
      const ctaY = canvas.height - ctaH - pad;
      ctx.fillStyle = "#ffb703";
      roundRect(ctx, ctaX, ctaY, ctaW, ctaH, 10);
      ctx.fillStyle = "#1a1a1a";
      ctx.fillText(cta, ctaX + ctaPaddingX, ctaY + 23);
      ctx.globalAlpha = 1;
    }
  };

  // Helpers
  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    const radii = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radii, y);
    ctx.arcTo(x + w, y, x + w, y + h, radii);
    ctx.arcTo(x + w, y + h, x, y + h, radii);
    ctx.arcTo(x, y + h, x, y, radii);
    ctx.arcTo(x, y, x + w, y, radii);
    ctx.closePath();
    ctx.fill();
  }

  function wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) {
    const words = text.split(" ");
    let line = "";
    let currentY = y;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + " ";
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  useEffect(() => {
    if (!canvasRef.current) return;
    const { width, height } = size;
    canvasRef.current.width = width;
    canvasRef.current.height = height;
  }, [size]);

  const handleFile = (f: File) => {
    const url = URL.createObjectURL(f);
    setImageUrl(url);
    setDownloadUrl(null);
  };

  const startPreview = () => {
    if (!canvasRef.current || !imageRef.current) return;
    const loop = (ts: number) => {
      if (!startTimeRef.current) startTimeRef.current = ts;
      drawFrame(ts);
      animRef.current = requestAnimationFrame(loop);
    };
    if (animRef.current) cancelAnimationFrame(animRef.current);
    startTimeRef.current = 0;
    animRef.current = requestAnimationFrame(loop);
  };

  const stopPreview = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = null;
  };

  const startRecording = async () => {
    if (!canvasRef.current || !imageRef.current) return;
    // Note: browsers cannot handle 8K in-browser encoding reliably; generate a webm preview.
    const stream = (canvasRef.current as any).captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setIsRecording(false);
      stopPreview();
    };
    recorderRef.current = recorder;
    setIsRecording(true);
    startPreview();
    recorder.start();
    setTimeout(() => {
      recorder.stop();
    }, durationSec * 1000);
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
  };

  return (
    <main className="card">
      <h1 className="title">Instagram Video (1 min)</h1>
      <p className="subtitle">
        ????????? ????? ???? ??????????? Materials ?????????????? ???????????????????
        Deen Ply Doors?Design super, price friendly, quality strong!
      </p>

      <div className="controls" style={{ marginBottom: 16 }}>
        <div className="row">
          <label>Upload family image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
        <div className="row">
          <label>Instagram ratio</label>
          <select value={aspect} onChange={(e) => setAspect(e.target.value as Aspect)}>
            <option value="9:16">9:16 (Stories/Reels)</option>
            <option value="4:5">4:5 (Feed)</option>
          </select>
        </div>
        <div className="row">
          <label>Duration (seconds)</label>
          <input
            type="number"
            min={5}
            max={60}
            value={durationSec}
            onChange={(e) => setDurationSec(Number(e.target.value))}
          />
        </div>
        <div className="row">
          <label>Actions</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={startPreview} disabled={!imageUrl || isRecording}>
              Preview
            </button>
            {!isRecording ? (
              <button className="btn" onClick={startRecording} disabled={!imageUrl}>
                Generate 1-min WebM
              </button>
            ) : (
              <button className="btn" onClick={stopRecording}>
                Stop
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="canvasWrap" style={{ aspectRatio: aspect.replace(":", " / ") }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
        <div className="overlay">
          <span className="badge">Deen Ply Doors</span>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div className="headline" style={{ maxWidth: 560 }}>{headline}</div>
            <div className="cta">{cta}</div>
          </div>
        </div>
      </div>
      {imageUrl ? (
        <img
          alt="uploaded"
          ref={(el) => (imageRef.current = el)}
          src={imageUrl}
          style={{ display: "none" }}
          onLoad={() => startPreview()}
        />
      ) : null}

      {downloadUrl ? (
        <div className="footerNote">
          Video ready:{" "}
          <a className="brand" href={downloadUrl} download={`deen-ply-instagram-${aspect}.webm`}>
            Download WebM
          </a>
        </div>
      ) : (
        <p className="footerNote">
          ????????: 8K master rendering requires desktop tools. This page generates a high?quality WebM preview in?browser.
        </p>
      )}
    </main>
  );
}

