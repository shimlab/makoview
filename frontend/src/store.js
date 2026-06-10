import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { getTrackBounds, getTotalPixelWidth, genomicToPixel, pixelToGenomic } from "./utils/coordinates";

export const dataAtom = atom(window.__DATA__);
export const isDemoAtom = atom(window.__DEMO__);

export const _cursorXAtom = atom(null);
export const selectedSiteAtom = atom(null);

export const _viewportScrollAtom = atom({ scrollLeft: 0, clientWidth: 0 });

export const _viewerScaleAtom = atom(200);

export const viewerStateAtom = atom((get) => {
  const data = get(dataAtom);

  const scale = get(_viewerScaleAtom);
  const cursorX = get(_cursorXAtom);
  const { scrollLeft, clientWidth } = get(_viewportScrollAtom);

  if (!data || scale === null)
    return {
      bp: { start: 0, end: 0 },
      px: { start: 0, end: 0 },
      scale: 200,
      viewport: { bp: { start: 0, end: 0 }, px: { start: 0, end: 0 }, cursorX: null },
    };

  const coords = getTrackBounds();

  return {
    bp: { start: coords.start, end: coords.end },
    px: { start: 0, end: getTotalPixelWidth() },
    scale,
    viewport: {
      bp: { start: pixelToGenomic(scrollLeft), end: pixelToGenomic(scrollLeft + clientWidth) },
      px: { start: scrollLeft, end: scrollLeft + clientWidth },
      cursorX,
    },
  };
});

export const showTutorialAtom = atomWithStorage("makoview-show-tutorial", true);

export const displayOptionsAtom = atomWithStorage("makoview-display-options", {
  untestedSites: false,
  nonSignificantSites: false,
  significantSites: true,
});

export const selectedTrackPosAtom = atom((get) => {
  const site = get(selectedSiteAtom);
  const data = get(dataAtom);
  const { scale } = get(viewerStateAtom);
  if (!site || !data) return null;
  return genomicToPixel(site.chr_position);
});
