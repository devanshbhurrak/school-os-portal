"use client";

import { NeedsAttention } from "../needs-attention";

/**
 * Thin wrapper that slots the existing NeedsAttention component into the
 * dashboard widget grid.  NeedsAttention already renders null when there are
 * no alerts, so this component can be rendered unconditionally.
 */
export function DataQualityWidget() {
  return <NeedsAttention />;
}
