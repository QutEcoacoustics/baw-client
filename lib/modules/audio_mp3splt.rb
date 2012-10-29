module AudioMp3splt
  include OS
  @mp3splt_path = if OS.windows? then "./vendor/bin/mp3splt/windows/mp3splt.exe" else "mp3splt" end

  # public methods
  public

  def self.info_mp3splt(source)
    [ [], [] ]
  end

  # @param [file path] source
  # @param [file path] target
  # @param [hash] modify_parameters
  def self.modify_mp3splt(source, target, modify_parameters = {})
    raise ArgumentError, "Source is not a mp3 file: #{File.basename(source)}" unless source.match(/\.mp3$/)
    raise ArgumentError, "Target is not a mp3 file: : #{File.basename(target)}" unless target.match(/\.mp3$/)
    raise ArgumentError, "Source does not exist: #{File.basename(source)}" unless File.exists? source
    raise ArgumentError, "Target exists: #{File.basename(target)}" unless !File.exists? source


  end
end