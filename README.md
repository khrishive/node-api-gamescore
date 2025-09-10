# API Endpoints Documentation

This document provides a summary of the available API endpoints.

## Competitions

- `GET /api/competitions`: Get a list of competitions.
- `GET /api/competitions/:id`: Get details of a competition by ID.
- `GET /api/competitions/:id/participants`: Get participants of a competition.
- `GET /api/competitions/:id/stages`: Get stages of a competition.
- `GET /api/competitions/stage/:id/participants`: Get participants of a stage.
- `GET /api/competitions/stage/:id/stagefixtures`: Get fixtures of a stage.

## Database API

- `GET /db/competitions`: Get records from the 'competitions' table with optional filters.
- `GET /db/fixtures`: Get records from the 'fixtures' table with optional filters.
- `GET /db/all_fixtures`: Get all records from the 'fixtures' table.
- `GET /db/team_fixture_stats`: Get records from the 'team_fixture_stats' table.
- `GET /db/fixture_links`: Get records from the 'fixture_links' table.
- `GET /db/participants`: Get records from the 'participants' table with optional filters.
- `GET /db/players`: Get records from the 'player' table with optional filters.
- `GET /db/stats_player`: Get records from the 'stats_player' table.
- `GET /db/team_info`: Get records from the 'team_info' table.

## Fixtures

- `GET /api/fixtures`: Get a list of fixtures.
- `GET /api/fixtures/:id`: Get details of a fixture by ID.
- `GET /api/fixtures/:id/participants`: Get participants of a fixture.
- `GET /api/fixtures/:id/stages`: Get stages of a fixture.
- `GET /api/fixtures/stage/:id/participants`: Get participants of a stage.
- `GET /api/fixtures/stage/:id/stagefixtures`: Get fixtures of a stage.
- `GET /api/fixtures/fixtures`: Get a list of fixtures.
- `GET /api/fixtures/fixtures/:id`: Get a list of fixtures.
- `GET /api/fixtures/fixtures/:competitionId/fixtures`: Get fixtures by competition.

## Fixture Details

- `GET /api/fixture-assists/:fixtureId/assists`: Get assists for a fixture.
- `GET /api/fixture-equipment-state/:fixtureId/equipment`: Get equipment state for a fixture.
- `GET /api/fixture-events-raw/:fixtureId/events-raw`: Get raw events for a fixture.
- `GET /api/fixture-maps/:fixtureId/maps`: Get maps for a fixture.
- `GET /api/fixture-stats/:fixtureId/stats`: Get stats for a fixture, with an optional `map_id` query parameter.

## Gemini

- `POST /api/gemini`: Interact with the Gemini API.

## Map Breakdown

- `GET /api/map-breakdown/team/:teamId/:competitionId/map-breakdown`: Get map breakdown for a team in a competition.
- `GET /api/map-breakdown/team/:teamId/map-breakdown`: Get map breakdown for a team without a competition.

## Map Stats

- `GET /api/map-stats/map-stats/:fixtureId`: Get map stats for a fixture.
- `GET /api/map-stats/map-round-scores/:fixtureId`: Get map round scores for a fixture.

## Match Events

- `GET /api/match-event/events`: Get match events with filters.
- `GET /api/match-event/mapscores/:fixtureId`: Get map scores for a fixture.

## Players

- `GET /api/players/:id`: Get player details by ID.
- `GET /api/players/stats/player/:id`: Get player stats by ID.

## Populate Data

- `POST /api/populate/general`: Populate data in the database.

## Teams

- `GET /api/teams`: Get a list of teams.
- `GET /api/teams/:id`: Get team details by ID.
