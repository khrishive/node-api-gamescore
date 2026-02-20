//src/controllers/controllerTeamStatsDota2.js

import { getMapResultsDota2, getPlayerBuild } from './dota2Controllers.js';

const EMPTY_STATS = () => ({
  kills: 0,
  deaths: 0,
  denies: 0,
  gold: 0,
  cs: 0,
  xpMin: 0,
  heroDamage: 0,
  towerDamage: 0,
  observerWardsPlaced: 0,
  sentryWardsPlaced: 0,
});

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function addMapStat(target, row) {
  target.kills += toNumber(row.kills);
  target.deaths += toNumber(row.deaths);
  target.denies += toNumber(row.denies);
  target.gold += toNumber(row.gold);
  target.cs += toNumber(row.cs);
  target.heroDamage += toNumber(row.heroDamage);
}

function addBuildStat(target, row) {
  target.xpMin += toNumber(row.xpMin);
  target.towerDamage += toNumber(row.towerDamage);
  target.observerWardsPlaced += toNumber(row.observerWardsPlaced);
  target.sentryWardsPlaced += toNumber(row.sentryWardsPlaced);
}

function getOrCreateMapBucket(store, mapNumber, team1Id, team2Id) {
  if (!store[mapNumber]) {
    store[mapNumber] = {
      map_name: `Map ${mapNumber}`,
      teams: [
        { id: team1Id, stats: EMPTY_STATS() },
        { id: team2Id, stats: EMPTY_STATS() },
      ],
    };
  }

  return store[mapNumber];
}

function getTeamRef(mapBucket, teamId) {
  return mapBucket.teams.find(team => team.id === teamId);
}

function dedupeBuildRows(rows) {
  const uniqueRows = new Map();

  for (const row of rows || []) {
    const key = `${row.map_number}:${row.team_id}:${row.name}:${row.heroId}`;
    const previous = uniqueRows.get(key);

    if (!previous) {
      uniqueRows.set(key, row);
      continue;
    }

    const previousUpdatedAt = previous.updated_at ? new Date(previous.updated_at).getTime() : 0;
    const currentUpdatedAt = row.updated_at ? new Date(row.updated_at).getTime() : 0;
    const previousId = Number(previous.id || 0);
    const currentId = Number(row.id || 0);

    if (currentUpdatedAt > previousUpdatedAt || (currentUpdatedAt === previousUpdatedAt && currentId > previousId)) {
      uniqueRows.set(key, row);
    }
  }

  return Array.from(uniqueRows.values());
}

export function renderTeamStatsDota2(mapResultsRows, playerBuildRows, team1Id, team2Id) {
  if ((!mapResultsRows || !mapResultsRows.length) && (!playerBuildRows || !playerBuildRows.length)) {
    return [];
  }

  const maps = {};

  for (const row of mapResultsRows || []) {
    const mapNumber = row.map_number;
    const teamId = row.team_id;

    const mapBucket = getOrCreateMapBucket(maps, mapNumber, team1Id, team2Id);
    const teamRef = getTeamRef(mapBucket, teamId);

    if (teamRef) {
      addMapStat(teamRef.stats, row);
    }
  }

  const uniqueBuildRows = dedupeBuildRows(playerBuildRows || []);
  for (const row of uniqueBuildRows) {
    const mapNumber = row.map_number;
    const teamId = row.team_id;

    const mapBucket = getOrCreateMapBucket(maps, mapNumber, team1Id, team2Id);
    const teamRef = getTeamRef(mapBucket, teamId);

    if (teamRef) {
      addBuildStat(teamRef.stats, row);
    }
  }

  return Object.entries(maps)
    .sort(([mapA], [mapB]) => Number(mapA) - Number(mapB))
    .map(([, value]) => value);
}

export async function mainTeamStatsDota2(fixtureId, team1Id, team2Id) {
  const [mapResultsDota2, playerBuildDota2] = await Promise.all([
    getMapResultsDota2(fixtureId),
    getPlayerBuild(fixtureId),
  ]);

  return renderTeamStatsDota2(mapResultsDota2, playerBuildDota2, team1Id, team2Id);
}
