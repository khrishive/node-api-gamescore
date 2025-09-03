<?php

if (!function_exists('render_fixture_shortcodes_grid')) {

    function get_tipster_for_fixture($fixturePostID, $fixture_competition_id) {
        $tipster_data = [
            'avatar'  => '',
            'name'    => 'No predictions available at the time',
            'excerpt' => '',
            'content' => '',
            'link' => '',
            'author_nickname' => 'No predictions available at the time',
            'author_avatar' => ''
        ];

        $args = [
            'post_type'      => 'tipster',
            'posts_per_page' => 1,
            'no_found_rows'  => true,
            'ignore_sticky_posts' => true,
            'fields'         => 'ids',
            'meta_query'     => [
                [
                    'key'     => 'fixture_id',
                    'value'   => '"' . $fixturePostID . '"',
                    'compare' => 'LIKE'
                ]
            ]
        ];

        $tipster_ids = get_posts($args);


        if (empty($tipster_ids) && $fixture_competition_id) {
            $args['meta_query'] = [
                [
                    'key'     => 'competition_id',
                    'value'   => '"' . $fixture_competition_id . '"',
                    'compare' => 'LIKE'
                ]
            ];
            $tipster_ids = get_posts($args);
        }

        if (!empty($tipster_ids)) {
            $tipster_id = $tipster_ids[0];
            $tipster_data['name'] = get_the_title($tipster_id);

            $tipster_content_raw = get_post_field('post_content', $tipster_id);
            $tipster_data['content'] = wp_strip_all_tags($tipster_content_raw);

            $tipster_data['excerpt'] = get_the_excerpt($tipster_id);
            $tipster_data['link'] = get_permalink($tipster_id);

            $avatar_id = get_field('avatar', $tipster_id);

            if ($avatar_id) {
                $tipster_data['avatar'] = $avatar_id;
            } else {
                $featured_id = get_post_thumbnail_id($tipster_id);
                $tipster_data['avatar'] = wp_get_attachment_image_url($featured_id, 'full');

                if (!$featured_id) {
                    $tipster_data['avatar'] = FSM_PLUGIN_URL . 'assets/default-team-logo.png';
                }
            }
            $author_id = get_post_field('post_author', $tipster_id);
            if ($author_id) {
                $tipster_data['author_nickname'] = get_the_author_meta('nickname', $author_id);

                $author_avatar = get_field('avatar', 'user_' . $author_id);
                if ($author_avatar) {
                    $tipster_data['author_avatar'] = $author_avatar;
                }
            }
        }        

        return $tipster_data;
}


    function render_fixture_shortcodes_grid($atts) {
        $atts = shortcode_atts([
            'tiles' => 4,
            'tag'   => 'live', // Default tag label,
            'custom_title' => '',
            'home' => false
        ], $atts);

        global $fsmGlobals;
        
        $post_id = null;
        $external_id = '';
        // Check if we're on a single post and that post type is 'tournament'
        if (is_singular('tournament')) {
            $post_id = get_the_ID();

            if ($post_id && get_post_type($post_id) === 'tournament') {
                $external_id = get_field('external_id', $post_id);
                if (!$external_id) {
                    $external_id = ''; // Ensure it's always a string
                }
            }
        }

        $tile_count = (int) $atts['tiles'];
        $tag_label = ucfirst(strtolower($atts['tag']));
        $customTitle = $atts['custom_title'];
        $homeLink = $atts['home'];

        // Define tag color classes based on tag label
        $tag_label_title = "Events";
        $fixtureStatus = '';
        switch (strtolower($tag_label)) {
            case 'live':
                $tag_label_title = "Live Events";
                $fixtureStatus = 'Started';
                break;
            case 'upcoming':
                $tag_label_title = "Upcoming";
                $fixtureStatus = 'Scheduled';
                break;
            case 'historic':
                $tag_label_title = "Historic Events";
                break;
            case 'featured':
                $tag_label_title = "Featured Matches";
                break;
            case 'inside':
                $tag_label_title = "Inside the Action";
                $tile_count = 2;
                $fixtureStatus = 'Started';
                break;
        }
        $tagsColorsByStatus = [
            'started' => 'red',
            'scheduled' => 'orange',
            'historic' => 'blue',
            'featured' => 'gray'
        ];
        if(!empty($customTitle)) {
            $tag_label_title = $customTitle;
        }
        $metaQueries = [];
        if($external_id) {
            $metaQueries[] = [
                'key'     => 'competition_id',
                'value'   => $external_id,
                'compare' => '='
            ];
        }else{
            $metaQueries[] = [
                'key'     => 'competition_id',
                'compare' => 'EXISTS',
            ];
        }
        
        if($fixtureStatus){
            $metaQueries[] = [
                'key'     => 'status',
                'value'   => $fixtureStatus,
            ];
        }

        $fixtures_query = new WP_Query([
            'post_type'      => 'fixtures',
            'posts_per_page' => $tile_count,
            'meta_key'       => 'competition_id',
            'meta_compare'   => '=',
            'orderby'        => 'meta_value',
            'status'        => 'publish',
            'meta_query'    => $metaQueries,
            'order'          => 'DESC',
        ]);

        ob_start();
        
        if (!$homeLink){
             echo '<div class="fixture-shortcodes-events-main-title">' . esc_html($tag_label_title) . '</div>';
        } else {
            echo '<div class="fixture-shortcodes-events-header">';
            echo '  <div class="fixture-shortcodes-events-main-title">' . esc_html($tag_label_title) . '</div>';
            echo '  <a href="/tournaments" class="fixture-shortcodes-events-link">Follow The Latest Tournaments and Matches</a>';
            echo '</div>';
        }
       
        echo '<div class="fixture-shortcodes-events-grid">';
        $recordCount = 0;
        $insideActionData= [];
        if ( $fixtures_query->have_posts() ) {
            while ( $fixtures_query->have_posts() ) {
                $fixtures_query->the_post();

                $fixturePostID = get_the_id();
                // Get all meta data
                $meta = get_post_meta($fixturePostID);
                $external_id = get_field('external_id', $fixturePostID);

                $competitionId = isset($meta['competition_id']) && isset($meta['competition_id'][0]) ?  $meta['competition_id'][0] : null;

                        $tournamentPermalink = null;

                        if ($competitionId) {
                            $tournament_posts = get_posts([
                                'post_type'  => 'tournament',
                                'meta_query' => [
                                    [
                                        'key'   => 'external_id',
                                        'value' => $competitionId,
                                        'compare' => '='
                                    ]
                                ],
                                'posts_per_page' => 1,
                                'fields' => 'ids' // We only need the ID for the permalink
                            ]);

                            if (!empty($tournament_posts)) {
                                $tournamentPermalink = get_permalink($tournament_posts[0]);
                            }
                        }

                $tournament_id = get_field('tournaments', $fixturePostID);
                if ($tournament_id) {
                    $tournament_link  = get_permalink($tournament_id);
                } else {
                    $tournament_link = '#';
                }

                $api_url = "https://esport-data.com/map-stats/map-round-scores/$external_id";
                $api_key = defined('MAPSCORE_API_KEY') ? MAPSCORE_API_KEY : '';
                $response = wp_remote_get($api_url, [
                    'headers' => [
                        'x-api-key' => $api_key,
                        'Accept'    => 'application/json'
                    ]
                ]);

                if (is_wp_error($response)) {
                    $maps_data = [];
                } else {
                    $body = wp_remote_retrieve_body($response);
                    $json = json_decode($body, true);
                    $maps_data = $json['data'] ?? [];
                }

                $grouped_maps = [];
                foreach ($maps_data as $map) {
                    $map_number = $map['map_number'];
                    if (!isset($grouped_maps[$map_number])) {
                        $grouped_maps[$map_number] = [
                            'map_name' => ucfirst(str_replace('de_', '', $map['map_name'])),
                            'teams' => []
                        ];
                    }
                    $grouped_maps[$map_number]['teams'][] = [
                        'team_id' => $map['team_id'],
                        'score'   => $map['rounds_won']
                    ];
                }

                $liveHeader = '';
                $topScoreBoard = '';
                $title = get_the_title();
                if (empty($title)) {
                    $title = 'Untitled Event';
                } else {
                    $title = html_entity_decode($title, ENT_QUOTES, 'UTF-8');
                    $title = preg_replace('/\s*–\s*(Match\s*)?#\d+.*/i', '', $title);
                }

                $firstParticipantName = (isset($meta['participants0_name']) && !empty($meta['participants0_name'][0])) ? $meta['participants0_name'][0] : 'Team 1';
                $secondParticipantName = (isset($meta['participants1_name']) && !empty($meta['participants1_name'][0])) ? $meta['participants1_name'][0] : 'Team 2';               

                $startDate = 'Unknown Date';
                $startTime = 'Unknown Time';
                $startDateTime = '';
                $daysDifference = null; // Default value
                if (isset($meta['start_time']) && !empty($meta['start_time'][0])) {
                    $timestamp = (float)$meta['start_time'][0];
    
                    // If in milliseconds, convert to seconds
                    if ($timestamp > 9999999999) {
                        $timestamp = $timestamp / 1000;
                    }

                    // Use DateTime::createFromFormat for millisecond precision
                    $currentTimeObj = DateTime::createFromFormat('U.u', number_format($timestamp, 3, '.', ''));
                    if ($currentTimeObj !== false) {
                        $currentTimeObj->setTimezone(new DateTimeZone('UTC'));
                        $startDateTime = $currentTimeObj->format('Y-m-d H:i:s');

                        // Extract date and time parts
                        $startDate = $currentTimeObj->format('Y-m-d');
                        $startTime = $currentTimeObj->format('H:i:s');
                    } else {
                        // Fallback to gmdate if parsing fails
                        $startDateTime = gmdate('Y-m-d H:i:s', (int)$timestamp);

                        // Extract date and time parts
                        $startDate = gmdate('Y-m-d', (int)$timestamp);
                        $startTime = gmdate('H:i:s', (int)$timestamp);
                    }

                    // ✅ Calculate difference in days only if $startDateTime is valid
                    if (strtolower($tag_label) === 'inside' && !empty($startDateTime)) {
                        $now = new DateTime('now', new DateTimeZone('UTC')); // Use same timezone for consistency
                        $eventDate = new DateTime($startDateTime, new DateTimeZone('UTC'));

                        $interval = $now->diff($eventDate);
                        $daysDifference = (int)$interval->format('%r%a'); // %r keeps sign (+/-)
                    }
                }

                $endDate = 'Unknown Date';
                $endTime = 'Unknown Time';
                $endDateTime = 'Unknown Date';
                if (isset($meta['end_time']) && !empty($meta['end_time'][0])) {
                    $timestamp = (float)$meta['end_time'][0];
    
                    // If in milliseconds, convert to seconds
                    if ($timestamp > 9999999999) {
                        $timestamp = $timestamp / 1000;
                    }

                    // Use DateTime::createFromFormat for millisecond precision
                    $currentTimeObj = DateTime::createFromFormat('U.u', number_format($timestamp, 3, '.', ''));
                    if ($currentTimeObj !== false) {
                        $currentTimeObj->setTimezone(new DateTimeZone('UTC'));
                        $endDateTime = $currentTimeObj->format('Y-m-d H:i:s');

                        // Extract date and time parts
                        $endDate = $currentTimeObj->format('Y-m-d');
                        $endTime = $currentTimeObj->format('H:i:s');
                    } else {
                        // Fallback to gmdate if parsing fails
                        $endDateTime = gmdate('Y-m-d H:i:s', (int)$timestamp);

                        // Extract date and time parts
                        $endDate = gmdate('Y-m-d', (int)$timestamp);
                        $endTime = gmdate('H:i:s', (int)$timestamp);
                    }
                }

                $fixture_competition_id = $meta['competition_id'][0] ?? '';

                $tipster = get_tipster_for_fixture($fixturePostID, $fixture_competition_id);

                if ($tipster) { 
                    $author = $tipster['author_nickname'] ?? '';
                    $excerpt = $tipster['excerpt'] ?? '';
                    $avatar = $tipster['author_avatar'] ?? '';
                    $content = $tipster['content'] ?? '';
                    $tipster_link = $tipster['link'] ?? '#';
                } else {
                    $author = get_the_author();
                    $author = $author ? ucwords(strtolower($author)) : 'Unknown Author';

                    $content = get_the_content();
                    if (empty($content)) {
                        $content = 'Preview 3 lines. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut et massa mi. Aliquam in hendrerit urna. Pellentesque sit amet sapien fringilla, mattis ligula';
                    } else {
                        // Limit content to 180 characters, add ellipsis if longer
                        $content = wp_strip_all_tags($content);
                        if (mb_strlen($content) > 180) {
                            $content = mb_substr($content, 0, 180) . '...';
                        }
                    }

                    $excerpt = get_the_excerpt();
                    if (empty($excerpt)) {
                        $excerpt = '[Prediction truncate at 1...';
                    }
                }

                $upload_dir = wp_upload_dir();
                $thunderpickLogo   = $upload_dir['baseurl'] . '/2025/08/thundepick_logo_white.svg';

                $firstParticipantScore = isset($meta['participants0_score'][0]) ? $meta['participants0_score'][0] : 0;
                $secondParticipantScore = isset($meta['participants1_score'][0]) ? $meta['participants1_score'][0] : 0;

                $firstParticipantId = isset($meta['participants0_id'][0]) ? $meta['participants0_id'][0] : '';
                $secondParticipantId = isset($meta['participants1_id'][0]) ? $meta['participants1_id'][0] : '';

                $firstParticipantLogo = isset($fsmGlobals['participants'][$firstParticipantId]) ? $fsmGlobals['participants'][$firstParticipantId]->participant_logo : FSM_PLUGIN_URL . 'assets/default-team-logo.png';
                $secondParticipantLogo = isset($fsmGlobals['participants'][$secondParticipantId]) ? $fsmGlobals['participants'][$secondParticipantId]->participant_logo : FSM_PLUGIN_URL . 'assets/default-team-logo.png';
                
                $currentFixtureStatus = isset($meta['status'][0]) ? $meta['status'][0] : 'N/A';
                $currentTagColor = isset($tagsColorsByStatus[strtolower($currentFixtureStatus)]) ? $tagsColorsByStatus[strtolower($currentFixtureStatus)] : 'gray';

                if (!$avatar){
                    $avatar = FSM_PLUGIN_URL . 'assets/default-team-logo.png';
                }

                $map_results = '<div class="map-scores">';
                if (!empty($grouped_maps)) {
                    foreach ($grouped_maps as $map_number => $map_info) {
                        $teams = $map_info['teams'];
                        if (count($teams) === 2) {
                            $score_0 = $teams[0]['score'];
                            $score_1 = $teams[1]['score'];

                            $class_0 = $score_0 > $score_1 ? 'green' : ($score_0 < $score_1 ? 'red' : 'black');
                            $class_1 = $score_1 > $score_0 ? 'green' : ($score_1 < $score_0 ? 'red' : 'black');

                            $map_results .= '<div class="fixture-shortcodes-map-score-num">';
                            $map_results .= '<span class="fixture-shortcodes-map-score-num ' . esc_attr($class_0) . '">' . esc_html($score_0) . '</span> ';
                            $map_results .= esc_html($map_info['map_name']) . ' ';
                            $map_results .= '<span class="fixture-shortcodes-map-score-num ' . esc_attr($class_1) . '">' . esc_html($score_1) . '</span>';
                            $map_results .= '</div>';
                        }
                    }
                } else {
                    $map_results .= '
                    <div class="fixture-shortcodes-map-score-num">
                        No map scores available.
                    </div>';
                }
                $map_results .= '</div>';

                if(strtolower($tag_label) === 'inside'){
                    $competitionName = isset($meta['competition_name']) ? $meta['competition_name'][0] : 'Unknown Competition';
                    if($recordCount === 0){                        
                        $competitionId = isset($meta['competition_id']) && isset($meta['competition_id'][0]) ?  $meta['competition_id'][0] : null;

                        $tournamentPermalink = null;

                        if ($competitionId) {
                            $tournament_posts = get_posts([
                                'post_type'  => 'tournament',
                                'meta_query' => [
                                    [
                                        'key'   => 'external_id',
                                        'value' => $competitionId,
                                        'compare' => '='
                                    ]
                                ],
                                'posts_per_page' => 1,
                                'fields' => 'ids' // We only need the ID for the permalink
                            ]);

                            if (!empty($tournament_posts)) {
                                $tournamentPermalink = get_permalink($tournament_posts[0]);
                            }
                        }

                        $insideActionData[] = [
                            'competitionName' => $competitionName,
                            'daysDifference' => $daysDifference,
                            'startDate' => $startDate,
                            'tournamentLink'  => $tournamentPermalink
                        ];
                    } else if($recordCount === 1){
                        $insideActionData[] = [
                            'firstParticipantLogo' => $firstParticipantLogo,
                            'firstParticipantName' => $firstParticipantName,
                            'secondParticipantLogo' => $secondParticipantLogo,
                            'secondParticipantName' => $secondParticipantName,
                            'competitionName' => $competitionName,
                        ];
                    }
                }
                switch (strtolower($currentFixtureStatus)) {
                    case 'started':
                        $liveHeader = '
                            <a href="'.get_permalink().'" class="fixture-shortcodes-link-wrapper">
                                <div class="fixture-shortcodes-header">
                                    <span class="fixture-shortcodes-badge ' . $currentTagColor . '">' .
                                    '<svg xmlns="http://www.w3.org/2000/svg" width="6" height="7" viewBox="0 0 6 7" fill="none">
                                        <circle cx="3" cy="3.5" r="3" fill="white"/>
                                    </svg> LIVE </span>
                                    <div class="fixture-shortcodes-header-spacer"></div>
                                    <img class="fixture-shortcodes-event-logo" src="' . FSM_PLUGIN_URL . 'assets/default-feature-match-image.png" alt="Event Logo" />
                                </div>
                            </a>
                            <div class="fixture-shortcodes-title"><a class="fixture-shortcodes-title-link" href="'.$tournamentPermalink.'">'.$title.'</a></div>
                            
                        ';
                        $topScoreBoard = '
                            <div class="fixture-shortcodes-score-main">'. $firstParticipantScore . ' - ' . $secondParticipantScore .'</div>
                            '. $map_results .'
                        ';
                        break;
                    case 'scheduled':
                        $liveHeader = '
                            <div class="fixture-shortcodes-header fixture-shortcodes-header-other-status">
                                <div class="fixture-shortcodes-title"><a class="fixture-shortcodes-title-link" href="'.$tournamentPermalink.'">'.$title.'</a></div>
                                <img class="event-logo" src="' . FSM_PLUGIN_URL . 'assets/default-feature-match-image.png" alt="Event Logo" />
                            </div>
                        ';
                        $topScoreBoard = '
                            <div class="fixture-shortcodes-event-schedule">
                                <div class="fixture-shortcodes-event-date">'.$startDate.'</div>
                                <div class="fixture-shortcodes-event-time">'.$startTime.'</div>
                            </div>
                        ';
                        break;
                    case 'ended':
                        $liveHeader = '
                            <a href="'.get_permalink().'" class="fixture-shortcodes-link-wrapper">
                                <div class="fixture-shortcodes-header fixture-shortcodes-header-other-status">
                                    <span class="fixture-shortcodes-badge ' . $currentTagColor . '">' .
                                    '<svg xmlns="http://www.w3.org/2000/svg" width="6" height="7" viewBox="0 0 6 7" fill="none">
                                        <circle cx="3" cy="3.5" r="3" fill="white"/>
                                    </svg> ENDED </span>
                                    <div class="fixture-shortcodes-header-spacer"></div>
                                    <img class="fixture-shortcodes-event-logo" src="' . FSM_PLUGIN_URL . 'assets/default-feature-match-image.png" alt="Event Logo" />
                                </div>
                            </a>
                            <div class="fixture-shortcodes-title"><a class="fixture-shortcodes-title-link" href="'.$tournamentPermalink.'">' . $title . '</a></div>
                        ';
                        $topScoreBoard = '
                            <div class="fixture-shortcodes-score-date">'. $endDate .'</div>
                            <div class="fixture-shortcodes-score-final">Final</div>
                            <div class="fixture-shortcodes-score-main">'. $firstParticipantScore . ' - ' . $secondParticipantScore .'</div>
                            
                            
                        ';
                        break;
                    default:
                        $liveHeader = '
                            <div class="fixture-shortcodes-header">
                                <span class="fixture-shortcodes-badge ' . $currentTagColor . '">' .
                                '<svg xmlns="http://www.w3.org/2000/svg" width="6" height="7" viewBox="0 0 6 7" fill="none">
                                    <circle cx="3" cy="3.5" r="3" fill="white"/>
                                </svg>'. strtoupper(esc_html($currentFixtureStatus)) . '</span>
                                <div class="fixture-shortcodes-header-spacer"></div>
                                <img class="fixture-shortcodes-event-logo" src="' . FSM_PLUGIN_URL . 'assets/default-feature-match-image.png" alt="Event Logo" />
                            </div>
                            <div class="fixture-shortcodes-title"><a class="fixture-shortcodes-title-link" href="'.$tournamentPermalink.'">'.$title.'</a></div>
                        ';
                        break;
                }

                echo '
                    <div class="fixture-shortcodes-tile">
                        ' . $liveHeader . '
                        <a href="'.get_permalink().'" class="fixture-shortcodes-link-wrapper">                
                        <div class="fixture-shortcodes-teams-central">
                            <div class="fixture-shortcodes-team-col fixture-shortcodes-left">
                                <img class="fixture-shortcodes-team-logo" src="' .$firstParticipantLogo .'" alt="'.$firstParticipantName.'" />
                                <div class="fixture-shortcodes-team-name">'.$firstParticipantName.'</div>
                                <div class="fixture-shortcodes-odd">-</div>
                            </div>
                            <div class="fixture-shortcodes-score-col">
                                ' . $topScoreBoard . '
                                <div class="fixture-shortcodes-logo fixture-shortcodes-thunderpick">
                                    <img src="' . esc_url($thunderpickLogo) . '" alt="THUNDERPICK" style="height:100px;vertical-align:middle; margin-top:-40px; margin-bottom: -40px;">
                                </div>
                            </div>
                            <div class="fixture-shortcodes-team-col fixture-shortcodes-right">
                                <img class="fixture-shortcodes-team-logo" src="' . $secondParticipantLogo .'" alt="'.$secondParticipantName.'" />
                                <div class="fixture-shortcodes-team-name">'.$secondParticipantName.'</div>
                                <div class="fixture-shortcodes-odd">-</div>
                            </div>
                        </div>
                        </a>

                        <div class="fixture-shortcodes-separator"></div>

                        <a href="'.$tipster_link.'" class="fixture-shortcodes-link-wrapper">
                        <div class="fixture-shortcodes-author-section">
                            <div class="fixture-shortcodes-author-row1">
                                <img class="fixture-shortcodes-author-avatar" src="'.$avatar .'" alt="Avatar" />
                                <div class="fixture-shortcodes-author-meta">
                                    <div class="fixture-shortcodes-author-name">'.$author.'</div>
                                    <div class="fixture-shortcodes-author-title">'.$excerpt.'</div>
                                </div>
                            </div>
                            <div class="fixture-shortcodes-author-row2">
                                <p class="fixture-shortcodes-preview-text">'.$content.'</p>
                                <a class="fixture-shortcodes-read-more" href="'.$tipster_link.'">Read more...</a>
                            </div>
                        </div>
                        </a>
                    </div>';
                $recordCount++;
            }

            if(strtolower($tag_label) === 'inside' && count($insideActionData)){  
                foreach($insideActionData as $insideIndex => $insideData){
                    if($insideIndex === 0){
                        echo '
                            <div class="fixture-shortcodes-tile">
                                <div class="fixture-shortcodes-header">
                                    <div class="fixture-shortcodes-title-link-inside">
                                        '.$insideData['competitionName'].'
                                    </div>
                                </div>
                                <div class="fixture-shortcodes-teams-central">
                                    <div class="fixture-shortcodes-missing-days">
                                        Starts in ' . $insideData['daysDifference'] . ' days
                                    </div>
                                </div>

                                <div class="fixture-shortcodes-tournament-link-left-section">
                                    <a class="fixture-shortcodes-tournament-link-left" href="'.($insideData['tournamentLink'] ?? '#').'">
                                        Full Tournament Hub →
                                    </a>
                                </div>
                            </div>';
                    } else if($insideIndex === 1){
                        echo '
                            <div class="fixture-shortcodes-tile">
                                <div class="fixture-shortcodes-match-analysis">
                                    Match Analysis
                                </div>
                                <div class="fixture-shortcodes-teams-central">
                                    <div class="fixture-shortcodes-team-col fixture-shortcodes-left">
                                        <img class="fixture-shortcodes-team-logo" src="' .$insideData['firstParticipantLogo'] .'" alt="'.$insideData['firstParticipantName'].'" />
                                        <div class="fixture-shortcodes-team-name">'.$insideData['firstParticipantName'].'</div>
                                    </div>
                                    <div class="fixture-shortcodes-score-col">
                                        <div class="fixture-shortcodes-event-vs-text">
                                            VS
                                        </div>
                                    </div>
                                    <div class="fixture-shortcodes-team-col fixture-shortcodes-right">
                                        <img class="fixture-shortcodes-team-logo" src="' . $insideData['secondParticipantLogo'] .'" alt="'.$insideData['secondParticipantName'].'" />
                                        <div class="fixture-shortcodes-team-name">'.$insideData['secondParticipantName'].'</div>
                                    </div>
                                </div>

                                <div class="fixture-shortcodes-author-section">
                                    <a class="fixture-shortcodes-tournament-link" href="'.($insideData['tournamentLink'] ?? '#').'">
                                        '.$insideData['competitionName'].'
                                    </a>
                                </div>
                            </div>';
                    }
                }
            }
            wp_reset_postdata();
        } else {
            echo 'No matches found.';
        }

        echo '</div>';

        echo '<script>
            document.addEventListener("DOMContentLoaded", function () {
                console.log("[MK ODDS] DOM ready (Tile Mode)");

                const tiles = document.querySelectorAll(".fixture-shortcodes-tile");
                if (!tiles.length) {
                    console.warn("[MK ODDS] No tiles found");
                    return;
                }

                // --- Helpers ---
                const normalizeTeam = (name) =>
                    (name || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

                const findMatch = (fixture, matches) => {
                    const f1 = normalizeTeam(fixture.team1);
                    const f2 = normalizeTeam(fixture.team2);
                    return matches.find((m) => {
                        const m1 = normalizeTeam(m.team1);
                        const m2 = normalizeTeam(m.team2);
                        return (f1 === m1 && f2 === m2) || (f1 === m2 && f2 === m1);
                    });
                };

                // Extract all data from a tile
                const extractData = (tile) => {
                    const team1 = tile.querySelector(".fixture-shortcodes-team-col.fixture-shortcodes-left .fixture-shortcodes-team-name")?.textContent.trim();
                    const team2 = tile.querySelector(".fixture-shortcodes-team-col.fixture-shortcodes-right .fixture-shortcodes-team-name")?.textContent.trim();

                    // 🔹 tournament from the title above the tile
                    const tournament = tile.closest(".fixture-shortcodes-events")?.querySelector(".fixture-shortcodes-events-main-title")?.textContent.trim() || "";

                    return { team1, team2, tournament };
                };

                // Fetch odds
                const fetchOdds = () => {
                    const fixtures = [];
                    tiles.forEach((tile, idx) => {
                        const { team1, team2, tournament } = extractData(tile);
                        if (team1 && team2 && team1 !== "TBD" && team2 !== "TBD") {
                            fixtures.push({ index: idx, team1, team2, tournament });
                        }
                    });

                    if (!fixtures.length) {
                        console.warn("[MK ODDS] No valid fixtures");
                        return;
                    }

                    const params = new URLSearchParams({
                        action: "mk_get_odds",
                        nonce: mkOddsData.nonce,
                        fixtures: JSON.stringify(fixtures),
                    });

                    fetch(mkOddsData.ajaxUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: params,
                    })
                        .then((r) => r.json())
                        .then((data) => {
                            console.log("[MK ODDS] Response (Tile):", data);

                            data.forEach((entry) => {
                                const { fixture, matches } = entry;
                                const tile = tiles[fixture.index];
                                if (!tile) return;

                                if (!matches || !matches.length) {
                                    console.warn("[MK ODDS] No odds for", fixture);
                                    return;
                                }

                                const match = findMatch(fixture, matches);
                                if (!match) {
                                    console.warn("[MK ODDS] No matching teams found for", fixture, matches);
                                    return;
                                }

                                // Update odds
                                const leftOdd = tile.querySelector(".fixture-shortcodes-team-col.fixture-shortcodes-left .fixture-shortcodes-odd");
                                const rightOdd = tile.querySelector(".fixture-shortcodes-team-col.fixture-shortcodes-right .fixture-shortcodes-odd");

                                if (leftOdd) {
                                    leftOdd.innerHTML = `<a href="${match.matchUrl}" target="_blank" rel="noopener">${match.team1Odds}</a>`;
                                }
                                if (rightOdd) {
                                    rightOdd.innerHTML = `<a href="${match.matchUrl}" target="_blank" rel="noopener">${match.team2Odds}</a>`;
                                }

                                console.log(`[MK ODDS] ✅ Updated tile odds for ${fixture.team1} vs ${fixture.team2}`);
                            });
                        })
                        .catch((err) => console.error("[MK ODDS] Fetch error:", err));
                };

                // Initial + refresh
                fetchOdds();
                setInterval(fetchOdds, mkOddsData.refresh || 60000);
            });
            </script>';
            
        return ob_get_clean();
    }
}
add_shortcode('fixture_shortcodes_grid', 'render_fixture_shortcodes_grid');

