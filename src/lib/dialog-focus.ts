export function fitDialogToVisualViewport(dialog: HTMLDivElement | null) {
  if (!dialog) return;
  const viewport = window.visualViewport;
  if (!viewport) return;

  const update = () => {
    dialog.style.setProperty("--dialog-viewport-height", `${viewport.height}px`);
    dialog.style.setProperty("--dialog-viewport-top", `${viewport.offsetTop}px`);
  };
  update();
  viewport.addEventListener("resize", update);
  viewport.addEventListener("scroll", update);
  return () => {
    viewport.removeEventListener("resize", update);
    viewport.removeEventListener("scroll", update);
  };
}

export function focusDialogHeading(event: Event) {
  if (!(event.target instanceof HTMLElement)) return;
  const heading = event.target.querySelector<HTMLElement>("[data-dialog-heading]");
  if (!heading) return;
  event.preventDefault();
  heading.focus({ preventScroll: true });
}
