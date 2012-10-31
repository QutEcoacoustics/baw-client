require 'rubygems'
require 'uuidtools'
# http://stackoverflow.com/questions/2487837/uuids-in-rails3
# http://railsforum.com/viewtopic.php?pid=104690#p104690
module UUIDHelper
  def self.included(base)
    base.class_eval do
      before_validation_on_create :set_uuid

      def set_uuid
        self.uuid = UUID.timestamp_create.to_s
      end
    end
  end
end