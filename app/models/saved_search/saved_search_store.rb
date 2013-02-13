class SavedSearchStore
  #http://edgeguides.rubyonrails.org/active_model_basics.html#validations
  include ActiveModel::Validations

  # example:
  # test = Search.new( { :pre => { :created_by_id => 1 }, :body => { :project_ids => [1,2,3,4] } } )

  # does not store/cache results. Should it?

  attr_accessor :pre_params, :body_params, :post_params

  def initialize(args)
    args.each do |k, v|
      instance_variable_set("@#{k}", v) unless v.nil?
    end
  end

  validate :params_are_hashes

  def params_are_hashes
    self.pre_params = SavedSearchStorePre.new(self.pre_params) if self.pre_params.is_a?(Hash)
    self.body_params = SavedSearchStoreBody.new(self.body_params) if self.body_params.is_a?(Hash)
    self.post_params = SavedSearchStorePost.new(self.post_params) if self.post_params.is_a?(Hash)

    self.errors.add(:pre_params, "must be a SavedSearchPre, given #{self.pre_params.class} with value #{self.pre_params}.") unless self.pre_params.is_a?(SavedSearchStorePre) || self.pre_params.blank?
    self.errors.add(:body_params, "must be a SavedSearchBody, given #{self.body_params.class} with value #{self.body_params}.") unless self.body_params.is_a?(SavedSearchStoreBody) || self.body_params.blank?
    self.errors.add(:post_params, "must be a SavedSearchPost, given #{self.post_params.class} with value #{self.post_params}.") unless self.post_params.is_a?(SavedSearchStorePost) || self.post_params.blank?
  end

  # create query with deterministic ordering
  def create_query
    create_raw_query.select('audio_recordings.id, audio_recordings.uuid').order('audio_recordings.recorded_date')
  end

  # create a query using the state of this Search instance.
  def create_raw_query

    recordings_search = AudioRecording.scoped

    if self.invalid?
      raise ArgumentError, "SavedSearchStore has errors: #{self.errors.to_json}."
    end

    unless self.pre_params.blank?
      if self.pre_params.invalid?
        raise ArgumentError, "SavedSearchStorePre has errors: #{self.pre_params.errors.to_json}."
      end
    end

    unless self.body_params.blank?

      if self.body_params.invalid?
        raise ArgumentError, "SavedSearchStoreBody has errors: #{self.body_params.errors.to_json}."
      end

      # these are in a specific order, from the ones that will filter the most, to those that will filter the least.
      recordings_search = recordings_search.recording_ids(self.body_params.audio_recording_id) if self.body_params.audio_recording_id
      recordings_search = recordings_search.recording_uuids(self.body_params.audio_recording_uuid) if self.body_params.audio_recording_uuid

      recordings_search = recordings_search.recording_projects(self.body_params.project_id) if  self.body_params.project_id
      recordings_search = recordings_search.recording_sites(self.body_params.site_id) if  self.body_params.site_id

      if  self.body_params.date_start && self.body_params.date_end
        recordings_search = recordings_search.recording_within_date(self.body_params.date_start, self.body_params.date_end)
      elsif self.body_params.date_start
        recordings_search = recordings_search.recording_within_date(self.body_params.date_start, self.body_params.date_start)
      elsif self.body_params.date_end
        recordings_search = recordings_search.recording_within_date(self.body_params.date_end, self.body_params.date_end)
      end

      if self.body_params.time_start && self.body_params.time_end
        recordings_search = recordings_search.recording_within_time(self.body_params.time_start, self.body_params.time_end)
      elsif self.body_params.time_start
        recordings_search = recordings_search.recording_within_time(self.body_params.time_start, self.body_params.time_start)
      elsif self.body_params.time_end
        recordings_search = recordings_search.recording_within_time(self.body_params.time_end, self.body_params.time_end)
      end

      recordings_search = recordings_search.recording_tags(self.body_params.tags) if self.body_params.tags
    end


    unless self.post_params.blank?
      if self.post_params.invalid?
        raise ArgumentError, "SavedSearchStorePost has errors: #{self.post_params.errors}."
      end
    end

    recordings_search
  end

  # execute a query to get the dataset
  def execute_query
    the_query = create_query

    #to do: start and end offsets
    results = the_query.all.collect { |result|
      the_result = {id: result.id, uuid: result.uuid, start_offset_seconds: nil, end_offset_seconds: nil}
      OpenStruct.new(the_result)
    }
    to_return = {:search => self, :query => the_query, :items => results}
    OpenStruct.new(to_return)
  end
end