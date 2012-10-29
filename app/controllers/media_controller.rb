class MediaController < ApplicationController
  include Cache, Spectrogram, Audio
  
  def index
    # index page for media files
    @testing = QubarSite::Application.config.media_file_config
  end
  
  def item
    # page for an individual media file
    # use params to get query string or parsed route parameters
    
    # get the path for the file matching the request
    file_name = Cache::cached_spectrogram_file(params)
    #file_name = Cache::cached_audio_file(params)
    #file_name = Cache::original_audio_file({ :id => '21EC2020-3AEA-1069-A2DD-08002B30309D', :date => '20121026', :time => '132600', :format => 'wav'})
    
    #@file_path = Cache::possible_paths(file_name)
    #@file_path = Cache::existing_paths(Cache::cached_spectrogram_storage_paths,file_name)
    #@file_path = QubarSite::Application.config.media_file_config.cached_spectrogram_paths
    @file_path = Cache::possible_paths(Cache::cached_spectrogram_storage_paths,file_name)
    
    # see if the requested file exists

    @avail_params = params
    
  end
  
  def info
    @input_path = './test/fixtures/'
    # not-an-audio-file.wav 
    # TorresianCrow.wav 
    # TestAudio1.wv 
    # sites.yml
    # this file does not exist.nope
    @audio = 'TestAudio1.wv'
    @input_audio = @input_path + @audio
    @result = Audio::info(@input_audio)
  end
  def audio
    print params
    
    @input_path = './test/fixtures/'
    @output_path = './public/tests/'
    
    @audio = 'TestAudio1.wv'
    @modified_audio = 'TestAudio1.wav'
    
    @input_audio = @input_path + @audio
    @output_audio = @output_path + @modified_audio
    
    
    #@result = Audio::modify(@input_audio, @output_audio, [])
  end
  def spectrogram
    print params
    @input_path = './test/fixtures/'
    @output_path = './public/tests/'
    
    @audio = 'TorresianCrow.wav'
    @image = 'TorresianCrow.png'
    
    @input_audio = @input_path + @audio
    @output_image = @output_path + @image
    
    #@result = Spectrogram::generate(@input_audio, @output_image)
  end
end