module.exports = function (environment) {

    return {
        "namespace": "baw-client",
        "brand": environment.brand,
        "rails": {
            "loginRedirectQsp": "redirect_to"
        },
        "localization": {
            "dateTimeFormat": "YYYY-MMM-DD HH:mm:ss",
            "dateTimeFormatD3": "%Y-%b-%d %H:%M:%S",
            "dateTimeFormatAngular": "yyyy-MMM-dd HH:mm:ss",
            "dateTimeShortFormat": "YYYY-MMM-DD HH:mm",
            "dateFormat": "YYYY-MMM-DD",
            "timeFormatD3": "%H:%M:%S"
        },
        "listen": {
            "chunkDurationSeconds": 30.0,
            "minAudioDurationSeconds": 2.0
        },
        "unitConverter": {
            "precisionSeconds": 9,
            "precisionHertz": 6
        },
        "defaultProfile": {
            "createdAt": null,
            "email": null,
            "id": null,
            "preferences": {
                "volume": 1.0,
                "muted": false,
                "autoPlay": true,
                "visualize": {
                    "hideImages": false,
                    "hideFixed": true
                }
            },
            "userName": "Unknown user"
        },
        "annotationLibrary": {
            "paddingSeconds": 1.0
        },
        "queryBuilder": {
            "defaultPage": 0,
            "defaultPageItems": 10,
            "defaultSortDirection": "asc"
        },
        "bookmark": {
            "lastPlaybackPositionName": "Last playback position",
            "appCategory": "<<application>>"
        }
    };
};
