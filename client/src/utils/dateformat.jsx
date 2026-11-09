import moment from "moment";

export function dateFormat(date) {
  return moment(date).format("D MMM YYYY");
}
