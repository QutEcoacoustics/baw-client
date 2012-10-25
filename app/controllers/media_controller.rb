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
    @file_path = Cache::calculate_target_path(params)
    
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