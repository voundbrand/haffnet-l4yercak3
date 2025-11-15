/**
 * Utility functions for handling event capacity display
 */

export interface CapacityInfo {
  maxCapacity?: number;
  currentRegistrations?: number;
  spotsRemaining?: number;
}

/**
 * Get capacity data from event object
 * Checks both top-level and customProperties for compatibility
 */
export function getCapacityData(event: any): {
  maxCapacity: number | null;
  currentRegistrations: number;
  spotsRemaining: number | null;
  isUnlimited: boolean;
  isFull: boolean;
  isAlmostFull: boolean;
} {
  // Try to get maxCapacity from various locations
  const maxCapacity =
    event.maxCapacity ??
    event.customProperties?.maxCapacity ??
    event.customProperties?.capacity?.max ??
    null;

  // Get current registrations
  const currentRegistrations =
    event.currentRegistrations ??
    event.customProperties?.currentRegistrations ??
    event.customProperties?.capacity?.current ??
    0;

  // Calculate spots remaining
  const spotsRemaining =
    maxCapacity !== null ? maxCapacity - currentRegistrations : null;

  const isUnlimited = maxCapacity === null;
  const isFull = spotsRemaining !== null && spotsRemaining <= 0;
  const isAlmostFull = spotsRemaining !== null && spotsRemaining > 0 && spotsRemaining <= 20;

  return {
    maxCapacity,
    currentRegistrations,
    spotsRemaining,
    isUnlimited,
    isFull,
    isAlmostFull,
  };
}

/**
 * Format capacity display text
 */
export function formatCapacityText(event: any): string {
  const { maxCapacity, currentRegistrations, isUnlimited } = getCapacityData(event);

  if (isUnlimited) {
    return `${currentRegistrations} Teilnehmer`;
  }

  return `${currentRegistrations} / ${maxCapacity} Teilnehmer`;
}

/**
 * Format spots remaining text
 */
export function formatSpotsRemainingText(event: any): string | null {
  const { spotsRemaining, isUnlimited } = getCapacityData(event);

  if (isUnlimited) {
    return "Unbegrenzte Plätze";
  }

  if (spotsRemaining === null || spotsRemaining <= 0) {
    return null;
  }

  return `Noch ${spotsRemaining} Plätze verfügbar`;
}

/**
 * Get capacity warning badge text if needed
 */
export function getCapacityWarning(event: any): string | null {
  const { spotsRemaining, isFull, isAlmostFull, isUnlimited } = getCapacityData(event);

  if (isUnlimited) {
    return null;
  }

  if (isFull) {
    return "Ausgebucht";
  }

  if (isAlmostFull && spotsRemaining !== null) {
    return `Nur noch ${spotsRemaining} Plätze!`;
  }

  return null;
}
