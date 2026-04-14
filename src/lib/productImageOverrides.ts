import tulleWhite from "@/assets/products/tulle-curtains.jpg";
import tulleIvory from "@/assets/products/tulle-ivory.jpg";
import tulleLightGrey from "@/assets/products/tulle-lightgrey.jpg";
import blackoutBlue from "@/assets/products/blackout-curtains.jpg";
import blackoutGraphite from "@/assets/products/blackout-graphite.jpg";
import blackoutChocolate from "@/assets/products/blackout-chocolate.jpg";
import linenNatural from "@/assets/products/linen-curtains.jpg";
import linenGrey from "@/assets/products/linen-grey.jpg";
import linenBeige from "@/assets/products/linen-beige.jpg";
import alpineTerracotta from "@/assets/products/alpine-plaid.jpg";
import alpineOlive from "@/assets/products/alpine-olive.jpg";
import alpineBeige from "@/assets/products/alpine-beige.jpg";
import jacquardGold from "@/assets/products/jacquard-bedspread.jpg";
import jacquardSilver from "@/assets/products/jacquard-silver.jpg";
import jacquardBurgundy from "@/assets/products/jacquard-burgundy.jpg";
import quiltedMilky from "@/assets/products/quilted-bedspread.jpg";
import quiltedGrey from "@/assets/products/quilted-grey.jpg";
import quiltedPink from "@/assets/products/quilted-pink.jpg";
import kitchenLavender from "@/assets/products/kitchen-towels.jpg";
import kitchenOlive from "@/assets/products/kitchen-olive.jpg";
import kitchenTerracotta from "@/assets/products/kitchen-terracotta.jpg";
import waffleWhite from "@/assets/products/waffle-towels.jpg";
import waffleGrey from "@/assets/products/waffle-grey.jpg";
import waffleBeige from "@/assets/products/waffle-beige.jpg";
import terryWhite from "@/assets/products/terry-towel.jpg";
import terryMint from "@/assets/products/terry-mint.jpg";
import terryCoral from "@/assets/products/terry-coral.jpg";
import sachetLavender from "@/assets/products/lavender-sachet.jpg";
import sachetWhite from "@/assets/products/sachet-white.jpg";
import sachetPink from "@/assets/products/sachet-pink.jpg";
import pillowcaseOlive from "@/assets/products/provence-pillowcase.jpg";
import pillowcaseLavender from "@/assets/products/pillowcase-lavender.jpg";
import pillowcaseBeige from "@/assets/products/pillowcase-beige.jpg";
import bohoTerracotta from "@/assets/products/boho-cushion.jpg";
import bohoMustard from "@/assets/products/boho-mustard.jpg";
import bohoIndigo from "@/assets/products/boho-indigo.jpg";

const productImageOverrides: Record<string, string[]> = {
  "a8f4395a-1859-4b1c-b645-e4ab69b8d7af": [tulleWhite, tulleIvory, tulleLightGrey],
  "765be1bb-4f03-45e0-a7c8-15938501b31e": [blackoutBlue, blackoutGraphite, blackoutChocolate],
  "73e8b6c2-4673-443b-8991-3ac459db83ba": [linenNatural, linenGrey, linenBeige],
  "49b7b39d-0f6c-410d-9951-50aefd1f55e6": [alpineTerracotta, alpineOlive, alpineBeige],
  "fd977143-d326-40f0-807b-ae4a1abfeb74": [jacquardGold, jacquardSilver, jacquardBurgundy],
  "0569dccd-df29-438a-9cc0-bcde7f51281f": [quiltedMilky, quiltedGrey, quiltedPink],
  "df7e7bce-a0d0-4664-875c-b1eda0d3aa08": [kitchenLavender, kitchenOlive, kitchenTerracotta],
  "a4b89db8-27b5-4c94-ace6-f7761988a816": [waffleWhite, waffleGrey, waffleBeige],
  "a4f41c98-68e7-422d-881a-0362f69e2e65": [terryWhite, terryMint, terryCoral],
  "215c40db-ec21-4b62-9069-d4e7a1aae555": [sachetLavender, sachetWhite, sachetPink],
  "ebfd513f-2167-44af-bb90-c57a1ec82540": [pillowcaseOlive, pillowcaseLavender, pillowcaseBeige],
  "dc727bc0-96af-4735-8336-fc97ec733dc2": [bohoTerracotta, bohoMustard, bohoIndigo],
};

type ProductImageSource = {
  id: string;
  images?: string[] | null;
  image_url?: string | null;
};

export function getProductImages(product: ProductImageSource): string[] {
  const overridden = productImageOverrides[product.id];

  if (overridden?.length) {
    return overridden;
  }

  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images;
  }

  return product.image_url ? [product.image_url] : [];
}
