class SavedSearchStoreBody
  include ActiveModel::Validations

  # attr_accessor is a convenience method to autogenerate getters and setters

  # to add later:
  #:geo_latitude, :geo_longitude, # location (one lat/long point)
  #,
  # allow multiple ids, date ranges, time ranges

  attr_accessor :audio_recording_uuid, # guid
                :audio_recording_id, :project_id, :site_id, # integer id
                :date_start, :date_end, # date range (absolute: date and time)
                :time_start, :time_end, # time range (in hours:minutes)
                :tags # array of text that will be  matched using SQL: LIKE '%'+tag_text+'%'

  def initialize(args)
    args.each do |k, v|
      instance_variable_set("@#{k}", v) unless v.nil?
    end
  end

  validates :audio_recording_id, allow_nil: true, allow_blank: true, numericality: {only_integer: true, greater_than_or_equal_to: 1}
  validates :audio_recording_uuid, allow_nil: true, allow_blank: true, length: {is: 36}

  validates :project_id, allow_nil: true, allow_blank: true, numericality: {only_integer: true, greater_than_or_equal_to: 1}
  validates :site_id, allow_nil: true, allow_blank: true, numericality: {only_integer: true, greater_than_or_equal_to: 1}

  # these are times because they need the time component of the date. Don't use DateTime.current, but do use type: datetime. Geez, this is confusing.
  # https://github.com/adzap/validates_timeliness
  validates :date_start, allow_nil: true, allow_blank: true, timeliness: {on_or_before: lambda { Time.current }, type: :datetime}
  validates :date_end, allow_nil: true, allow_blank: true, timeliness: {on_or_before: lambda { Time.current }, type: :datetime}

  validate :date_start_before_end

  validates :time_start, allow_nil: true, allow_blank: true, timeliness: {type: :time}
  validates :time_end, allow_nil: true, allow_blank: true, timeliness: {type: :time}

  validate :time_start_before_end

  validate :tags_are_strings, :is_uuid

  def date_start_before_end
    if !self.date_start.blank? && !self.date_end.blank? && self.date_start >= self.date_end
      self.errors.add(:date_start, "must be before date_end")
    end
  end

  def time_start_before_end
    if !self.time_start.blank? && !self.time_end.blank? && self.time_start >= self.time_end
      self.errors.add(:time_start, "must be before time_end")
    end
  end

  def is_uuid
    unless self.audio_recording_uuid.blank?
      begin
        UUIDTools::UUID.parse(self.audio_recording_uuid)
      rescue
        self.errors.add(:audio_recording_uuid, "must be a valid UUID, given #{self.audio_recording_uuid.class} with value #{self.audio_recording_uuid}.")
      end
    end
  end

  def tags_are_strings
    if self.tags.is_a?(Array)
      unless self.tags.blank?
        self.tags.each do |tag|
          unless tag.is_a?(String)
            self.errors.add(:tags, "#{tag} of type #{tag.class} is not valid.")
          end
        end
      end
    else
      self.errors.add(:tags, "must be an array, given #{self.tags.class} with value #{self.tags}.") unless self.tags.blank?
    end
  end

  def to_s
    self.to_json
  end
end