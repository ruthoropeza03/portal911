"use client";

import { useEffect, useState } from "react";
import {
  FacebookEmbed,
  InstagramEmbed,
  TikTokEmbed,
  XEmbed,
  YouTubeEmbed,
} from "react-social-media-embed";

function detectPlatform(url) {
  const u = url.split("?")[0].toLowerCase();
  if (/instagram\.com\/(p|reel)\//.test(u)) return "instagram";
  if (/facebook\.com\//.test(u)) return "facebook";
  if (/(twitter\.com|x\.com)\/\w+\/status\/\d+/.test(u)) return "x";
  if (/tiktok\.com\/@[\w.]+\/video\/\d+/.test(u)) return "tiktok";
  if (/youtube\.com\/watch\?v=/.test(u) || /youtu\.be\/[\w-]+/.test(u)) return "youtube";
  return null;
}

function useResponsiveEmbedSize(platform) {
  const [size, setSize] = useState({ width: 300, height: 169 });

  useEffect(() => {
    function update() {
      const vw = window.innerWidth;
      const pad = 32;
      const maxW = Math.max(260, Math.min(vw - pad, 560));

      if (platform === "youtube") {
        const w = maxW;
        const h = Math.round((w * 315) / 560);
        setSize({ width: w, height: h });
        return;
      }
      if (platform === "instagram") {
        setSize({ width: Math.min(328, maxW), height: undefined });
        return;
      }
      if (platform === "facebook") {
        setSize({ width: Math.min(500, maxW), height: undefined });
        return;
      }
      if (platform === "x") {
        setSize({ width: Math.min(500, maxW), height: undefined });
        return;
      }
      if (platform === "tiktok") {
        setSize({ width: Math.min(325, maxW), height: undefined });
        return;
      }
      setSize({ width: maxW, height: undefined });
    }

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [platform]);

  return size;
}

export default function SocialEmbed({ url }) {
  const platform = detectPlatform(url);
  const { width, height } = useResponsiveEmbedSize(platform || "facebook");

  if (!platform) {
    return (
      <p className="text-sm text-gray-500 my-4 px-1 break-words">
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-red-600 underline">
          {url}
        </a>
      </p>
    );
  }

  const clean = url.split("?")[0];

  const inner = {
    instagram: <InstagramEmbed url={clean} width={width} captioned />,
    facebook: <FacebookEmbed url={clean} width={width} />,
    x: <XEmbed url={clean} width={width} />,
    tiktok: <TikTokEmbed url={clean} width={width} />,
    youtube: <YouTubeEmbed url={clean} width={width} height={height ?? Math.round((width * 315) / 560)} />,
  }[platform];

  return (
    <div className="social-embed-container my-4 sm:my-6 flex w-full justify-center overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0 touch-manipulation">
      <div className="min-w-0 max-w-full [&_iframe]:max-w-full">{inner}</div>
    </div>
  );
}
