module.exports = function (environment) {

    return {
        "namespace": "baw-client",
        "brand": environment.brand,
        "rails": {
            "loginRedirectQsp": "redirect_to"
        },
        "localization": {
            "dateTimeFormat": "YYYY-MMM-DD HH:mm:ss",
            "dateTimeFormatAngular": "yyyy-MMM-dd HH:mm:ss",
            "dateTimeShortFormat": "YYYY-MMM-DD HH:mm",
            "dateFormat": "YYYY-MMM-DD"
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
                "autoPlay": false,
                "visualize": {
                    "showTemporalContext": false
                }
            },
            "userName": "Unknown user"
        },
        "annotationLibrary": {
            "paddingSeconds": 1.0
        },
        "browserSupport": {
            "optimum": {
                "chrome": 36
            },
            "supported": {
                "msie": 10,
                "firefox": 36,
                "chrome": 30,
                "safari": 5.1,
                "opera": 23,
                "ios": 5.1,
                "android": 4.0
            },
            "baseMessage": "Your current internet browser ({name}, version {version}) is {reason}. <br/> Consider updating or try using <a target='_blank' href='https://www.google.com.au/intl/en_au/chrome/browser/' >Google Chrome</a>.",
            "localStorageKey": "browserSupport.checked"
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
    }
}