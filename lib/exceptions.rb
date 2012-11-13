module Exceptions
  class AudioFileNotFoundError < IOError; end
  class SpectrogramFileNotFoundError < IOError; end
  class HarvesterConfigFileNotFound < IOError; end
end