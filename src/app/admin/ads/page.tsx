import type { Metadata } from "next";

import { AdsAdminPanel } from "@/components/admin/AdsAdminPanel";

export const metadata: Metadata = {
  title: "Admin — anons",
  robots: { index: false, follow: false },
};

export default function AdminAdsPage() {
  return <AdsAdminPanel />;
}

