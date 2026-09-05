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
    return await getPermittedWidgetCatalog(ctx);
  },
});
