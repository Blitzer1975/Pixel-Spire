import { useEffect, useRef } from 'react';
import { getSkinSprite, getSpriteAtlas, SpriteName } from '../game/sprites';
import { PlayerPose, SkinId, TILE } from '../game/types';

interface PixelSpritePreviewProps {
  sprite?: SpriteName;
  skin?: SkinId;
  pose?: PlayerPose;
  size?: number;
  label: string;
}

export function PixelSpritePreview({
  sprite,
  skin,
  pose = 'idle',
  size = 32,
  label,
}: PixelSpritePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, TILE, TILE);
    if (skin) {
      ctx.drawImage(getSkinSprite(skin, pose), 0, 0);
    } else if (sprite) {
      const atlas = getSpriteAtlas();
      ctx.drawImage(atlas[sprite], 0, 0);
    }
  }, [sprite, skin, pose]);

  return (
    <canvas
      ref={canvasRef}
      width={TILE}
      height={TILE}
      style={{ width: size, height: size }}
      aria-label={label}
      className="pixelated shrink-0"
    />
  );
}
