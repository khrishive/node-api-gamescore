// src/scripts/updateFixturesStatus.js

import dotenv from 'dotenv';
import axios from 'axios';
import { getDbBySport } from '../utils/dbUtils.js';

dotenv.config();

const API_URL = process.env.GAME_SCORE_API;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;

const SPORTS = ['cs2', 'lol', 'dota2'];
const STATUS_TO_CHECK = ['Started', 'Scheduled'];

/**
 * Get fixtures from DB with status 'Started' or 'Scheduled'
 */
async function getFixturesToUpdate(sport) {
  const db = await getDbBySport(sport);
  
  const [rows] = await db.query(
    `SELECT id, status FROM fixtures WHERE status IN (?, ?)`,
    STATUS_TO_CHECK
  );
  
  console.log(`[${sport.toUpperCase()}] Found ${rows.length} fixtures with status Started or Scheduled`);
  return rows;
}

/**
 * Fetch fixture status from API
 */
async function fetchFixtureFromAPI(fixtureId) {
  try {
    const response = await axios.get(`${API_URL}/fixtures/${fixtureId}`, {
      headers: {
        Authorization: AUTH_TOKEN
      }
    });
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.warn(`⚠️ Fixture ${fixtureId} not found in API (404)`);
      return null;
    }
    throw error;
  }
}

/**
 * Update fixture status in DB
 */
async function updateFixtureStatus(sport, fixtureId, newStatus) {
  const db = await getDbBySport(sport);
  
  await db.query(
    `UPDATE fixtures SET status = ? WHERE id = ?`,
    [newStatus, fixtureId]
  );
  
  console.log(`✅ [${sport.toUpperCase()}] Fixture ${fixtureId}: ${newStatus}`);
}

/**
 * Process fixtures for a specific sport
 */
async function processFixturesForSport(sport) {
  console.log(`\n🔄 Processing ${sport.toUpperCase()} fixtures...`);
  
  try {
    const fixtures = await getFixturesToUpdate(sport);
    
    if (fixtures.length === 0) {
      console.log(`✓ [${sport.toUpperCase()}] No fixtures to update`);
      return;
    }
    
    let updated = 0;
    let unchanged = 0;
    let errors = 0;
    
    for (const fixture of fixtures) {
      try {
        const apiData = await fetchFixtureFromAPI(fixture.id);
        
        if (!apiData) {
          errors++;
          continue;
        }
        
        const apiStatus = apiData.status;
        
        // Only update if status changed
        if (apiStatus && apiStatus !== fixture.status) {
          await updateFixtureStatus(sport, fixture.id, apiStatus);
          updated++;
        } else {
          unchanged++;
          console.log(`➖ [${sport.toUpperCase()}] Fixture ${fixture.id}: No change (${fixture.status})`);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ [${sport.toUpperCase()}] Error processing fixture ${fixture.id}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\n📊 [${sport.toUpperCase()}] Summary:`);
    console.log(`   - Updated: ${updated}`);
    console.log(`   - Unchanged: ${unchanged}`);
    console.log(`   - Errors: ${errors}`);
    
  } catch (error) {
    console.error(`❌ [${sport.toUpperCase()}] General error:`, error.message);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting fixture status update process...');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`🎮 Sports to process: ${SPORTS.join(', ')}`);
  console.log(`🔍 Checking statuses: ${STATUS_TO_CHECK.join(', ')}\n`);
  
  for (const sport of SPORTS) {
    await processFixturesForSport(sport);
  }
  
  console.log('\n✅ Process completed!');
  process.exit(0);
}

// Execute
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
