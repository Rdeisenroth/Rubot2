const users =
    [
        {
            /**
             * Discord ID
             */
            _id: "313753317484527616",
            // Coaching Sessions, only 
            sessions:
                ["ObjectID(61128913cf3fefbc62e7cd7e)"],
        },
    ];

const sessions =
    [
        {
            _id: "ObjectID(61128913cf3fefbc62e7cd7e)",
            active: true,
            user: "313753317484527616",
            guild: "604601483920408576",
            queue: "queue_id", //optional
            role: "coach", // participant|coach|supervisor
            started_at: "1629567410185",
            ended_at: undefined, //Set when active=false
            end_certain: false, // Only set to true if session had a clean exit
            rooms: ["626065226986553343", "626065222936553347"],
        },
    ];

const rooms =
    [
        {
            /**
             * If the Channel exists, it's active
             */
            active: true,
            tampered: false, // If Someone tampered with the Permissions/Name or Position of the Channel (or other Settings)
            end_certain: false, // Only set to true if session had a clean exit
            events: // Events
                [
                    {
                        timestamp: "1629567410185",
                        type: "create_channel",
                        emitted_by: "me", // Client ID or me
                        reason: "Queue System: 'Sprechstunden' Queue automated room Creation",
                    },
                    {
                        timestamp: "1629567410186",
                        type: "move_member",
                        emitted_by: "me", // Client ID or me
                        reason: "Queue System: 'Sprechstunden' Queue automated member Move: 313753317484527616 (coach)",
                    },
                    {
                        timestamp: "1629567410187",
                        type: "move_member",
                        emitted_by: "me", // Client ID or me
                        reason: "Queue System: 'Sprechstunden' Queue automated member Move 313753317484527617 (participant 1/2)",
                    },
                    {
                        timestamp: "1629567410188",
                        type: "move_member",
                        emitted_by: "me", // Client ID or me
                        reason: "Queue System: 'Sprechstunden' Queue automated member Move 313753317484527618 (participant 2/2)",
                    },
                    {
                        timestamp: "1629567410189",
                        type: "lock_channel",
                        emitted_by: "313753317484527616", // Client ID or me
                        reason: "Temp VC System: Owner Locked Channel. (3 Members remaining)",
                    },
                    {
                        timestamp: "1629567410190",
                        type: "kick_user",
                        emitted_by: "313753317484527616", // Client ID or me
                        reason: "Temp VC System: Owner Kicked User:  (2 Members remaining) Specified reason: Frage von <@313753317484527618> beantwortet, <@313753317484527617> hat weitere Frage",
                    },
                    {
                        timestamp: "1629567410191",
                        type: "user_leave",
                        emitted_by: "313753317484527616", // Client ID or me
                        reason: "Queue System: Coach moves on, but left room open to come back later", // We need some kind of client.supressEvent(<event>) magic here
                    },
                    {
                        timestamp: "1629567410192",
                        type: "user_join",
                        emitted_by: "313753317484527616", // Client ID or me
                        reason: "Queue System: Coach rejoined", // We need some kind of client.supressEvent(<event>) magic here
                    },
                    {
                        timestamp: "1629567410193",
                        type: "destroy_channel",
                        emitted_by: "313753317484527616", // Client ID or me
                        reason: "Queue System: Room destroyed by coach, clean exit", // We need some kind of client.supressEvent(<event>) magic here
                    },
                ],
        },
    ];
/**
 * guilds
 * sessions
 * rooms: {
 *      active: boolean
 *      events: {
 *          create|join|mute|move|kick|leave|destroy
 *      }
 * }
 * users
 */