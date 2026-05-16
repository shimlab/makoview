import { useAtomValue, useSetAtom } from "jotai";
import { viewerStateAtom, _viewerScaleAtom, _viewportScrollAtom, _cursorXAtom } from "../store";

export function useViewerSettings() {
  const viewerState = useAtomValue(viewerStateAtom);
  const setScale = useSetAtom(_viewerScaleAtom);
  const setViewportScroll = useSetAtom(_viewportScrollAtom);
  const setCursorX = useSetAtom(_cursorXAtom);
  return { ...viewerState, setScale, setViewportScroll, setCursorX };
}
