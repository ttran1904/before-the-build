import { redirect } from "next/navigation";

/**
 * Legacy single-page wizard route. Retired in favor of the split
 * Groundwork + Build Book products. Any visit (including bookmarks
 * and old  deep links) lands on the product picker.
 */
export default function LegacyBathroomWizardPage() {
  redirect("/start");
}
