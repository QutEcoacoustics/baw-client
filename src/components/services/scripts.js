angular
    .module("bawApp.services.script", [])
    .factory(
        "Script",
        [
            "$resource",
            "bawResource",
            "$http",
            "$q",
            "conf.paths",
            "lodash",
            "casingTransformers",
            "QueryBuilder",
            "baw.models.Script",
            "$url",
            function ($resource, bawResource, $http, $q, paths, _, casingTransformers, QueryBuilder, ScriptModel, $url) {
                /*
                // FAKED!
                let fakedData = [

                    {
                        "id": 1,
                        "name": "simulate work",
                        "description": "simulates running an analysis",
                        "analysis_identifier": "SIMULATE_WORK",
                        "version": 1,
                        "creator_id": 1,
                        "created_at": "2016-02-18T15:58:05.465+10:00",
                        "executable_settings": `{\n\t"hellllo": "test"\n}`,
                        "executable_settings_media_type": "application/json"
                    },
                    {
                        "id": 2,
                        "name": "simulate work VERSION 2",
                        "description": "simulates running an analysis",
                        "analysis_identifier": "SIMULATE_WORK",
                        "version": 2,
                        "creator_id": 1,
                        "created_at": "2016-02-18T15:58:05.465+10:00",
                        "executable_settings": "---\nAnalysisName: Towsey.KoalaMale\n# min and max of the freq band to search\nMinHz: 250          \nMaxHz: 800\n# duration of DCT in seconds \n# this cannot be too long because the oscillations are not constant.\nDctDuration: 0.30\n# minimum acceptable amplitude of a DCT coefficient\nDctThreshold: 0.5\n# ignore oscillation rates below the min & above the max threshold\n# OSCILLATIONS PER SECOND\nMinOcilFreq: 20        \nMaxOcilFreq: 55\n# Minimum duration for the length of a true event (seconds).\nMinDuration: 0.5\n# Maximum duration for the length of a true event.\nMaxDuration: 2.5\n# Event threshold - Determines FP \/ FN trade-off for events.\nEventThreshold: 0.2\n################################################################################\nSaveIntermediateWavFiles: false\nSaveIntermediateCsvFiles: false\nSaveSonogramImages: false\nDisplayCsvImage: false\nParallelProcessing: false\n#DoNoiseReduction: true\n#BgNoiseThreshold: 3.0\n\nIndexPropertiesConfig: \".\\\\IndexPropertiesConfig.yml\"\n...",
                        "executable_settings_media_type": "application/x-yaml"
                    }
                ];
                fakedData = casingTransformers.transformObject(fakedData, casingTransformers.camelize);
                */

                function query() {
                    const url = paths.api.routes.scripts.listAbsolute;
                    return $http
                        .get(url)
                        .then(x => ScriptModel.makeFromApi(x));
                }

                function get(id) {
                    const url = $url.formatUri(paths.api.routes.scripts.showAbsolute, {scriptId: id});
                    return $http
                        .get(url)
                        .then(x => ScriptModel.makeFromApi(x));
                }

                return {
                    query,
                    get
                };
            }]);
