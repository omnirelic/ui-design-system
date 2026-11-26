// Tests miroir de web/src/ui/__tests__/Thumbnail.test.tsx de Chez la Petite ; seuls les imports changent.
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Thumbnail } from "../src/web/Thumbnail";

describe("Thumbnail", () => {
  it("rend une <img> avec l'URL transformée quand src est fourni", () => {
    const html = renderToStaticMarkup(
      <Thumbnail src="https://res.cloudinary.com/demo/image/upload/v1/x.jpg" size={40} />,
    );
    expect(html).toContain("<img");
    expect(html).toContain("w_80,h_80,c_fill"); // size*2
  });

  it("rend le placeholder (svg, pas d'img) quand src est absent", () => {
    const html = renderToStaticMarkup(<Thumbnail src={null} size={40} />);
    expect(html).not.toContain("<img");
    expect(html).toContain("<svg");
    expect(html).toContain('aria-label="Aucune image"');
  });
});
