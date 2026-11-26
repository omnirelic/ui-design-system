// Test miroir de web/src/admin/lib/__tests__/live-resources.test.ts de Chez la Petite (mêmes cas, mêmes assertions).
import { describe, it, expect } from "vitest";
import { liveResourceFor } from "../src/web/state/live-resources";

describe("liveResourceFor — URL admin → ressource temps réel", () => {
  it.each([
    ["/api/orders", "orders"],
    ["/api/orders?view=clients", "orders"],
    ["/api/orders/1791355742991", "orders"],
    ["/api/orders/drafts", "drafts"],
    ["/api/orders/draft/lock", "drafts"],
    ["/api/users", "users"],
    ["/api/roles", "users"],
    ["/api/abuse/banned-phones", "users"],
    ["/api/stores?kind=kiosk", "stores"],
    ["/api/partners/agents", "partners"],
    ["/api/devices/sessions", "devices"],
    ["/api/couriers", "delivery"],
    ["/api/vehicles/12", "delivery"],
    ["/api/bags/dispatch", "delivery"],
    ["/api/support?thread_id=9", "support"],
    ["/api/support/access-grants/live", "access_grants"],
    ["/api/support/access-grants/mine", "access_grants"],
    ["/api/pages", "documents"],
    ["/api/jobs/applications", "jobs"],
    ["/api/influencers/42", "influencers"],
    ["/api/menu/items", "catalog"],
    ["/api/menu/categories/c7", "catalog"],
    ["/api/menu/purchase-lists", "catalog"],
    ["/api/menu/purchase-lists/pl1?action=publish", "catalog"],
    ["/api/menu/ingredients?kind=container", "catalog"],
    ["/api/menu/conformity", "catalog"],
    ["/api/print/failures", "delivery"],
    ["/api/settings", "settings"],
  ])("%s → %s", (url, resource) => expect(liveResourceFor(url)).toBe(resource));

  it("hors périmètre : aucun abonnement (menu a sa propre room publique, analytics/settings non poussés, conversations WhatsApp = événement socket dédié, sans filet périodique)", () => {
    for (const url of ["/api/support/conversations", "/api/support/conversations?filter=todo&limit=50", "/api/support/conversations/abc123/messages", "/api/settings?health=db", "/api/analytics/summary", "/api/orders-export", "/api/menu/featured", "/api/menu/featured?x=1", "/api/usersX", null])
      expect(liveResourceFor(url)).toBeNull();
  });
});
