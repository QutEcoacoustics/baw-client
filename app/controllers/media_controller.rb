class MediaController < ApplicationController
  include Cache, Spectrogram, Audio

  respond_to :xml, :json, :html, :png, :ogg, :oga, :webm, :webma, :mp3

  def index
    # index page for media files
    #@testing = QubarSite::Application.config.media_file_config
  end
  
  def item
    # page for an individual media file

    @requested_format1 = request.format
    @requested_format2 =  params[:format]

    respond_to do |format|
      format.html { render 'item.html.erb'}
      format.json { render 'item.html.erb' }
      format.png { render 'item.html.erb' }
      format.mp3 { render 'item.html.erb' }
      format.oga { render 'item.html.erb' }
      format.ogg { render 'item.html.erb' }
    end


=begin
    # determine the request format
    if request.format == :html

    elsif %w(png jpg).include? request.format
      file_name = Cache::cached_spectrogram_file(params)
      file_paths = Cache::existing_paths(Cache::cached_spectrogram_storage_paths,file_name)

    elsif %w(ogg oga webm webma mp3).include?  request.format
      file_name = Cache::cached_audio_file(params)
      file_paths = Cache::existing_paths(Cache::cached_audio_storage_paths,file_name)

    else

    end

    # use the
    @requested_format = request.format
    return render

    # use params to get query string or parsed route parameters
    #@avail_params = params

    if params.include? :format

    else
      params[:format] = 'html'
    end

    # if an image format was specified, get spectrogram information, otherwise audio
    if %w(png jpg).include? params[:format]  # if the extension is png or jpg, it is a spectrogram request
      file_name = Cache::cached_spectrogram_file(params)
      file_paths = Cache::existing_paths(Cache::cached_spectrogram_storage_paths,file_name)
    else
      file_name = Cache::cached_audio_file(params)
      file_paths = Cache::existing_paths(Cache::cached_audio_storage_paths,file_name)
    end

    # construct a hash of information to be returned
    @file_info = params

    @file_info.delete 'controller'
    @file_info.delete 'action'
    @file_info.delete 'format'

    if file_paths.length > 0 && %w(html htm js json).include?(params[:format])
      @file_info[:information] = Audio::info file_paths.first
    end

    mime_type = Mime::Type.lookup_by_extension(params[:format])

    # respond to the request
    respond_with do |format|
      format.html {
        render
      }
      format.htm {
        render 'index.html.erb'
      }
      format.json { render json: @file_info }
      format.js { render json: @file_info }
      format.mp3 { send_file_response file_paths, file_name, mime_type }
      format.webma { send_file_response file_paths, file_name, mime_type }
      format.webm { send_file_response file_paths, file_name, mime_type }
      format.oga { send_file_response file_paths, file_name, mime_type }
      format.ogg { send_file_response file_paths, file_name, mime_type }
      format.png { send_file_response file_paths, file_name, mime_type }
    end
=end
  end
  
private

  def send_file_response (file_path, file_name, mime_type)
    #raise RuntimeError, "Can't find a source for file: #{file_name}" unless file_paths.length > 0
    send_file file_path, :stream => true, :buffer_size => 4096, :disposition => 'inline', :type => mime_type, :content_type => mime_type
  end
end