require 'uuidtools'

class Search
  # example:
  # test = Search.new( { :pre => { :created_by_id => 1 }, :body => { :project_ids => [1,2,3,4] } } )

  # does not store/cache results. Should it?

  attr_accessor :pre_params, :body_params, :post_params

  def initialize(parameters = {})

    if parameters.include? :pre_params
      @pre_params = SearchPre.new parameters[:pre_params]
      parameters.except!(:pre_params)
    else
      @pre_params = SearchPre.new
    end

    if parameters.include? :body_params
      @body_params = SearchBody.new parameters[:body_params]
      parameters.except!(:body_params)
    else
      @body_params = SearchBody.new
    end

    if parameters.include? :post_params
      @post_params = SearchPost.new parameters[:post_params]
      parameters.except!(:post_params)
    else
      @post_params = SearchPost.new
    end

    raise "Unexpected parameter(s) given: #{parameters.inspect}." if parameters.size > 0
  end

  # create query with deterministic ordering
  def create_query
    create_raw_query.select('audio_recordings.id, audio_recordings.uuid').order('audio_recordings.recorded_date')
  end

  # create a query using the state of this Search instance.
  def create_raw_query

    if @body_params.blank?
      recordings_search = AudioRecording.scoped
    else
      recordings_search = AudioRecording.scoped

      # these are in a specific order, from the ones that will filter the most, to those that will filter the least.
      recordings_search = recordings_search.recording_ids(@body_params.audio_recording_ids) if @body_params.audio_recording_ids
      recordings_search = recordings_search.recording_uuids(@body_params.audio_recording_uuids) if @body_params.audio_recording_uuids

      recordings_search = recordings_search.recording_projects(@body_params.project_ids) if @body_params.project_ids
      recordings_search = recordings_search.recording_sites(@body_params.site_ids) if @body_params.site_ids

      recordings_search = recordings_search.recording_tags(@body_params.tags) if @body_params.tags

      if @body_params.date_start && @body_params.date_end
        recordings_search = recordings_search.recording_within_date(@body_params.date_start, @body_params.date_end)
      elsif @body_params.date_start
        recordings_search = recordings_search.recording_within_date(@body_params.date_start, @body_params.date_start)
      elsif @body_params.date_end
        recordings_search = recordings_search.recording_within_date(@body_params.date_end, @body_params.date_end)
      end

      recordings_search = recordings_search.recording_time_ranges(@body_params.time_ranges) if @body_params.time_ranges
    end

    recordings_search
  end

  # execute a query to get the dataset
  def execute_query
    the_query = create_query

    #to do: start and end offsets
    results = the_query.all.collect { |result| DataSetItem.new({id: result.id, uuid: result.uuid}) }
    DataSet.new({:search => self, :query => the_query, :items => results})
  end
end

class SearchPre

  attr_accessor :created_by_id, :is_temporary

  def initialize(parameters = {})
    if parameters.include? :created_by_id
      @created_by_id = SearchShared::check_id(parameters[:created_by_id])
      parameters.except!(:created_by_id)
    end

    if parameters.include? :is_temporary
      @is_temporary = SearchShared::check_bool(parameters[:is_temporary])
      parameters.except!(:is_temporary)
    end

    raise "Unexpected parameter(s) given: #{parameters.inspect}." if parameters.size > 0
  end
end

class SearchBody
  # attr_accessor is a convenience method to autogenerate getters and setters
  # location (one lat/long point)
  attr_accessor :geo_latitude, :geo_longitude,
                # these attributes are an array of ids (0 or more ids)
                :project_ids, :site_ids, :audio_recording_ids, :audio_recording_uuids,
                # date range (zero or one)
                :date_start, :date_end,
                # time segments: array of array of start and end offsets from midnight (0 - 1440) [[start,end],[start,end]]
                :time_ranges,
                # tags is a hash of the tag text, to an array of the tag classes that are allowed.
                # eg. { 'tag text' => [:sounds_like, :looks_like, :species_name, :common_name], ... }
                :tags

  def initialize(parameters = {})

    if parameters.include? :geo_latitude
      @geo_latitude = SearchShared::check_decimal(parameters[:geo_latitude])
      parameters.except!(:geo_latitude)
    end

    if parameters.include? :geo_longitude
      @geo_longitude = SearchShared::check_decimal(parameters[:geo_longitude])
      parameters.except!(:geo_longitude)
    end

    if parameters.include? :project_ids
      SearchShared::check_ids(parameters[:project_ids])
      @project_ids = parameters[:project_ids]
      parameters.except!(:project_ids)
    end

    if parameters.include? :site_ids
      @site_ids = SearchShared::check_ids(parameters[:site_ids])
      parameters.except!(:site_ids)
    end

    if parameters.include? :audio_recording_ids
      @audio_recording_ids = SearchShared::check_ids(parameters[:audio_recording_ids])
      parameters.except!(:audio_recording_ids)
    end

    if parameters.include? :audio_recording_uuids
      @audio_recording_uuids = SearchShared::check_uuids(parameters[:audio_recording_uuids])
      parameters.except!(:audio_recording_uuids)
    end

    if parameters.include? :date_start
      @date_start = SearchShared::check_date(parameters[:date_start])
      parameters.except!(:date_start)
    end

    if parameters.include? :date_end
      @date_end = SearchShared::check_date(parameters[:date_end])
      if !@date_start.blank? && @date_end < @date_start
        raise ArgumentError, "Start date (#{@date_start}) must be less than end date (#{@date_end}). "
      end
      parameters.except!(:date_end)
    end

    if parameters.include? :time_ranges
      @time_ranges = SearchShared::check_time_range(parameters[:time_ranges])
      parameters.except!(:time_ranges)
    end

    if parameters.include? :tags
      @tags = parameters[:tags]
      parameters.except!(:tags)
    end

    raise "Unexpected parameter(s) given: #{parameters.inspect}." if parameters.size > 0
  end

