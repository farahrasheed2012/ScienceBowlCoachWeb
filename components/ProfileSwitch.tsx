"use client";

import { useStore } from "@/lib/store";

export function ProfileSwitch() {
  const store = useStore();
  if (store.profiles.length < 1) return null;
  return (
    <label className="profile-switch">
      <span className="faint">Studying as </span>
      <select
        value={store.profileId}
        onChange={(event) => store.switchProfile(event.target.value)}
        aria-label="Who is studying"
      >
        {store.profiles.map((profile) => (
          <option key={profile.id} value={profile.id}>{profile.name}</option>
        ))}
      </select>
    </label>
  );
}
