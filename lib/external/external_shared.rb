require 'net/http'
require 'json'
require 'pathname'
require 'logger'

module ExternalShared
  include Exceptions, Logging

  def read_config(base_dir)

    top_dir = base_dir.gsub(%r{\\}) { "/" }

    SharedSettings.settings[:original_audio_paths] =  SharedSettings.settings[:original_audio_paths].collect{ |item| make_absolute(top_dir, item) }
    SharedSettings.settings[:cached_spectrogram_paths] =  SharedSettings.settings[:cached_spectrogram_paths].collect{ |item| make_absolute(top_dir, item) }
    SharedSettings.settings[:cached_audio_paths] = SharedSettings.settings[:cached_audio_paths].collect{ |item| make_absolute(top_dir, item) }
    SharedSettings.settings[:analysis_script_paths] = SharedSettings.settings[:analysis_script_paths].collect{ |item| make_absolute(top_dir, item) }
    SharedSettings.settings[:analysis_result_paths] = SharedSettings.settings[:analysis_result_paths].collect{ |item| make_absolute(top_dir, item) }

    SharedSettings.settings[:analysis_run_path] = make_absolute(top_dir, SharedSettings.settings[:analysis_run_path])

    logger.debug('Directories configured.')
  end

  def construct_json_post(endpoint, body)
    post_request = Net::HTTP::Post.new(endpoint)
    post_request["Content-Type"] = "application/json"
    post_request["Accept"] = "application/json"
    post_request.body = body.to_json
    post_request
  end

  def construct_login_request(email, password, endpoint)
    # set up the login HTTP post
    content = {:user => {:email => email, :password => password}}
    construct_json_post(endpoint, content)
  end

  def make_absolute(base_dir, path)
    Pathname.new(path).absolute? ? path : File.join(base_dir, path)
  end
end