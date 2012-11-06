module FileCacher
  include Cache, Spectrogram, Audio, Exceptions

  public

  def self.generate_spectrogram(modify_parameters = {})
    # first check if a cached spectrogram matches the request
    target_file = Cache::cached_spectrogram_file modify_parameters
    target_existing_paths = Cache::existing_paths(Cache::cached_spectrogram_storage_paths,target_file)

    if target_existing_paths.blank?
      # if no cached spectrogram images exist, try to create them from the cached audio
      source_file = Cache::cached_audio_file modify_parameters
      source_existing_paths = Cache::existing_paths(Cache::cached_audio_storage_paths,source_file)

      if source_existing_paths.blank?
        # if no cached audio files exist, try to create them
        create_audio_segment modify_parameters
        source_existing_paths = Cache::existing_paths(Cache::cached_audio_storage_paths,source_file)
        # raise an exception if the cached audio files could not be created
        raise Exceptions::SourceAudioFileNotFoundError, "Could not generate spectrogram." if source_existing_paths.blank?
      end

      # create the spectrogram image in each of the possible paths
      target_possible_paths = Cache::possible_paths(Cache::cached_spectrogram_storage_paths,target_file)
      target_possible_paths.each { |path| Spectrogram::generate source_existing_paths.first, path, modify_parameters }
      target_existing_paths = Cache::existing_paths(Cache::cached_spectrogram_storage_paths,target_file)
    end

    # the requested spectrogram image should exist in at least one possible path
    # return the first existing full path
    target_existing_paths.first
  end

  def self. create_audio_segment(modify_parameters = {})
    # first check if a cached audio file matches the request
    target_file = Cache::cached_audio_file modify_parameters
    target_existing_paths = Cache::existing_paths(Cache::cached_audio_storage_paths,target_file)

    if target_existing_paths.blank?
      # if no cached audio files exist, try to create them from the original audio
      source_file = Cache::original_audio_file modify_parameters
      source_existing_paths = Cache::existing_paths(Cache::original_audio_storage_paths,source_file)

      if source_existing_paths.blank?
        # if the original audio files cannot be found, raise an exception
        raise Exceptions::SourceAudioFileNotFoundError, "Could not find original audio file." if source_existing_paths.blank?
      end

      # create the cached audio file in each of the possible paths
      target_possible_paths = Cache::possible_paths(Cache::cached_audio_storage_paths,target_file)
      target_possible_paths.each { |path| Audio::modify source_existing_paths.first, path, modify_parameters }
      target_existing_paths = Cache::existing_paths(Cache::cached_audio_storage_paths,target_file)
    end

    # the requested audio file should exist in at least one possible path
    # return the first existing full path
    target_existing_paths.first
  end
end