import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cron-auth';
import { db } from '@/db';
import { fuelPrices, warehouses } from '@/db/schema';
import { createNotification } from '@/features/notifications/api/service';

type FuelEntry = { fuelType: 'RON95' | 'RON92' | 'DO' | 'DIESEL'; priceVnd: number };

async function scrapePetrolimexPrices(): Promise<FuelEntry[]> {
  try {
    const res = await fetch('https://www.petrolimex.com.vn/nd/gia-xang-dau.html', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 0 }
    });
    if (!res.ok) return [];
    const html = await res.text();

    const entries: FuelEntry[] = [];
    // Parse RON95 price
    const ron95 = html.match(/RON\s*95[^0-9]*([0-9]{4,6})/i);
    if (ron95) entries.push({ fuelType: 'RON95', priceVnd: parseInt(ron95[1]) });
    const ron92 = html.match(/RON\s*92[^0-9]*([0-9]{4,6})/i);
    if (ron92) entries.push({ fuelType: 'RON92', priceVnd: parseInt(ron92[1]) });
    const diesel = html.match(/DO\s*0[^0-9]*([0-9]{4,6})/i);
    if (diesel) entries.push({ fuelType: 'DO', priceVnd: parseInt(diesel[1]) });
    return entries;
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const authError = verifyCronRequest(request);
  if (authError) return authError;

  const today = new Date().toISOString().split('T')[0];
  const entries = await scrapePetrolimexPrices();

  if (entries.length === 0) {
    return NextResponse.json({ status: 'no_data', message: 'Could not scrape fuel prices' });
  }

  for (const entry of entries) {
    await db.insert(fuelPrices).values({ ...entry, region: 'national', effectiveDate: today, source: 'petrolimex.com.vn' }).onConflictDoNothing();
  }

  // Notify all orgs
  const orgs = await db.selectDistinct({ orgId: warehouses.orgId }).from(warehouses);
  for (const { orgId } of orgs) {
    const priceText = entries.map((e) => `${e.fuelType}: ${e.priceVnd.toLocaleString('vi-VN')}đ`).join(' | ');
    await createNotification(orgId, {
      sourceType: 'fuel_price',
      title: `Cập nhật giá xăng dầu ${today}`,
      body: priceText
    });
  }

  return NextResponse.json({ status: 'done', entries });
}
