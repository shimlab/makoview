import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { getTrackBounds, getTotalPixelWidth, genomicToPixel } from "./utils/coordinates";

export const dataAtom = atom(window.__DATA__);
export const isDemoAtom = atom(window.__DEMO__);

export const viewerScaleAtom = atom(200);
export const cursorXAtom = atom(null);
export const selectedSiteAtom = atom(null);

export const viewerSettingsAtom = atom((get) => {
  const data = get(dataAtom);
  const scale = get(viewerScaleAtom);

  if (!data || scale === null) return { start_bp: 0, end_bp: 0, width: 0, scale: 200 };
  const metadata = data.metadata;
  const coords = getTrackBounds(metadata, scale);
  return { start_bp: coords.start, end_bp: coords.end, width: getTotalPixelWidth(metadata, scale), scale };
});

export const displayOptionsAtom = atomWithStorage("makoview-display-options", {
  untestedSites: true,
  nonSignificantSites: true,
  significantSites: true,
});

export const selectedTrackPosAtom = atom((get) => {
  const site = get(selectedSiteAtom);
  const data = get(dataAtom);
  const { scale } = get(viewerSettingsAtom);
  if (!site || !data) return null;
  return genomicToPixel(site.chr_position, data.metadata, scale);
});
