module Exceptions
  class AudioFileNotFoundError < IOError; end
  class SpectrogramFileNotFoundError < IOError; end
end