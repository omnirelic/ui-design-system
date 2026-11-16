import { describe, expect, it } from "vitest";
import { PASTILLE_TONES, STATUS_TONE, statusTone } from "../src/web/pastille-model";

// OrderFsm vit dans @omnirelic/kit (hors de ce paquet) : ses états sont recopiés ici ; à resynchroniser si la FSM change.
const ORDER_FSM_STATES = ["created", "pending_payment", "confirmed", "queued", "processing", "ready_for_pickup", "assigned_courier", "picked_up", "on_the_way", "arrived", "delivered", "cancelled"];

describe("STATUS_TONE", () => {
  it("couvre chaque état de commande, avec un ton valide", () => {
    for (const s of ORDER_FSM_STATES) expect(PASTILLE_TONES).toContain(STATUS_TONE[s]);
  });
  it("un statut inconnu reste neutre", () => expect(statusTone("inconnu")).toBe("neutral"));
});
