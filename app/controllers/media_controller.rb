class MediaController < ApplicationController
  def index
    @input_path = './test/fixtures/'
    @output_path = './public/tests/'
    
    @audio = 'TorresianCrow.wav'
    @image = 'TorresianCrow.png'
    
    @input_audio = @input_path + @audio
    @output_image = @output_path + @image
    
    stdout_str, stderr_str, status = Open3.capture3("./vendor/bin/sox/windows/sox.exe  -V \"#{@input_audio}\" -n rate 22050 spectrogram -m -r -l -a -q 249 -w hann -y 257 -X 43.06640625 -z 100 -o \"#{@output_image}\"")
    @result = [stdout_str, stderr_str, status]
  end
end