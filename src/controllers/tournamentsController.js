import { getDbBySport } from "../utils/dbUtils.js";
import { dbCS2, dbLOL, dbDOTA2 } from "../db.js";

/**
 * Get tournaments for WordPress shortcode
 * Filters by date range, tier, and determines finished/upcoming status
 * If sport is null/undefined, queries all sports (cs2, lol, dota2)
 */
export const getTournaments = async (
  offset = 0,
  limit = 1000,
  filters = {},
  sport = null
) => {
  // If no sport specified, query all sports
  const sportsToQuery = sport ? [sport] : ["cs2", "lol", "dota2"]; // Add more sports as needed

  let allResults = [];

  // Query each sport database
  for (const currentSport of sportsToQuery) {
    const db = getDbBySport(currentSport);
    let query = `SELECT * FROM competitions`;
    const params = [];
    const conditions = [];

    // Filter by sport (always include sport_alias in results)
    conditions.push("sport_alias = ?");
    params.push(currentSport);

    // Year filter (for 2025-2026) - applied first as base range
    let dateRangeStart = null;
    let dateRangeEnd = null;

    if (filters.year_range) {
      const { start_year, end_year } = filters.year_range;
      if (start_year && end_year) {
        dateRangeStart = new Date(`${start_year}-01-01`).getTime();
        dateRangeEnd = new Date(`${end_year}-12-31T23:59:59Z`).getTime();
      }
    }

    // Date range filtering - narrows down the year range if provided
    if (filters.customRange) {
      const { from, to } = filters.customRange;
      if (from && to) {
        const fromTimestamp = new Date(from).getTime();
        const toTimestamp = new Date(`${to}T23:59:59Z`).getTime();

        // If year range exists, use intersection
        if (dateRangeStart !== null && dateRangeEnd !== null) {
          dateRangeStart = Math.max(dateRangeStart, fromTimestamp);
          dateRangeEnd = Math.min(dateRangeEnd, toTimestamp);
        } else {
          dateRangeStart = fromTimestamp;
          dateRangeEnd = toTimestamp;
        }
      }
    } else if (filters.start_date && filters.end_date) {
      const fromTimestamp = new Date(filters.start_date).getTime();
      const toTimestamp = new Date(`${filters.end_date}T23:59:59Z`).getTime();

      // If year range exists, use intersection
      if (dateRangeStart !== null && dateRangeEnd !== null) {
        dateRangeStart = Math.max(dateRangeStart, fromTimestamp);
        dateRangeEnd = Math.min(dateRangeEnd, toTimestamp);
      } else {
        dateRangeStart = fromTimestamp;
        dateRangeEnd = toTimestamp;
      }
    }

    // Apply date range condition
    if (dateRangeStart !== null && dateRangeEnd !== null) {
      conditions.push(`start_date BETWEEN ? AND ?`);
      params.push(dateRangeStart, dateRangeEnd);
    }

    // Filter by tier - S and A always included, B and C only if they have fixtures
    // Note: has_fixtures is a WordPress field, so we'll filter by fixture_count > 0 for B/C
    if (filters.tier_filter) {
      // This will be handled in the WHERE clause
      // We want: (tier IN ('S', 'A')) OR (tier IN ('B', 'C') AND fixture_count > 0)
      conditions.push(`(
        tier IN ('S', 'A') 
        OR (tier IN ('B', 'C') AND fixture_count > 0)
      )`);
    } else if (filters.tier) {
      // If specific tier is requested
      conditions.push(`tier = ?`);
      params.push(filters.tier.toUpperCase());
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(" AND ");
    }

    // Order by start_date ASC
    query += ` ORDER BY start_date ASC`;

    // Don't apply LIMIT/OFFSET here - we'll do it after combining all sports
    // This ensures we get all tournaments from all sports, then paginate the combined results

    try {
      const [rows] = await db.execute(query, params);
      allResults = allResults.concat(rows);
    } catch (error) {
      console.error(`Error querying ${currentSport} database:`, error);
      // Continue with other sports even if one fails
    }
  }

  // Process all rows to determine finished/upcoming and format for WordPress
  const today = Date.now();
  const todayDate = new Date(today);

  const processed = allResults.map((row) => {
    // Determine status group based on current date vs tournament dates
    // Rule: If current date is greater than tournament end_date, it's finished
    // Otherwise, it's live_upcoming
    const status = (row.status || "").toLowerCase().trim();
    let isFinished = false;

    // Primary check: Compare end_date with current date
    // If end_date exists and is less than or equal to today, tournament is finished
    if (row.end_date) {
      const endDate = new Date(row.end_date);
      // Compare timestamps: if end_date <= today, tournament is finished
      isFinished = row.end_date <= today;
    } else if (row.start_date) {
      // Fallback: If no end_date but has start_date
      // Default to live_upcoming if no end_date (can't determine if finished)
      isFinished = false;
    }

    // Override: If status explicitly says "ended" or "finished", mark as finished
    if (status === "ended" || status === "finished") {
      isFinished = true;
    }

    const groupKey = isFinished ? "finished" : "live_upcoming";

    // Format dates
    const startDate = row.start_date ? new Date(row.start_date) : null;
    const endDate = row.end_date ? new Date(row.end_date) : null;

    return {
      // API fields
      id: row.id,
      name: row.name,
      start_date: row.start_date,
      end_date: row.end_date,
      prize_pool_usd: row.prize_pool_usd,
      type: row.type,
      status: status,
      tier: row.tier || "",
      sport_alias: row.sport_alias || "",
      location: row.location || "",
      organizer: row.organizer || "",

      // Processed fields for WordPress
      group_key: groupKey,
      start_time_formatted: startDate
        ? startDate
            .toLocaleDateString("en-US", { month: "short", day: "numeric" })
            .toUpperCase()
        : "",
      end_time_formatted: endDate
        ? endDate
            .toLocaleDateString("en-US", { month: "short", day: "numeric" })
            .toUpperCase()
        : "",
      month_key: startDate
        ? startDate.getFullYear() +
          "-" +
          String(startDate.getMonth() + 1).padStart(2, "0")
        : "", // YYYY-MM format
      year: startDate ? startDate.getFullYear() : null,
    };
  });

  // Sort all results by start_date ASC (across all sports)
  processed.sort((a, b) => {
    const dateA = a.start_date || 0;
    const dateB = b.start_date || 0;
    return dateA - dateB;
  });

  // Apply offset and limit to the combined results
  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 1000;
  const safeOffset = Number.isInteger(offset) && offset >= 0 ? offset : 0;
  const paginatedResults = processed.slice(safeOffset, safeOffset + safeLimit);

  return paginatedResults;
};
