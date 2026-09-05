/**
 * admin shell — SLICE-P3-02: widget-catalog filtered read.
 * State A (quoted): "a support_operator sees only support widgets;
 * an Editor sees only editorial ones" — filtered by requiredPermissionKeys.
 */

import { query } from "../_generated/server";
import { getPermittedWidgetCatalog } from "../lib/authz";

export const getWidgetCatalog = query({
  args: {},
  handler: async (ctx) => {
    // Graceful degrade for the layout's always-on subscription: anonymous
    // and non-staff visitors get an EMPTY catalog (the layout renders a
    // sign-in / no-access state) instead of a thrown error that crashes
    // client render. Per-widget data queries keep their hard role gates.
    try {
      return await getPermittedWidgetCatalog(ctx);
    } catch {
      return [];
    }
  },
});
