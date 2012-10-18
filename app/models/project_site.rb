class ProjectSite < ActiveRecord::Base
  belongs_to :site
  belongs_to :project
end