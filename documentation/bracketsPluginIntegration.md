# Integración del Plugin de Brackets con la API Intermedia

Esta documentación explica cómo migrar el plugin de WordPress `brackets_hs` para usar la API intermedia en lugar de llamar directamente a la API de GameScorekeeper.

## 📋 Endpoints Disponibles

### 1. GET `/brackets/tournament/:tournamentId`

**Descripción:** Obtiene todos los datos de un torneo procesados y listos para usar.

**Reemplaza las siguientes llamadas:**
- `GET /v1/competitions/{id}`
- `GET /v1/competitions/{id}/participants`
- `GET /v1/competitions/{id}/stages`
- `GET /v1/fixtures?competitionId={id}`

**Parámetros:**
- `tournamentId` (path): ID del torneo
- `sport` (query, opcional): Deporte (default: 'cs2')

**Respuesta:**
```json
{
  "competition": { ... },
  "participants": [ ... ],
  "stages": [ ... ],
  "fixtures": [ ... ],
  "allFixturesIndexedById": { ... },
  "participantsDataIndexedById": { ... },
  "processedData": {
    "hybridSeparation": {
      "swiss": [ ... ],
      "playoffs": [ ... ]
    },
    "stagesData": { ... }
  }
}
```

### 2. GET `/brackets/tournament/:tournamentId/stage/:stageId`

**Descripción:** Obtiene datos procesados de un stage específico.

**Reemplaza las siguientes llamadas:**
- `GET /v1/competitions/stage/{id}/participants`
- `GET /v1/competitions/stage/{id}/stagefixtures`
- Múltiples llamadas a `GET /v1/fixtures/{id}`

**Parámetros:**
- `tournamentId` (path): ID del torneo
- `stageId` (path): ID del stage
- `sport` (query, opcional): Deporte (default: 'cs2')

**Respuesta:**
```json
{
  "stageInfo": {
    "id": 123,
    "name": "Swiss Stage",
    "type": "Swiss"
  },
  "participants": [ ... ],
  "fixtures": [ ... ],
  "processedData": {
    "stageType": "Swiss",
    "rounds": [ ... ],
    "standings": [ ... ]
  }
}
```

### 3. GET `/brackets/tournament/:tournamentId/simple`

**Descripción:** Versión simplificada sin procesamiento pesado. Útil para obtener información rápida.

**Parámetros:**
- `tournamentId` (path): ID del torneo
- `sport` (query, opcional): Deporte (default: 'cs2')

## 🔧 Cómo Modificar el Plugin

### Paso 1: Actualizar la función de cache

Reemplaza las llamadas directas a la API con llamadas a la API intermedia:

```php
// ANTES (en index.php):
$competitionData = brackets_hs_get_cached_api_data(
    $cache_key_competition,
    "https://api.gamescorekeeper.com/v1/competitions/$tournament_id",
    $apiKey,
    $competition_cache_duration
);

// DESPUÉS:
$api_base_url = defined('BRACKETS_API_BASE_URL') ? BRACKETS_API_BASE_URL : 'http://localhost:3000';
$api_key = defined('BRACKETS_API_KEY') ? BRACKETS_API_KEY : '';

$competitionData = brackets_hs_get_cached_api_data(
    $cache_key_competition,
    "$api_base_url/brackets/tournament/$tournament_id/simple?sport=cs2",
    $api_key, // Usar la API key de la API intermedia
    $competition_cache_duration
);
```

### Paso 2: Usar el endpoint completo para datos procesados

Para obtener todos los datos procesados de una vez:

```php
// Obtener todos los datos del torneo procesados
$cache_key_tournament = 'brackets_hs_tournament_' . $tournament_id;
$tournamentData = brackets_hs_get_cached_api_data(
    $cache_key_tournament,
    "$api_base_url/brackets/tournament/$tournament_id?sport=cs2",
    $api_key,
    120 // 2 minutos de cache
);

if ($tournamentData) {
    // Los datos ya vienen procesados
    $dataTournament[$tournamentIDNumericValue]['competition'] = $tournamentData['competition'];
    $dataTournament[$tournamentIDNumericValue]['competitionParticipants'] = $tournamentData['participants'];
    $dataTournament[$tournamentIDNumericValue]['stages'] = $tournamentData['stages'];
    $dataTournament[$tournamentIDNumericValue]['allFixtures'] = $tournamentData['fixtures'];
    $dataTournament[$tournamentIDNumericValue]['allFixturesIndexedById'] = $tournamentData['allFixturesIndexedById'];
    $dataTournament[$tournamentIDNumericValue]['participantsDataIndexedById'] = $tournamentData['participantsDataIndexedById'];
    
    // Datos procesados ya incluidos
    if (isset($tournamentData['processedData'])) {
        // Usar datos procesados directamente
        $hybridSeparation = $tournamentData['processedData']['hybridSeparation'];
        $stagesData = $tournamentData['processedData']['stagesData'];
    }
}
```