/**
 * Enqueue styles for the tiles
 */
if (!function_exists('fixture_shortcodes_grid_styles')) {
    function fixture_shortcodes_grid_styles() {
        echo '<style>
        .fixture-shortcodes-events-header {
            display: flex;
            justify-content: space-between;
            align-items: center; 
            margin-bottom: 12px;
        }
        .fixture-shortcodes-events-link {
            font-size: 16px;
            font-weight: 400;
            color: #FFF;
            text-decoration: none;
        }
        .fixture-shortcodes-events-main-title {
            color: #FFF;
            font-family: "Barlow Condensed";
            font-size: 37px;
            font-style: normal;
            font-weight: 500;
            line-height: normal;
            margin-bottom: 12px;
            text-align: left;
        }
        .fixture-shortcodes-events-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 10px 0;
        }
        .fixture-shortcodes-tile {
            background: rgba(255,255,255,0.10);
            border-radius: 12px;
            padding: 18px 18px 12px 18px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            font-family: Arial, sans-serif;
        }
        .fixture-shortcodes-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 2px;
            position: relative;
        }
        .fixture-shortcodes-header-other-status {
            margin-bottom: 80px;
        }
        .fixture-shortcodes-header-spacer {
            flex: 1;
        }
        .fixture-shortcodes-badge {
            display: flex;
            align-items: center;
            color: #FFF;
            padding: 4px 10px;
            border-radius: 4px;
            font-family: Inter, Arial, sans-serif;
            font-size: 16px;
            font-weight: 400;
            gap: 8px;
            text-transform: uppercase;
            background: inherit;
            margin-right: 8px;
            margin-bottom: 10px;
        }
        .fixture-shortcodes-badge.red { background: #CE2222; }
        .fixture-shortcodes-badge.orange { background: #ff9800; }
        .fixture-shortcodes-badge.blue { background: #1976d2; }
        .fixture-shortcodes-badge.gray { background: #888; }
        .fixture-shortcodes-event-logo {
            width: 24px;
            flex-shrink: 0;
            aspect-ratio: 1 / 1;
        }
        .fixture-shortcodes-title-link {
            overflow: hidden;
            color: #FFF !important;
            text-align: center;
            text-overflow: ellipsis;
            font-family: "Barlow Condensed"!important;
            font-size: 16px;
            font-style: normal;
            font-weight: 600;
            line-height: normal;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 1;
            align-self: stretch;
        }
        .fixture-shortcodes-title-link:hover {
            color: #FFF !important;
        }
        .fixture-shortcodes-teams-central {
            display: flex;
            justify-content: space-between;
            align-items: stretch;
            margin: 18px 0 8px 0;
            width: 100%;
            gap: 8px;
            padding: 16px;
        }
        .fixture-shortcodes-team-col {
            display: flex;
            flex-direction: column;
            align-items: center;
            flex: 1 1 0;
            min-width: 0;
        }
        .fixture-shortcodes-team-col .fixture-shortcodes-team-logo {
            width: 40px;
            height: 40px;
            border-radius: 2px;
        }
        .fixture-shortcodes-team-col .fixture-shortcodes-team-name {
            color: #FFF;
            text-align: center;
            font-family: Inter;
            font-size: 12px;
            font-style: normal;
            font-weight: 400;
            line-height: normal;
            display: flex;
            height: 40px;
            justify-content: center;
            align-items: center;
            gap: 10px;
            align-self: stretch;
        }
        .fixture-shortcodes-team-col .fixture-shortcodes-odd {
            display: flex;
            width: 60px;
            height: 28px;
            padding: 4px;
            justify-content: center;
            align-items: center;
            gap: 10px;
            border-radius: 4px;
            background: #1C1C1C;
        }
        .fixture-shortcodes-score-col {
            display: flex;
            flex-direction: column;
            align-items: center;
            flex: 1.2 1 0;
            min-width: 0;
            gap: 8px;
            align-self: stretch;
        }
        .fixture-shortcodes-score-main {
            color: #FFF;
            font-family: "Barlow Condensed";
            font-size: 28px;
            font-style: normal;
            font-weight: 500;
            line-height: normal;
        }
        .fixture-shortcodes-score-date {
            color: #FFF;
            font-family: "Barlow Condensed";
            font-size: 16px;
            font-style: normal;
            font-weight: 400;
            line-height: normal;
        }
            .fixture-shortcodes-score-final {
            color: #FFF;
            font-family: "Barlow Condensed";
            font-size: 28px;
            font-style: normal;
            font-weight: 500;
            line-height: normal;
        }
        .fixture-shortcodes-map-scores {
            font-size: 13px;
            color: #FFF !important;
            margin-bottom: 8px;
            width: 100%;
        }
        .fixture-shortcodes-map-scores div {
            margin-bottom: 2px;
            display: flex;
            align-items: center;
            gap: 4px;
            justify-content: center;
        }
        .fixture-shortcodes-map-score-num {
            color: #FFF !important;
            text-align: center;
            font-family: Inter;
            font-size: var(--Font-Scale-075, );
            font-style: normal;
            font-weight: 400;
            line-height: normal;
        }
        .fixture-shortcodes-map-score-num-overpass { 
            color: #FFF;
            text-align: center;
            font-family: Inter;
            font-size: 12px;
            font-style: normal;
            font-weight: 400;
            line-height: normal;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 4px;
        }
        .fixture-shortcodes-map-score-num-mirage { 
            color: #FFF;
            text-align: center;
            font-family: Inter;
            font-size: 12px;
            font-style: normal;
            font-weight: 400;
            line-height: normal;
        }
        .fixture-shortcodes-map-score-num-vertigo { 
            color: #FFF;
            text-align: center;
            font-family: Inter;
            font-size: 12px;
            font-style: normal;
            font-weight: 400;
            line-height: normal;
        }
        .fixture-shortcodes-map-score-num.red { 
            color: #ff1616 !important; 
            font-family: Inter;
            font-size: 12px;
            font-style: normal;
            font-weight: 700;
            line-height: normal;
        }
        .fixture-shortcodes-map-score-num.green { 
            color: #19f052 !important; 
            font-family: Inter;
            font-size: 12px;
            font-style: normal;
            font-weight: 700;
            line-height: normal;
        }
        .fixture-shortcodes-map-score-num.gray { 
            color: #FFF;
            font-family: Inter;
            font-size: 12px;
            font-style: normal;
            font-weight: 700;
            line-height: normal;
        }
        .fixture-shortcodes-map-score-num.black { 
            color: #0A0A0A;
            font-family: Inter;
            font-size: 12px;
            font-style: normal;
            font-weight: 700;
            line-height: normal;
        }
        .fixture-shortcodes-odds-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 10px 0 8px 0;
        }
        .fixture-shortcodes-odd {
            font-size: 16px;
            font-weight: bold;
            background: #f5f5f5;
            padding: 4px 12px;
            border-radius: 5px;
        }
        .fixture-shortcodes-logo {
            font-size: 13px;
            font-weight: bold;
            letter-spacing: 1px;
        }
        .fixture-shortcodes-event-schedule {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
        }
        .fixture-shortcodes-event-date {
            color: #FFF;
            font-family: var(--Font-Family-Plain, Inter);
            font-size: var(--Font-Scale-100, 16px);
            font-style: normal;
            font-weight: 400;
            line-height: normal;
        }
        .fixture-shortcodes-event-time {
            color: #FFF;
            font-family: "Barlow Condensed";
            font-size: 28px;
            font-style: normal;
            font-weight: 500;
            line-height: normal;
        }
        .fixture-shortcodes-author-section {
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-top: 10px;
        }
        .fixture-shortcodes-author-row1 {
            display: flex;
            align-items: flex-start;
            gap: 10px;
        }
        .fixture-shortcodes-author-avatar {
            width: 60px;
            height: 60px;
            border-radius: 4px!important;
            object-fit: cover;
            object-position: 50%;
            display: block;
            flex-shrink: 0;
        }
        .fixture-shortcodes-author-meta {
            display: flex;
            flex-direction: column;
            justify-content: center;
            min-width: 0;
        }
        .fixture-shortcodes-author-name {
            color: #FFF;
            font-family: Inter;
            font-size: 16px;
            font-style: normal;
            font-weight: 400;
            line-height: normal;
        }
        .fixture-shortcodes-author-title {
            overflow: hidden;
            color: #FFF;
            text-overflow: ellipsis;
            font-family: "Barlow Condensed";
            font-size: 28px;
            font-style: normal;
            font-weight: 500;
            line-height: normal;
        }
        .fixture-shortcodes-author-row2 {
            display: flex;
            flex-direction: column;
            gap: 2px;
            margin-left: 0; /* aligns with avatar above */
        }
        .fixture-shortcodes-preview-text {
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 3;
            align-self: stretch;
            overflow: hidden;
            color: #FFFFFF90;
            text-overflow: ellipsis;
            font-family: Inter;
            font-size: 12px;
            font-style: normal;
            font-weight: 400;
            line-height: normal;
        }
        .fixture-shortcodes-read-more {
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 3;
            align-self: stretch;
            overflow: hidden;
            color: #FFFFFF90 !important;
            text-overflow: ellipsis;
            font-family: Inter!important;
            font-size: 12px;
            font-style: normal;
            font-weight: 400;
            line-height: normal;
        }

        .fixture-shortcodes-match-analysis {
            overflow: hidden;
            color: var(--Text-Default-Solid-Default, #0A0A0A);
            text-align: center;
            text-overflow: ellipsis;
            font-family: var(--Font-Family-Brand, "Barlow Condensed");
            font-size: 28px;
            font-style: normal;
            font-weight: 500;
            line-height: normal;
        }
        .fixture-shortcodes-event-vs-text {
            color: var(--Text-Default-Solid-Default, #0A0A0A);
            /* Body */
            font-family: var(--Font-Family-Plain, Inter);
            font-size: var(--Font-Scale-100, 16px);
            font-style: normal;
            font-weight: 400;
            line-height: normal;
        }

        .fixture-shortcodes-tournament-link {
            overflow: hidden;
            color: var(--Text-Primary-Tertiary, #D92420)!important;
            text-align: center;
            text-overflow: ellipsis;
            white-space: nowrap;

            /* Brand SemiBold 16 */
            font-family: var(--Font-Family-Brand, "Barlow Condensed")!important;
            font-size: var(--Font-Scale-100, 16px);
            font-style: normal;
            font-weight: 600;
            line-height: normal;
            margin-bottom: 10px;
        }

        .fixture-shortcodes-tournament-link-left-section {
            position: absolute;
            bottom: 20px;
            left: 20px;
        }

        .fixture-shortcodes-tournament-link-left {
            display: flex;
            padding: var(--Spacing-100, 16px);
            flex-direction: column;
            justify-content: space-between;
            align-items: flex-start;
            flex: 1 0 0;
            overflow: hidden;
            color: var(--Text-Primary-Tertiary, #D92420)!important;
            text-overflow: ellipsis;

            /* Brand SemiBold 16 */
            font-family: var(--Font-Family-Brand, "Barlow Condensed")!important;
            font-size: var(--Font-Scale-100, 16px);
            font-style: normal;
            font-weight: 600;
            line-height: normal;
        }

        .fixture-shortcodes-missing-days {
            overflow: hidden;
            color: var(--Text-Default-Solid-Default, #0A0A0A);
            text-overflow: ellipsis;

            /* Body */
            font-family: var(--Font-Family-Plain, Inter);
            font-size: var(--Font-Scale-100, 16px);
            font-style: normal;
            font-weight: 400;
            line-height: normal;
        }   

        .fixture-shortcodes-title-link-inside {
            overflow: hidden;
            color: var(--Text-Default-Solid-Default, #0A0A0A);
            text-overflow: ellipsis;

            /* Desktop/H4 */
            font-family: var(--Font-Family-Brand, "Barlow Condensed");
            font-size: 28px;
            font-style: normal;
            font-weight: 500;
            line-height: normal;
        }
            .fixture-shortcodes-separator {
                display: block;      
                width: 100%;           
                max-width: 100%;      
                height: 1px;        
                background-color: #E7E7E7;
                margin: 20px auto;    
                clear: both;         
            }   

        @media (max-width: 700px) {
            .fixture-shortcodes-events-grid {
                grid-template-columns: 1fr;
            }
            .fixture-shortcodes-tile {
                padding: 12px 4px 8px 4px;
                border-radius: 0px!important;
            }
            .fixture-shortcodes-header {
                margin-bottom: 15px;
                padding-left: 10px;
                padding-right: 10px;
            }
            .teams-central {
                margin-top: 20px;
                flex-direction: row;
                gap: 12px;
            }
            .fixture-shortcodes-team-col, .fixture-shortcodes-score-col {
                width: 100%;
                min-width: 0;
                align-items: center;
            }
            .fixture-shortcodes-author-section {
                flex-direction: column;
                gap: 8px;
                padding-left: 10px;
                padding-right: 10px;
            }
            .fixture-shortcodes-author-row1 {
                flex-direction: row;
                margin-top: 20px;
            }
            .fixture-shortcodes-author-row2 {
                flex-direction: column;
                align-items: flex-start;
            }
            .fixture-shortcodes-author-avatar {
                margin-bottom: 8px;
            }
            .fixture-shortcodes-separator {
                display: block;      
                width: 95%;           
                max-width: 100%;      
                height: 1px;        
                background-color: #E7E7E7;
                margin: 20px auto;    
                clear: both;         
            }            
        }
        </style>';
    }
}
add_action('wp_head', 'fixture_shortcodes_grid_styles');
