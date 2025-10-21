import { DisplayMode } from "../types";

const chipFormatter = new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 2
});

const currencyFormatter = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  maximumFractionDigits: 2
});

export const formatChips = (chips: number) => chipFormatter.format(chips);

export const formatCash = (chips: number, chipValue: number) =>
  currencyFormatter.format(chips * chipValue);

export const formatByDisplayMode = (
  chips: number,
  chipValue: number,
  mode: DisplayMode
) => {
  return mode === "cash" ? formatCash(chips, chipValue) : `${formatChips(chips)} 筹码`;
};
