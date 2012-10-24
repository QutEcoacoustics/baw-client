class MediaController < ApplicationController
  include Spectrogram
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
    @input_path = './test/fixtures/'
    @output_path = './public/tests/'
    
    @audio = 'TorresianCrow.wav'
    @modified_audio = 'TorresianCrow.wav'
    
    @input_audio = @input_path + @audio
    @output_audio = @output_path + @modified_audio
    
    @result = Audio::modify(@input_audio, @output_audio, [])
  end
  def spectrogram
    @input_path = './test/fixtures/'
    @output_path = './public/tests/'
    
    @audio = 'TorresianCrow.wav'
    @image = 'TorresianCrow.png'
    
    @input_audio = @input_path + @audio
    @output_image = @output_path + @image
    
    @result = Spectrogram::generate(@input_audio, @output_image)
  end
end