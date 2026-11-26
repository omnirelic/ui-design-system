// Parité de @omnirelic/ui-design-system avec le masquage, la recherche stricte et la visibilité des montants de Chez la Petite (web/src/admin/lib : mask-phone.ts,
// format-phone.ts, phone-search.ts, mask-amounts.ts, orders-amounts.ts, phone-actions.ts, order-place.ts ; conversation-lookup.ts ; admin/item/item-search.ts ;
// admin/whatsapp/conversation-search.ts ; AddressRef.tsx). Rejoue le paquet contre les sorties du VRAI code de CLP : 766 numéros fabriqués, 45 termes de recherche,
// 42 notes de texte libre, 13 jeux de rôles x 7 onglets x 2 états. Le kit d'omnirelic (engine/packages/kit) rejoue les mêmes valeurs : les deux copies ne dérivent pas.
import { describe, expect, it } from "vitest";
import { DESK_COUNTRIES, buildDeskPhone, isValidDeskPhone, parseDeskPhone, searchDeskCountries } from "../src/web/desk-countries";
import { conversationPhoneKey } from "../src/web/conversation-key";
import { formatPhoneGrouped } from "../src/web/phone-grouping";
import { CLP_MTN_PREFIXES, CLP_ORANGE_PREFIXES, detectAdminMobileOperator, isMaskedPhoneText, maskPhoneText, maskedPhoneParts } from "../src/web/phone-mask";
import { PHONE_SEARCH_MIN_DIGITS, isShortPhoneTerm, phoneSearchTermDigits } from "../src/web/phone-search";
import { SEARCH_PAGE_SIZE, filterByWords, foldAccents, mergeSearchResults, needsServerSearch, normalizeSearch, searchKeywordIndex, searchWords } from "../src/web/strict-search";
import { maskAmounts } from "../src/web/mask-amounts";
import { ordersAmountsAccess } from "../src/web/amounts-access";
import { canRevealPhone, phoneRank } from "../src/web/phone-rank";
import { phoneActions } from "../src/web/phone-actions";
import { orderPlaceRowLabel, orderPlaceText } from "../src/web/place-text";
import { OUT_OF_ZONE, formatKm, quoteTarget } from "../src/web/AddressRef";
import { THROWS, fromGolden, golden, json, unwrap } from "./golden/lot7";

const M = golden("clp-phone-mask.json");
const S = golden("clp-phone-search.json");
const T = golden("clp-text-search.json");
const A = golden("clp-amounts.json");
const P = golden("clp-place.json");

describe("parité CLP — numéro masqué (mask-phone.ts)", () => {
  it("maskPhoneText, maskedPhoneParts, isMaskedPhoneText, formatPhoneGrouped : tout le jeu", () => {
    expect(M.phones.length).toBeGreaterThan(700);
    for (const r of M.phones) {
      const x = fromGolden(r.input) as string;
      expect([r.input, maskPhoneText(x)]).toEqual([r.input, unwrap(r.webMaskPhone)]);
      expect([r.input, json(maskedPhoneParts(x))]).toEqual([r.input, json(unwrap(r.webParts))]);
      expect([r.input, isMaskedPhoneText(x)]).toEqual([r.input, unwrap(r.webIsMasked)]);
      expect([r.input, formatPhoneGrouped(x)]).toEqual([r.input, unwrap(r.formatPhoneDisplay)]);
    }
  });
  it("idempotent, et jamais plus de 2 chiffres de fin lisibles", () => {
    for (const r of M.phones) {
      const once = maskPhoneText(fromGolden(r.input) as string);
      expect([r.input, maskPhoneText(once)]).toEqual([r.input, once]);
    }
    for (const raw of ["+237690000011", "690000011", "+33600000078", "+14155550123"]) expect(maskPhoneText(raw).replace(/\D/g, "").replace(/^(237|33|1)/, "").length).toBeLessThanOrEqual(2);
  });
  it("opérateur : tables de CLP (20 Orange, 19 MTN)", () => {
    for (const o of M.operators) expect([o.input, detectAdminMobileOperator(o.input)]).toEqual([o.input, o.web]);
    expect([CLP_ORANGE_PREFIXES.size, CLP_MTN_PREFIXES.size]).toEqual([20, 19]);
  });
});

describe("parité CLP — pays du bureau, clé de conversation", () => {
  it("60 pays, parse, recherche, build", () => {
    expect(json(DESK_COUNTRIES)).toEqual(S.countries.list);
    for (const p of S.countries.parse) {
      const want = unwrap(p.result);
      if (want === THROWS) expect(() => parseDeskPhone(fromGolden(p.input) as string)).toThrow();
      else expect([p.input, json(parseDeskPhone(p.input))]).toEqual([p.input, want]);
    }
    for (const s of S.countries.search) {
      expect([s.q, json(searchDeskCountries(s.q))]).toEqual([s.q, s.limit8]);
      expect([s.q, json(searchDeskCountries(s.q, 3))]).toEqual([s.q, s.limit3]);
    }
    for (const b of S.countries.build) {
      const c = DESK_COUNTRIES.find((x) => x.iso === b.iso)!;
      expect([b.iso, b.n, buildDeskPhone(c, b.n), isValidDeskPhone(c, b.n)]).toEqual([b.iso, b.n, b.result, b.valid]);
    }
  });
  it("conversationPhoneKey : tout le jeu", () => {
    for (const r of P.convKey) expect([r.input, conversationPhoneKey(fromGolden(r.input) as string)]).toEqual([r.input, unwrap(r.result)]);
  });
});

