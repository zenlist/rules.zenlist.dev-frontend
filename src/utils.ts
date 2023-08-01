/**
 * Build up class names by concatenating multiple bits
 */
export function classNames(
  ...strings: (string | null | undefined | boolean)[]
): string {
  let baseString = "";
  for (const item of strings) {
    if (!!item && item !== true) {
      baseString += " " + item;
    }
  }
  return baseString;
}
