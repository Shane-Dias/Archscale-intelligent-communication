import { useEffect } from "react";

let lockCount = 0;
let previousStyles = null;

/** Prevents the document behind an open modal from scrolling. */
export default function useLockBodyScroll() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    if (lockCount === 0) {
      previousStyles = {
        htmlOverflow: html.style.overflow,
        bodyOverflow: body.style.overflow,
        bodyPaddingRight: body.style.paddingRight,
      };

      const scrollbarWidth = window.innerWidth - html.clientWidth;
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";

      // Keep the layout from shifting when the browser scrollbar disappears.
      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }

    lockCount += 1;

    return () => {
      lockCount -= 1;

      if (lockCount === 0 && previousStyles) {
        html.style.overflow = previousStyles.htmlOverflow;
        body.style.overflow = previousStyles.bodyOverflow;
        body.style.paddingRight = previousStyles.bodyPaddingRight;
        previousStyles = null;
      }
    };
  }, []);
}
