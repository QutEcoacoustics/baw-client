class MediaController < ApplicationController
  include Spectrogram
  def index
    @input_path = './test/fixtures/'
    @audio = 'TorresianCrow.wav'
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
    
    @result = Audio::segment(@input_audio, @output_audio)
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