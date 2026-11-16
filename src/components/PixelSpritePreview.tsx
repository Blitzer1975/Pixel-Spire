import { useEffect, useRef } from 'react';
import { getSkinSprite, getSpriteAtlas, SpriteName } from '../game/sprites';
import { PlayerPose, SkinId, TILE } from '../game/types';

interface PixelSpritePreviewProps {
  sprite?: SpriteName;
  skin?: SkinId;
  pose?: PlayerPose;
  size?: number;
  label: string;
  mystery?: boolean;
}

export function PixelSpritePreview({
  sprite,
  skin,
  pose = 'idle',
  size = 32,
  label,
  mystery = false,
}: PixelSpritePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, TILE, TILE);

    if (mystery) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(2, 1, 12, 14);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(3, 2, 10, 12);
      ctx.fillStyle = '#c084fc';
      // 16x16 pixel "?" glyph
      ctx.fillRect(6, 4, 4, 1);
      ctx.fillRect(5, 5, 2, 1);
      ctx.fillRect(9, 5, 2, 2);
      ctx.fillRect(7, 7, 2, 2);
      ctx.fillRect(7, 11, 2, 2);
      return;
    }

    if (skin) {
      ctx.drawImage(getSkinSprite(skin, pose), 0, 0);
    } else if (sprite) {
      const atlas = getSpriteAtlas();
      ctx.drawImage(atlas[sprite], 0, 0);
    }
  }, [sprite, skin, pose, mystery]);

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
