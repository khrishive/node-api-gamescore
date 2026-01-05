import mysql from 'mysql2/promise';
import axios from 'axios';
import dotenv from 'dotenv';
import { getDbBySport } from '../utils/dbUtils.js';

dotenv.config();

/**
 * Validate required environment variables
 */
const requiredEnv = ['GAME_SCORE_API', 'GAME_SCORE_APIKEY'];
requiredEnv.forEach(name => {
  if (!process.env[name]) {
    throw new Error(`❌ Missing environment variable ${name}`);
  }
});

const API_URL = `${process.env.GAME_SCORE_API}/fixtures`;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

// Default sport (can be overridden by CLI)
const sport = process.argv[2] || 'dota2';

/**
 * Generate date ranges day by day between two dates (YYYY-MM-DD).
 */
function generateDateRanges(startDate, endDate) {
  const ranges = [];
  let currentDate = new Date(startDate);
  const finalDate = new Date(endDate);

  while (currentDate <= finalDate) {
    const day = currentDate.toISOString().split('T')[0];
    ranges.push({ from: day, to: day });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return ranges;
}

/**
 * API call to get fixtures for a specific date.
 */
async function fetchFixtures(from, to, sport) {
  try {
    const response = await axios.get(API_URL, {
      headers: {
        Authorization: AUTH_TOKEN,
      },
      params: {
        sport,
        from,
        to,
      },
    });

    return response.data?.fixtures || [];
  } catch (error) {
    console.error(
      `❌ Error getting data from API for ${from}:`,
      error.message
    );
    return [];
  }
}

/**
 * Save fixtures to the database and return processed IDs.
 */
async function saveFixturesToDB(fixtures, sport) {
  const db = getDbBySport(sport);
  const processedIds = [];

  const fixtureQuery = `
    INSERT INTO fixtures (
      id,
      competition_id,
      competition_name,
      end_time,
      scheduled_start_time,
      sport_alias,
      sport_name,
      start_time,
      status,
      tie,
      winner_id,
      participants0_id,
      participants0_name,
      participants0_score,
      participants1_id,
      participants1_name,
      participants1_score
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      competition_id = VALUES(competition_id),
      competition_name = VALUES(competition_name),
      end_time = VALUES(end_time),
      scheduled_start_time = VALUES(scheduled_start_time),
      sport_alias = VALUES(sport_alias),
      sport_name = VALUES(sport_name),
      start_time = VALUES(start_time),
      status = VALUES(status),
      tie = VALUES(tie),
      winner_id = VALUES(winner_id),
      participants0_id = VALUES(participants0_id),
      participants0_name = VALUES(participants0_name),
      participants0_score = VALUES(participants0_score),
      participants1_id = VALUES(participants1_id),
      participants1_name = VALUES(participants1_name),
      participants1_score = VALUES(participants1_score);
  `;

  try {
    for (const fixture of fixtures) {
      await db.execute(fixtureQuery, [
        fixture.id,
        fixture.competition?.id || null,
        fixture.competition?.name || null,
        fixture.endTime || null,
        fixture.scheduledStartTime || null,
        fixture.sport?.alias || null,
        fixture.sport?.name || null,
        fixture.startTime || null,
        fixture.status || null,
        fixture.tie ?? null,
        fixture.winnerId || null,
        fixture.participants?.[0]?.id || null,
        fixture.participants?.[0]?.name || null,
        fixture.participants?.[0]?.score || null,
        fixture.participants?.[1]?.id || null,
        fixture.participants?.[1]?.name || null,
        fixture.participants?.[1]?.score || null,
      ]);

      console.log(`✅ Fixture saved: ${fixture.id}`);
      processedIds.push(fixture.id);
    }
  } catch (error) {
    console.error('❌ Error saving fixtures to DB:', error.message);
  }

  return processedIds;
}

/**
 * Process fixtures for a fixed date range (DOTA2 2025–2026)
 */
export async function processFixtures(sport) {
  console.log('🔄 Starting fixture processing...');
  console.log(`🎮 Sport: ${sport}`);

  const fromDate = '2025-01-01';
  const toDate = '2026-12-31';

  console.log(`📅 Fixed range: ${fromDate} → ${toDate}`);

  const dateRanges = generateDateRanges(fromDate, toDate);
  const allProcessedIds = [];

  for (const range of dateRanges) {
    console.log(`🔄 Fetching fixtures for ${range.from}`);
    const fixtures = await fetchFixtures(range.from, range.to, sport);

    if (fixtures.length > 0) {
      console.log(`📥 ${fixtures.length} fixtures found`);
      const processedIds = await saveFixturesToDB(fixtures, sport);
      allProcessedIds.push(...processedIds);
    } else {
      console.log(`⚠️ No fixtures found for ${range.from}`);
    }
  }

  console.log('✅ Process completed');
  console.log(`📊 Total fixtures processed: ${allProcessedIds.length}`);

  return allProcessedIds;
}

/**
 * CLI execution support
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const sportArg = process.argv[2] || 'dota2';

  processFixtures(sportArg)
    .then(ids => {
      console.log('🆔 Fixtures processed:', ids);
    })
    .catch(err => {
      console.error('❌ Fatal error during execution:', err.message);
      process.exit(1);
    });
}
