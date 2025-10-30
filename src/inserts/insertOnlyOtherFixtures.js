import mysql from 'mysql2/promise';
import axios from 'axios';
import dotenv from 'dotenv';
import { getDbBySport } from '../utils/dbUtils.js';

dotenv.config();

const requiredEnv = ['GAME_SCORE_API', 'GAME_SCORE_APIKEY'];
requiredEnv.forEach(name => {
  if (!process.env[name]) throw new Error(`❌ Missing environment variable ${name}`);
});

const API_URL = `${process.env.GAME_SCORE_API}/fixtures`;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

// Default sport (can be overridden by CLI)
const sport = process.argv[2] || 'cs2';

/**
 * Generate date ranges day by day between two dates.
 */
function generateDateRanges(startDate, endDate) {
  const ranges = [];
  let currentDate = new Date(startDate);
  while (currentDate <= new Date(endDate)) {
    const from = currentDate.toISOString().split('T')[0];
    const to = from;
    ranges.push({ from, to });
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
      headers: { Authorization: AUTH_TOKEN },
      params: { sport, from, to },
    });
    return response.data.fixtures || [];
  } catch (error) {
    console.error(`❌ Error getting data from API for ${from} to ${to}:`, error.message);
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
      id, competition_id, competition_name, end_time, scheduled_start_time, 
      sport_alias, sport_name, start_time, status, tie, winner_id, 
      participants0_id, participants0_name, participants0_score, 
      participants1_id, participants1_name, participants1_score
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
        fixture.competition.id,
        fixture.competition.name,
        fixture.endTime,
        fixture.scheduledStartTime,
        fixture.sport.alias,
        fixture.sport.name,
        fixture.startTime,
        fixture.status,
        fixture.tie,
        fixture.winnerId,
        fixture.participants[0]?.id,
        fixture.participants[0]?.name,
        fixture.participants[0]?.score,
        fixture.participants[1]?.id,
        fixture.participants[1]?.name,
        fixture.participants[1]?.score
      ]);
      console.log(`✅ Fixture saved: ${fixture.id}`);
      processedIds.push(fixture.id);
    }
  } catch (error) {
    console.error('❌ Error saving to DB:', error.message);
  }

  return processedIds; // 👈 Return the IDs processed
}

/**
 * Process fixtures by date range and return all processed fixture IDs.
 */
export async function processFixtures(sport) {
  console.log('🔄 Generating date ranges...');

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);

  const formatDate = (date) => date.toISOString().split('T')[0];
  const fromDate = formatDate(yesterday);
  const toDate = formatDate(tomorrow);

  console.log(`📅 Calculated range: ${fromDate} → ${toDate}`);

  const dateRanges = generateDateRanges(fromDate, toDate);
  const allProcessedIds = []; // 👈 Collect all fixture IDs here

  for (const range of dateRanges) {
    console.log(`🔄 Getting fixtures for: ${range.from} to ${range.to}`);
    const fixtures = await fetchFixtures(range.from, range.to, sport);

    if (fixtures.length > 0) {
      console.log(`📥 ${fixtures.length} fixtures found, saving...`);
      const processedIds = await saveFixturesToDB(fixtures, sport);
      allProcessedIds.push(...processedIds);
    } else {
      console.log(`⚠️ No fixtures found for: ${range.from}`);
    }
  }

  console.log('✅ Process completed.');
  console.log(`📊 Total fixtures processed: ${allProcessedIds.length}`);

  return allProcessedIds; // 👈 Return array of all processed fixture IDs
}

// CLI execution support
if (import.meta.url === `file://${process.argv[1]}`) {
  const sport = process.argv[2] || 'cs2';
  processFixtures(sport)
    .then(ids => {
      console.log('🆔 Fixtures processed:', ids);
    })
    .catch(err => {
      console.error('❌ Error during execution:', err.message);
      process.exit(1);
    });
}
