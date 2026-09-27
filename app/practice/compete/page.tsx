"use client";

import { CompetitionPlay } from "@/components/CompetitionPlay";
import { useStore } from "@/lib/store";

export default function CompetePage() {
  const store = useStore();
  return <CompetitionPlay importedDoe={store.importedDoe} />;
}
