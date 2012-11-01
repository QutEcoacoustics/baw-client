class MediaController < ApplicationController
  include Cache, Spectrogram, Audio

  respond_to :xml, :json, :html, :png

  def index
    # index page for media files
    @testing = QubarSite::Application.config.media_file_config
  end
  
  def item
    # page for an individual media file
    # use params to get query string or parsed route parameters
    
    @avail_params = params
    
    # see if a file extension was specified.
    # if none was specified, default to html
    if !params.include? 'format'
      params[:format] = 'html'
    end
    
    if params[:format] == 'png'  # if the extension is png, it is a spectrogram request
      file_name = Cache::cached_spectrogram_file(params)
      file_paths = Cache::possible_paths(Cache::cached_spectrogram_storage_paths,file_name)
    
    elsif ['mp3', 'webm', 'webma', 'ogg', 'oga'].include? params[:format] # if the extension is mp3, webma, ogg, it is an audio request
      file_name = Cache::cached_audio_file(params)
      file_paths = Cache::possible_paths(Cache::cached_audio_storage_paths,file_name)
    else
      # invalid request, what to do?
    end
    
    @file_paths = file_paths
    
    mimeType = Mime::Type.lookup_by_extension(params[:format])
#=begin
    # respond to the request
    respond_with do |format|
      format.html { render }
      format.htm { render 'index.html.erb' }
      format.json { render json: params }
      format.js { render json: params }
      format.mp3 { send_file_response @file_paths, mimeType }
      format.webma { send_file_response @file_paths, mimeType }
      format.webm { send_file_response @file_paths, mimeType }
      format.oga { send_file_response @file_paths, mimeType }
      format.ogg { send_file_response @file_paths, mimeType }
      format.png { send_file_response @file_paths, mimeType }
    end
#=end
    #render :formats => [:html]
  end
  
private

  def send_file_response (file_paths, mime_type)  
    send_file file_paths[0], :stream => true, :buffer_size => 4096, :disposition => 'inline', :type => mime_type
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