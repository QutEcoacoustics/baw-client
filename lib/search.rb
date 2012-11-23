class Search
  # example:
  # test = Search.new( { :pre => { :created_by_id => 1 }, :body => { :project_ids => [1,2,3,4] } } )

  attr_accessor :pre_params, :body_params, :post_params

  def initialize(parameters = {})

    if parameters.include? :pre_params
      @pre_params = SearchPre.new parameters[:pre_params]
    else
      @pre_params = SearchPre.new
    end

    if parameters.include? :body_params
      @body_params = SearchBody.new parameters[:body_params]
    else
      @body_params = SearchBody.new
    end

    if parameters.include? :post_params
      @post_params = SearchPost.new parameters[:post_params]
    else
      @post_params = SearchPost.new
    end
  end

  # create a query using the state of this Search instance.
  def create_query

    if @body_params.blank?
      recordings_search = AudioRecording.scoped
    else
      recordings_search = AudioRecording.scoped

      recordings_search = recordings_search.recording_projects(@body_params.project_ids) if @body_params.project_ids
      recordings_search = recordings_search.recording_sites(@body_params.site_ids) if @body_params.site_ids
      recordings_search = recordings_search.recordings(@body_params.audio_recording_ids) if @body_params.audio_recording_ids

      recordings_search = recordings_search.recording_tags(@body_params.tags) if @body_params.tags
      recordings_search = recordings_search.recording_time_ranges(@body_params.time_ranges) if @body_params.time_ranges

      if @body_params.date_start && @body_params.date_end
        recordings_search = recordings_search.recording_within_date(@body_params.date_start, @body_params.date_end)
      elsif @body_params.date_start
        recordings_search = recordings_search.recording_within_date(@body_params.date_start,@body_params.date_start)
      elsif @body_params.date_end
        recordings_search = recordings_search.recording_within_date(@body_params.date_end,@body_params.date_end)
      end

    end

    recordings_search
  end

  # execute a query to get the dataset
  def execute_query
    the_query = create_query.select('audio_recordings.id').order('audio_recordings.recorded_date')
    results = the_query.all.collect{ |result| DataSetItem.new({ :audio_recording_id => result.id }) }
    DataSet.new({ :search => self, :query => the_query, :items => results })
  end

  class SearchPre

    attr_accessor :created_by_id, :is_temporary

    def initialize(parameters = {})
      if parameters.include? :created_by_id
        @created_by_id = parameters[:created_by_id]
      end

      if parameters.include? :is_temporary
        @is_temporary = parameters[:is_temporary]
      end
    end
  end

  class SearchBody
    # attr_accessor is a convenience method to autogenerate getters and setters
    # location (one lat/long point)
    attr_accessor :geo_latitude, :geo_longitude,
                  # these attributes are an array of ids (0 or more ids)
                  :project_ids, :site_ids, :audio_recording_ids,
                  # date range (zero or one)
                  :date_start, :date_end,
                  # time segments: array of array of start and end offsets from midnight (0 - 1440) [[start,end],[start,end]]
                  :time_ranges,
                  # tags is a hash of the tag text, to an array of the tag classes that are allowed.
                  # eg. { 'tag text' => [:sounds_like, :looks_like, :species_name, :common_name], ... }
                  :tags

    def initialize(parameters = {})
      if parameters.include? :geo_latitude
        @geo_latitude = parameters[:geo_latitude]
      end

      if parameters.include? :geo_longitude
        @geo_longitude = parameters[:geo_longitude]
      end

      if parameters.include? :project_ids
        @project_ids = parameters[:project_ids]
      end

      if parameters.include? :site_ids
        @site_ids = parameters[:site_ids]
      end

      if parameters.include? :audio_recording_ids
        @audio_recording_ids = parameters[:audio_recording_ids]
      end

      if parameters.include? :date_start
        @date_start = parameters[:date_start]
      end

      if parameters.include? :date_end
        @date_end = parameters[:date_end]
      end

      if parameters.include? :time_ranges
        @time_ranges = parameters[:time_ranges]
      end

      if parameters.include? :tags
        @tags = parameters[:tags]
      end
    end

  end

  class SearchPost

    attr_accessor :display_tags_species, :display_tags_common,
                  :display_tags_looks_like, :display_tags_sounds_like,
                  :display_tags_reference, :display_tags_auto

    def initialize(parameters = {})
      if parameters.include? :display_tags_species
        @display_tags_species = parameters[:display_tags_species]
      end

      if parameters.include? :display_tags_common
        @display_tags_common = parameters[:display_tags_common]
      end

      if parameters.include? :display_tags_looks_like
        @display_tags_looks_like = parameters[:display_tags_looks_like]
      end

      if parameters.include? :display_tags_sounds_like
        @display_tags_sounds_like = parameters[:display_tags_sounds_like]
      end

      if parameters.include? :display_tags_reference
        @display_tags_reference = parameters[:display_tags_reference]
      end

      if parameters.include? :display_tags_auto
        @display_tags_auto = parameters[:display_tags_auto]
      end
    end
  end

  class DataSet
    attr_accessor :search, :query, :items

    def initialize(parameters = {})
      if parameters.include? :search
        @search = parameters[:search]
      end

      if parameters.include? :query
        @query = parameters[:query]
      end

      if parameters.include? :items
        @items = parameters[:items]
      end
    end
  end

  class DataSetItem
    attr_accessor :audio_recording_id, :start_offset_seconds, :end_offset_seconds

    def initialize(parameters = {})
      if parameters.include? :audio_recording_id
        @audio_recording_id = parameters[:audio_recording_id]
      end

      if parameters.include? :start_offset_seconds
        @start_offset_seconds = parameters[:start_offset_seconds]
      end

      if parameters.include? :end_offset_seconds
        @end_offset_seconds = parameters[:end_offset_seconds]
      end
    end
  end
end