### Paso 3: Obtener datos de stages individuales

```php
// Para cada stage, obtener datos procesados
foreach ($stagesTournament as $stage) {
    $stageId = $stage['id'];
    
    $cache_key_stage = 'brackets_hs_stage_' . $stageId;
    $stageData = brackets_hs_get_cached_api_data(
        $cache_key_stage,
        "$api_base_url/brackets/tournament/$tournament_id/stage/$stageId?sport=cs2",
        $api_key,
        120 // 2 minutos
    );
    
    if ($stageData) {
        // Los datos ya vienen procesados con rounds, standings, brackets, etc.
        $dataTournament[$tournamentIDNumericValue]['stageParticipants'][$stageId] = $stageData['participants'];
        $dataTournament[$tournamentIDNumericValue]['stageFixtures'][$stageId] = $stageData['fixtures'];
        
        // Usar datos procesados
        if (isset($stageData['processedData'])) {
            $rounds = $stageData['processedData']['rounds'];
            $standings = $stageData['processedData']['standings'];
            $brackets = $stageData['processedData']['brackets'];
        }
    }
}
```

### Paso 4: Actualizar la función de cache para usar headers correctos

```php
function brackets_hs_get_cached_api_data($cache_key, $api_url, $api_key, $cache_duration = 300) {
    // Try to get from cache first
    $cached_data = get_transient($cache_key);
    if ($cached_data !== false) {
        return $cached_data;
    }
    
    // Cache miss - fetch from API
    $response = wp_remote_get($api_url, [
        'headers' => [
            'x-api-key' => $api_key, // Cambiar de 'Authorization' a 'x-api-key'
            'Accept' => 'application/json'
        ],
        'timeout' => 20
    ]);
    
    if (is_wp_error($response)) {
        brackets_hs_log('❌ API Error for ' . $api_url . ': ' . $response->get_error_message());
        return null;
    }
    
    $status_code = wp_remote_retrieve_response_code($response);
    if ($status_code !== 200) {
        brackets_hs_log('❌ HTTP ' . $status_code . ' for ' . $api_url);
        return null;
    }
    
    $body = wp_remote_retrieve_body($response);
    if (empty($body)) {
        brackets_hs_log('❌ Empty response for ' . $api_url);
        return null;
    }
    
    $data = json_decode($body, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        brackets_hs_log('❌ JSON decode error for ' . $api_url . ': ' . json_last_error_msg());
        return null;
    }
    
    // Cache the data
    set_transient($cache_key, $data, $cache_duration);
    
    return $data;
}
```

## ⚙️ Configuración

Agrega estas constantes en tu `wp-config.php` o en el archivo del plugin:

```php
// URL base de la API intermedia
define('BRACKETS_API_BASE_URL', 'http://localhost:3000'); // Cambiar por tu URL

// API Key de la API intermedia (no la de GameScorekeeper)
define('BRACKETS_API_KEY', 'tu-api-key-aqui');
```

## 📊 Beneficios

1. **Rendimiento mejorado:** Los datos se procesan en el servidor de la API, no en WordPress
2. **Menos llamadas:** Una sola llamada reemplaza múltiples llamadas a la API externa
3. **Datos pre-procesados:** Standings, brackets, rounds ya calculados
4. **Cache más eficiente:** Los datos procesados se cachean una vez
5. **Menor carga en WordPress:** El procesamiento pesado se hace en Node.js

## 🔄 Migración Gradual

Puedes migrar gradualmente:

1. **Fase 1:** Usar `/brackets/tournament/:id/simple` para datos básicos
2. **Fase 2:** Migrar a `/brackets/tournament/:id` para datos completos
3. **Fase 3:** Usar `/brackets/tournament/:id/stage/:stageId` para stages individuales
4. **Fase 4:** Eliminar código de procesamiento del plugin (ya no necesario)

## 🐛 Debugging

Si algo no funciona, verifica:

1. Que la API intermedia esté corriendo
2. Que la API key sea correcta
3. Que la URL base sea accesible desde WordPress
4. Revisa los logs de la API intermedia para errores