describe("parité CLP — recherche par numéro côté écran (phone-search.ts)", () => {
  it("6 chiffres minimum ; CLP lève sur un terme non texte, le paquet aussi", () => {
    expect(PHONE_SEARCH_MIN_DIGITS).toBe(S.search.constants.min);
    for (const t of S.search.terms) {
      const x = fromGolden(t.input) as string;
      for (const [fn, key] of [[phoneSearchTermDigits, "webDigits"], [isShortPhoneTerm, "webShort"]] as const) {
        const want = unwrap(t[key]);
        if (want === THROWS) expect(() => fn(x)).toThrow();
        else expect([t.input, fn(x)]).toEqual([t.input, want]);
      }
    }
  });
});

describe("parité CLP — recherche stricte", () => {
  const ITEMS = T.conversationItems as { id: string; name: string; phoneMasked: string; lastMessage: { preview: string } | null; lastMessageAt: string; currentOrder: { number: string | null } | null }[];
  const hay = (c: (typeof ITEMS)[number], extra: string[] = []) => [c.name, c.lastMessage ? c.lastMessage.preview.trim() : "Aucun message", c.phoneMasked, c.currentOrder?.number ?? "", ...extra];
  const KW: Record<string, string[]> = { 2: ["vip", "livraison express"], 3: ["Chat Site"] };
  it("normalizeSearch : accents, ligatures, ß, CJK", () => {
    for (const n of T.normalize) expect([n.input, normalizeSearch(n.input)]).toEqual([n.input, n.result]);
    expect(searchWords("  !! ")).toEqual([]);
    expect(foldAccents("Seuil « bientôt épuisé »")).toBe("seuil « bientot epuise »");
  });
  it("filterByWords = filterConversations, avec et sans mots-clés", () => {
    for (const q of T.conversations) {
      expect([q.q, filterByWords(ITEMS, q.q, (c) => hay(c)).map((c) => c.id)]).toEqual([q.q, q.ids]);
      expect([q.q, filterByWords(ITEMS, q.q, (c) => hay(c, KW[c.id] ?? [])).map((c) => c.id)]).toEqual([q.q, q.idsKw]);
    }
  });
  it("mergeSearchResults, needsServerSearch", () => {
    const pick = (ids: string[] | undefined) => ids?.map((id) => ITEMS.find((i) => i.id === id)!);
    for (const m of T.merge) expect([m.local, m.server, mergeSearchResults(pick(m.local)!, pick(m.server)).map((c) => c.id)]).toEqual([m.local, m.server, m.result]);
    for (const n of T.needs) expect([n.n, n.q, needsServerSearch(Array.from({ length: n.n }), n.q)]).toEqual([n.n, n.q, n.result]);
    expect(SEARCH_PAGE_SIZE).toBe(50);
  });
  it("searchKeywordIndex = searchItemConfigs", () => {
    for (const q of T.items) expect([q.q, searchKeywordIndex(q.q, T.itemIndex).map((e: { label: string }) => e.label)]).toEqual([q.q, q.labels]);
  });
});

describe("parité CLP — visibilité des montants et des numéros", () => {
  it("ordersAmountsAccess : 182 combinaisons", () => {
    expect(A.access).toHaveLength(182);
    for (const a of A.access) expect([a.roles, a.tab, a.toggled, ordersAmountsAccess(a.roles, a.tab, a.toggled)]).toEqual([a.roles, a.tab, a.toggled, a.result]);
  });
  it("maskAmounts", () => { for (const m of A.mask) expect([m.input, maskAmounts(m.input)]).toEqual([m.input, m.result]); });
  it("phoneRank, canRevealPhone, phoneActions", () => {
    for (const r of A.rank) expect([r.admin, phoneRank(fromGolden(r.admin) as never)]).toEqual([r.admin, r.result]);
    for (const r of A.reveal) expect([r.rank, r.purpose, canRevealPhone(r.rank, r.purpose)]).toEqual([r.rank, r.purpose, r.result]);
    for (const a of A.actions) expect([a.rank, json(phoneActions(a.rank))]).toEqual([a.rank, a.actions]);
  });
});

describe("parité CLP — adresse (AddressRef.tsx, order-place.ts)", () => {
  it("orderPlaceText, orderPlaceRowLabel", () => {
    for (const t of P.text) expect([t.a, t.q, orderPlaceText(t.a, t.q)]).toEqual([t.a, t.q, t.result]);
    for (const t of P.row) expect([t.a, orderPlaceRowLabel(fromGolden(t.a) as string)]).toEqual([t.a, t.result]);
  });
  it("formatKm, quoteTarget, badge « Hors zone »", () => {
    for (const k of P.addr.km) expect([k.km, formatKm(k.km)]).toEqual([k.km, k.result]);
    const sources = [{ lat: 4.05, lng: 9.7 }, { neighborhoodId: "akwa" }, { lat: 4.05, lng: 9.7, neighborhoodId: "akwa" }, { instructions: "x" }, { lat: 4.05 }, { lng: 9.7, neighborhoodId: "n" }, {}, { lat: NaN, lng: 1 }, { lat: Infinity, lng: 1, neighborhoodId: "n" }, { lat: 0, lng: 0 }, { neighborhoodId: "" }];
    sources.forEach((a, i) => expect(json(quoteTarget(a))).toEqual(unwrap(P.addr.target[i].result)));
    expect(OUT_OF_ZONE).toEqual(P.addr.outOfZone);
  });
});
