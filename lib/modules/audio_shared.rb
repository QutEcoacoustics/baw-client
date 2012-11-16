module AudioShared
  def AudioShared.run_info(executable_file, command)
    stdout_str, stderr_str, status = Open3.capture3("#{executable_file} #{command}")
    if status.exitstatus != 0
      raise
    end
    [stdout_str, stderr_str, status]
  end

  def AudioShared.run_convert(executable_file, command, target_file)
    stdout_str, stderr_str, status = Open3.capture3("#{executable_file} #{command}")

    if status.exitstatus != 0 || !File.exists?(target)

    end
    [stdout_str, stderr_str, status]
  end
end