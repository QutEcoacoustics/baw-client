module Cache
  
  public
  
  # calculate the target file name and path based on the modification parameters
  def self.calculate_target_path(modify_parameters = {})
    #Mime::Type.lookup_by_extension(
    #QubarSite::Application.config.media_file_config
  end
  
  # check to see if a target file exists
  def self.exists(source, modify_parameters = {})
    File.exists? calculate_target_path(source, modify_parameters)
  end
  
  private
end