end

class SearchPost

  attr_accessor :display_tags_species, :display_tags_common,
                :display_tags_looks_like, :display_tags_sounds_like,
                :display_tags_reference, :display_tags_auto

  def initialize(parameters = {})
    if parameters.include? :display_tags_species
      @display_tags_species = parameters[:display_tags_species]
      parameters.except!(:display_tags_species)
    end

    if parameters.include? :display_tags_common
      @display_tags_common = parameters[:display_tags_common]
      parameters.except!(:display_tags_common)
    end

    if parameters.include? :display_tags_looks_like
      @display_tags_looks_like = parameters[:display_tags_looks_like]
      parameters.except!(:display_tags_looks_like)
    end

    if parameters.include? :display_tags_sounds_like
      @display_tags_sounds_like = parameters[:display_tags_sounds_like]
      parameters.except!(:display_tags_sounds_like)
    end

    if parameters.include? :display_tags_reference
      @display_tags_reference = parameters[:display_tags_reference]
      parameters.except!(:display_tags_reference)
    end

    if parameters.include? :display_tags_auto
      @display_tags_auto = parameters[:display_tags_auto]
      parameters.except!(:display_tags_auto)
    end

    raise "Unexpected parameter(s) given: #{parameters.inspect}." if parameters.size > 0
  end
end

class DataSet
  attr_accessor :search, :query, :items

  def initialize(parameters = {})
    if parameters.include? :search
      @search = parameters[:search]
      parameters.except!(:search)
    end

    if parameters.include? :query
      @query = parameters[:query]
      parameters.except!(:query)
    end

    if parameters.include? :items
      @items = parameters[:items]
      parameters.except!(:items)
    end

    raise "Unexpected parameter(s) given: #{parameters.inspect}." if parameters.size > 0
  end
end

class DataSetItem
  attr_accessor :id, :uuid, :start_offset_seconds, :end_offset_seconds

  def initialize(parameters = {})
    if parameters.include? :id
      @id = SearchShared::check_id(parameters[:id])
      parameters.except!(:id)
    end

    if parameters.include? :uuid
      @uuid = SearchShared::check_uuid(parameters[:uuid])
      parameters.except!(:uuid)
    end

    if parameters.include? :start_offset_seconds
      @start_offset_seconds = SearchShared::check_decimal(parameters[:start_offset_seconds])
      parameters.except!(:start_offset_seconds)
    end

    if parameters.include? :end_offset_seconds
      @end_offset_seconds = SearchShared::check_decimal(parameters[:end_offset_seconds])
      parameters.except!(:end_offset_seconds)
    end

    raise "Unexpected parameter(s) given: #{parameters.inspect}." if parameters.size > 0
  end
end

class SearchShared

  def self.check_id(id)
    check_ids([id]).first
  end

  def self.check_ids(id_array)
    raise "Not an array: #{id_array.inspect}" unless id_array.kind_of?(Array)

    bad_ids = []
    id_array.uniq.select! do |item|
      if item < 1 || !item.kind_of?(Numeric)
        bad_ids.push(item)
        false
      else
        true
      end
    end

    raise ArgumentError, "Invalid ids given: #{bad_ids.inspect}" if bad_ids.size > 0
    id_array
  end

  def self.check_uuid(uuid)
    check_uuids([uuid]).first
  end

  def self.check_uuids(uuid_array)
    raise "Not an array: #{uuid_array.inspect}" unless uuid_array.kind_of?(Array)

    bad_uuids = []
    uuid_array.uniq.select! do |item|
      is_ok = true
      begin
        UUIDTools::UUID.parse(item)
      rescue ArgumentError => e
        bad_uuids.push(item)
        is_ok = false
      end
      is_ok
    end

    raise ArgumentError, "Invalid uuids given: #{bad_uuids.inspect}" if bad_uuids.size > 0
    uuid_array
  end

  def self.check_date(date)
    date
  end

  def self.check_time_range(time_range)
    time_range
  end
end