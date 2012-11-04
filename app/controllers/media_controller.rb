class MediaController < ApplicationController
  include FileCacher

  respond_to :xml, :json, :html, :png, :ogg, :oga, :webm, :webma, :mp3

  def index
    # index page for media files
    #@testing = QubarSite::Application.config.media_file_config
  end
  
  def item
    # controller action for an individual media file

    # construct a hash of information to be returned and used for modify_parameters
    @file_info = params
    @file_info.delete 'controller'
    @file_info.delete 'action'
    @file_info.delete 'format'

    # decide on the format requested. There are at least two ways to get the request format:
    # request.format (created based on accept mime type) and params[:format] (from the file extension in the request)

    format_requested_from_accept = Mime::Type[request.format]
    format_requested_from_ext = Mime::Type.lookup_by_extension(params[:format])

    final_format_requested = format_requested_from_accept

    image_media_types = [ Mime::Type['image/png'] ]
    audio_media_types = [ Mime::Type['audio/webm'], Mime::Type['audio/webma'],
                          Mime::Type['audio/ogg'], Mime::Type['audio/oga'],
                          Mime::Type['audio/mp3'], Mime::Type['audio/mpeg'] ]
    text_media_types = [ Mime::Type['application/json'], Mime::Type['text/html'],
                         Mime::Type['application/xhtml+xml'], Mime::Type['application/xml'],
                         Mime::Type['application/x-javascript'], Mime::Type['text/javascript'],
                         Mime::Type['text/x-javascript'],Mime::Type['text/x-json'] ]


    # if the format is a supported image format, locate a cached spectrogram or generate it, then stream it back.
    if image_media_types.include? final_format_requested
      full_path = FileCacher::generate_spectrogram @file_info
      send_file file_path, :stream => true, :buffer_size => 4096, :disposition => 'inline', :type => final_format_requested, :content_type => final_format_requested

    elsif audio_media_types.include? final_format_requested
      full_path = FileCacher::create_audio_segment @file_info
      send_file file_path, :stream => true, :buffer_size => 4096, :disposition => 'inline', :type => final_format_requested, :content_type => final_format_requested

    elsif text_media_types.include? final_format_requested
      respond_with @file_info

    else
      # respond with a bad request
      respond_with nil, { :head => :bad_request }
    end
  end
end