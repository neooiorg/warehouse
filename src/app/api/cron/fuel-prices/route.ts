import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { fuelPrices } from '@/db/schema';
import { createNotification } from '@/features/notifications/api/service';
import { verifyCronRequest } from '@/lib/cron-auth';

// Petrolimex public price API (unofficial scrape endpoint)
const PETROLIMEX_URL = 'https://www.petrolimex.com.vn/tu-lieu/gia-xang-dau.html';

type FuelEntry = {
  fuelType: 'ron95' | 'ron92' | 'diesel' | 'e5';
  pricePerLiter: number;
};

async function scrapeFuelPrices(): Promise<FuelEntry[]> {
  // Attempt to fetch Petrolimex HTML and parse prices
  try {
    const res = await fetch(PETROLIMEX_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WMS-Bot/1.0)' },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    // Parse prices from known table structure (ron95 ~25,000–27,000 VND range sanity check)
    const ron95Match = html.match(/RON\s*95[^<]*?(\d{2,3}[.,]\d{3})/i);
    const ron92Match = html.match(/RON\s*92[^<]*?(\d{2,3}[.,]\d{3})/i);
    const dieselMatch =
      html.match(/DO\s*0\.05[^<]*?(\d{2,3}[.,]\d{3})/i) ??
      html.match(/diesel[^<]*?(\d{2,3}[.,]\d{3})/i);
    const e5Match = html.match(/E5[^<]*?(\d{2,3}[.,]\d{3})/i);

    const parsePrice = (m: RegExpMatchArray | null) =>
      m ? parseFloat(m[1].replace(/[.,]/g, '').replace(/(\d{3})$/, '.$1')) / 1000 : null;

    const entries: FuelEntry[] = [];
    const r95 = parsePrice(ron95Match);
    const r92 = parsePrice(ron92Match);
    const ds = parsePrice(dieselMatch);
    const e5 = parsePrice(e5Match);

    if (r95 && r95 > 15 && r95 < 50) entries.push({ fuelType: 'ron95', pricePerLiter: r95 });
    if (r92 && r92 > 15 && r92 < 50) entries.push({ fuelType: 'ron92', pricePerLiter: r92 });
    if (ds && ds > 10 && ds < 40) entries.push({ fuelType: 'diesel', pricePerLiter: ds });
    if (e5 && e5 > 15 && e5 < 50) entries.push({ fuelType: 'e5', pricePerLiter: e5 });

    if (entries.length === 0) throw new Error('No prices parsed from HTML');
    return entries;
  } catch {
    // Return null to signal failure — caller handles fallback
    return [];
  }
}

export async function GET(request: NextRequest) {
  const authError = verifyCronRequest(request);
  if (authError) return authError;

  const today = new Date().toISOString().slice(0, 10);
  const entries = await scrapeFuelPrices();

  if (entries.length === 0) {
    // Notify about stale data
    const orgs = await db.selectDistinct({ orgId: fuelPrices.orgId }).from(fuelPrices);
    for (const { orgId } of orgs) {
      if (!orgId) continue;
      await createNotification(orgId, {
        sourceType: 'fuel_price',
        title: 'Không lấy được giá xăng dầu hôm nay',
        body: `Hệ thống không crawl được giá xăng từ Petrolimex (${today}). Vui lòng cập nhật thủ công.`
      });
    }
    return NextResponse.json({ status: 'error', message: 'Scrape failed', date: today });
  }

  // Insert global prices (orgId = null)
  await db.insert(fuelPrices).values(
    entries.map((e) => ({
      orgId: null,
      fuelType: e.fuelType,
      pricePerLiter: String(e.pricePerLiter),
      effectiveDate: today,
      source: 'petrolimex_scrape'
    }))
  );

  return NextResponse.json({ status: 'ok', date: today, count: entries.length, prices: entries });
}
