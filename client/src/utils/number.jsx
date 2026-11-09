import numeral from "numeral";

export function numberFormat(num) {
  return numeral(num).format("0,0");
}

export function priceFormat(num) {
  return "฿" + numeral(num).format("0,0");
}
