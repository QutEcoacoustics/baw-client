angular
    .module("bawApp.services.mime", [])
    .service(
        "MimeType",
        [
            function () {
                let make = (name, icon, mimeTypes, extensions) => ({extensions, icon, mimeTypes, name});

                let mimeTypes = [
                    make("png", "fa-file-image-o", ["image/png"], ["png"]),
                    make("jpeg", "fa-file-image-o", ["image/jpeg"], ["jpeg", "jpg", "jpe", "pjpeg"]),
                    make("gif", "fa-file-image-o", ["image/gif"], ["gif"]),
                    make("bitmap", "fa-file-image-o", ["image/bitmap"], ["bmp"]),
                    make("wave", "fa-file-audio-o", [
                        "audio/wav",
                        "audio/x-wav",
                        "audio/wave",
                        "audio/x-pn-wav"], ["wav"]),
                    make("mp3", "fa-file-audio-o", ["audio/mpeg3", "audio/x-mpeg-3"], ["mp3"]),
                    make("csv", "fa-file-excel-o", ["text/csv"], ["csv"]),
                    make("html", "fa-file-code-o", ["text/html", "application/xhtml+xml"], ["html", "xhtml"]),
                    make("plain", "fa-file-text-o", ["text/plain"], ["txt"]),
                    make("yaml", "fa-file-code-o", ["application/x-yaml", "text/yaml"], ["yaml", "yml"]),
                    make("xml", "fa-file-code-o", ["application/x-xml", "application/xml", "text/xml"], ["xml"]),
                    make("json", "fa-file-code-o", [
                        "application/x-json",
                        "application/json",
                        "text/json",
                        "text/x-json"], ["json"]),
                    make("pdf", "fa-file-pdf-o", ["application/pdf"], ["pdf"]),
                    make("zip", "fa-file-archive-o", ["application/zip"], ["zip"]),
                    make("gzip", "fa-file-archive-o", ["application/gzip", "application/x-gzip"], ["gz", "gzip"]),
                    make("binary", "fa fa-file-o", ["application/octet-stream"], null),
                    make("unknown", "fa fa-file-o", ["application/unknown"], null)
                ];


                let reverseLookup = new Map(
                    mimeTypes.reduce(
                        (rest, m) => rest.concat(
                            m.mimeTypes.map(mt => [mt, m])
                        ),
                        []
                    )
                );


                function mimeToMode(mimeType) {
                    if (reverseLookup.has(mimeType)) {
                        return reverseLookup.get(mimeType).name;
                    }
                    else {
                        return null;
                    }
                }

                function mimeToFaIcon(mimeType) {
                    if (reverseLookup.has(mimeType)) {
                        return "fa " + reverseLookup.get(mimeType).icon;
                    }
                    else {
                        return "fa fa fa-file-o";
                    }
                }

                return {
                    mimeTypes,
                    mimeToMode,
                    mimeToFaIcon
                };

            }
        ]
    );
