require './lib/modules/mime'

class MediaController < ApplicationController
  include FileCacher, Mime

  #respond_to :xml, :json, :html, :png, :ogg, :oga, :webm, :webma, :mp3

  def index
    # index page for media files
    #@testing = BawSite::Application.config.media_file_config
  end

  def item
    # controller action for an individual media file

    # construct a hash of information to be returned and used for modify_parameters
    @file_info = params
    @file_info.delete 'controller'
    @file_info.delete 'action'
    #@file_info.delete 'format'

    # decide on the format requested. There are at least two ways to get the request format:
    # request.format (created based on accept mime type) and params[:format] (from the file extension in the request)

    # can't use the mime type - not reliable
    #requested_media_type = Mime::Type.lookup(request.format)
    requested_extension = params[:format]

    final_format_requested = Mime::Type.lookup_by_extension requested_extension

    image_media_types = [
        Mime::Type.lookup('image/png')
    ]

    audio_media_types = [
        Mime::Type.lookup('audio/webm'), Mime::Type.lookup('audio/webma'),
        Mime::Type.lookup('audio/ogg'), Mime::Type.lookup('audio/oga'),
        Mime::Type.lookup('audio/mp3'), Mime::Type.lookup('audio/mpeg'),
        Mime::Type.lookup('audio/wav')
        #Mime::Type.lookup('audio/x-wav')
    ]

    text_media_types = [
        Mime::Type.lookup('application/json'), Mime::Type.lookup('text/html'),
        Mime::Type.lookup('application/xhtml+xml'), Mime::Type.lookup('application/xml'),
        Mime::Type.lookup('application/x-javascript'), Mime::Type.lookup('text/javascript'),
        Mime::Type.lookup('text/x-javascript'), Mime::Type.lookup('text/x-json')
    ]

    all_media_types = []
    all_media_types.concat(image_media_types).concat(audio_media_types).concat(text_media_types)

    # if the format is a supported image format, locate a cached spectrogram or generate it, then stream it back.
    #if image_media_types.include? final_format_requested

    recording = AudioRecording.find_by_uuid(@file_info[:id])
    @file_info[:date] = recording.recorded_date.strftime "%Y%m%d"
    @file_info[:time] = recording.recorded_date.strftime "%H%M%S"
    @file_info[:original_format] = Mime::Type.file_extension_of recording.media_type
    #@file_info[:requested_media_type] = final_format_requested
    #@file_info[:requested_extension] = requested_extension
    #@file_info[:types] = text_media_types

    if image_media_types.include? final_format_requested
      full_path = FileCacher::generate_spectrogram @file_info
      download_file full_path, final_format_requested
    end

    if audio_media_types.include? final_format_requested
      full_path = FileCacher::create_audio_segment @file_info
      download_file full_path, final_format_requested
    end

    if text_media_types.include? final_format_requested
      respond_to do |format|
        format.xml {render :xml =>  @file_info}
        format.json {render :json =>  @file_info}
      end
    end

    unless all_media_types.include? final_format_requested
      # respond with a bad request
      head :bad_request
    end

  end

  def download_file(full_path, media_type)
    raise ArgumentError, "File does not exist on disk" if full_path.blank?

    send_file full_path, :stream => true, :buffer_size => 4096, :disposition => 'inline', :type => media_type, :content_type => media_type
  end

  def update
    # this action checks for new original audio recordings, and adds their information to the database

    # this is not practical for production due to the huge number of files, but can be used for development
    return head(:bad_request) unless Rails.env == 'development'

    # iterate through all original audio folders, and check that the audio recordings there are in the database
    Dir.glob("#{dir}/*").each_with_object({}) { |file, hash|  }


  end

  private

  def read_dir(dir)
    # from http://stackoverflow.com/questions/6166103/traversing-directories-and-reading-from-files-in-ruby-on-rails
    Dir.glob("#{dir}/*").each_with_object({}) do |f, h|
      if File.file?(f)
        h[f] = open(f).read
      elsif File.directory?(f)
        h[f] = read_dir(f)
      end
    end
  end
end