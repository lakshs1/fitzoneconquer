import type { Coordinates } from '@/hooks/useGeolocation';

interface ShareAreaImageInput {
  ownerName: string;
  areaName: string;
  durationSeconds: number;
  distanceMeters: number;
  path: Coordinates[];
}

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  return `${mins}m ${secs}s`;
}

function pathBounds(path: Coordinates[]) {
  return path.reduce(
    (bounds, point) => ({
      minLat: Math.min(bounds.minLat, point.lat),
      maxLat: Math.max(bounds.maxLat, point.lat),
      minLng: Math.min(bounds.minLng, point.lng),
      maxLng: Math.max(bounds.maxLng, point.lng),
    }),
    {
      minLat: path[0]?.lat ?? 0,
      maxLat: path[0]?.lat ?? 0,
      minLng: path[0]?.lng ?? 0,
      maxLng: path[0]?.lng ?? 0,
    }
  );
}

export async function createAreaShareImage({
  ownerName,
  areaName,
  durationSeconds,
  distanceMeters,
  path,
}: ShareAreaImageInput): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not create share image');
  }

  const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
  gradient.addColorStop(0, '#0f172a');
  gradient.addColorStop(0.55, '#111827');
  gradient.addColorStop(1, '#312e81');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1080);

  ctx.fillStyle = 'rgba(250, 204, 21, 0.08)';
  for (let i = 0; i < 14; i += 1) {
    ctx.beginPath();
    ctx.arc(80 + i * 82, 160 + (i % 3) * 210, 120, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#facc15';
  ctx.font = '700 44px sans-serif';
  ctx.fillText('FITZONE CONQUER', 72, 96);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 68px sans-serif';
  ctx.fillText(ownerName, 72, 188);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 34px sans-serif';
  ctx.fillText(`captured ${areaName}`, 72, 244);

  const mapX = 72;
  const mapY = 300;
  const mapW = 936;
  const mapH = 540;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.55)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(mapX, mapY, mapW, mapH, 32);
  ctx.fill();
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(mapX, mapY, mapW, mapH, 32);
  ctx.clip();

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
  ctx.lineWidth = 2;
  for (let x = mapX + 48; x < mapX + mapW; x += 72) {
    ctx.beginPath();
    ctx.moveTo(x, mapY);
    ctx.lineTo(x, mapY + mapH);
    ctx.stroke();
  }
  for (let y = mapY + 48; y < mapY + mapH; y += 72) {
    ctx.beginPath();
    ctx.moveTo(mapX, y);
    ctx.lineTo(mapX + mapW, y);
    ctx.stroke();
  }

  if (path.length > 1) {
    const bounds = pathBounds(path);
    const latRange = Math.max(bounds.maxLat - bounds.minLat, 0.00001);
    const lngRange = Math.max(bounds.maxLng - bounds.minLng, 0.00001);
    const padding = 72;

    const toCanvas = (point: Coordinates) => ({
      x: mapX + padding + ((point.lng - bounds.minLng) / lngRange) * (mapW - padding * 2),
      y: mapY + padding + ((bounds.maxLat - point.lat) / latRange) * (mapH - padding * 2),
    });

    ctx.fillStyle = 'rgba(250, 204, 21, 0.18)';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    path.forEach((point, index) => {
      const pos = toCanvas(point);
      if (index === 0) ctx.moveTo(pos.x, pos.y);
      else ctx.lineTo(pos.x, pos.y);
    });
    ctx.stroke();

    const first = toCanvas(path[0]);
    const last = toCanvas(path[path.length - 1]);
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(first.x, first.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(last.x, last.y, 15, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 46px sans-serif';
  ctx.fillText(`${(distanceMeters / 1000).toFixed(2)} km covered`, 72, 920);

  ctx.fillStyle = '#facc15';
  ctx.font = '800 46px sans-serif';
  ctx.fillText(`Completed in ${formatDuration(durationSeconds)}`, 72, 986);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not export share image');

  return new File([blob], 'fitzone-captured-area.png', { type: 'image/png' });
}
