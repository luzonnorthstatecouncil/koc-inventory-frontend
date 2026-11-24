import { useCallback, useState } from "react";

/**
 * Local state for a page's modals: which one is open, and the record it's about.
 * Replaces per-page Redux slices that only held "is this modal open / which item".
 *
 *   const modal = useModalState();
 *   modal.open("edit", item);   modal.is("edit")   modal.item   modal.close()
 */
export function useModalState() {
   const [state, setState] = useState({ type: null, item: null });

   const open = useCallback((type, item = null) => setState({ type, item }), []);
   const close = useCallback(() => setState({ type: null, item: null }), []);
   const setItem = useCallback((item) => setState((prev) => ({ ...prev, item })), []);
   const is = useCallback((type) => state.type === type, [state.type]);

   return { type: state.type, item: state.item, open, close, setItem, is };
}
