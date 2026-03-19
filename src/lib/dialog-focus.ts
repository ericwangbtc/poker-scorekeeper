interface AutoFocusEvent {
  preventDefault: () => void;
}

export const preventDialogInputAutoFocus = (event: AutoFocusEvent) => {
  event.preventDefault();
};
