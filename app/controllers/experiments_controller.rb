require 'fileutils'
require 'modules/JSON_patch'

class ExperimentsController < ApplicationController
  skip_before_filter :authenticate_user!, only: [:create]
  skip_authorization_check only: [:create]
  skip_authorize_resource only: [:create]
  skip_load_resource only: [:create]

  def index
    respond_to do |format|
      format.json { render json: [], status: :forbidden }
    end
  end

  def show
    respond_to do |format|
      format.json { render json: [], status: :forbidden }
    end
  end

  def new
    respond_to do |format|
      format.json { render json: [], status: :forbidden }
    end
  end

  EXPERIMENTS_SAVE_DIRECTORY = BawSite::Application.config.custom_experiment_path
  EXPERIMENTS_ASSETS_DIRECTORY = File.join(Rails.root, 'public', 'experiment_assets')
  RAPID_SCAN_COUNTS          = 'rapid_scan_counts.json'

  def create
    success = nil

    post_data = request.raw_post

    if post_data.blank? || !JSON.is_json?(post_data)
      success = false
    end

    if success.nil?
      FileUtils.makedirs EXPERIMENTS_SAVE_DIRECTORY
      File.open(File.join(EXPERIMENTS_SAVE_DIRECTORY, Time.now.to_f.to_s + '.json'), 'w') { |file|
        file.write post_data
      }

      success = true

      if params[:experiment] && params[:experiment] == 'Virtual bird tour experiment'

        responses_store = {}
        responses_file  = File.join(EXPERIMENTS_SAVE_DIRECTORY, 'responses.json')

        # load the existing file (if the file exists)
        if File.exists? responses_file
          responses_store = JSON.parse(IO.read(responses_file))
        end

        # pull out the responses for each annotations, and increment the response counts
        params[:steps].each do |step|
          step[:responses].each do |annotationId, response|
            unless responses_store.keys.any? { |key| key.include? annotationId }
              # add the annotation id to the store if it is not already in there
              responses_store[annotationId] = { 'no' => 0, 'yes' => 0, 'unsure' => 0 }
            end

            # increment the response count for each response given: yes, no, or unsure.
            responses_store[annotationId][response.to_s] += 1
          end
        end

        # overwrite the file

        FileUtils.makedirs EXPERIMENTS_SAVE_DIRECTORY
        File.open(responses_file, 'w') { |file|
          file.write responses_store.to_json
        }

      end

      if params[:experiment] && params[:experiment] == 'Rapid Spectrogram Scanning Experiment'


        if params[:code]
          update_rapid_scan_counts(params[:code])
        else
          raise "No code found in json packet!"
        end

      end
    end

    respond_to do |format|
      if success
        format.json { render json: [], status: :created }
      else
        format.json { render json: [], status: :unprocessable_entity }
      end
    end
  end




  def update
    respond_to do |format|
      format.json { render json: [], status: :forbidden }
    end
  end


  def destroy
    respond_to do |format|
      format.json { render json: [], status: :forbidden }
    end
  end

  private

  def update_rapid_scan_counts(code)
    # open file
    filename                                   = File.join(EXPERIMENTS_ASSETS_DIRECTORY, RAPID_SCAN_COUNTS)
    file_contents                              = File.open(filename, 'r') { |file| file.read }

    # parse JSON
    counts                                     = JSON.parse(file_contents)
    # modify JSON
    current                                    = counts[code]["count"]
    current                                    = current + 1
    counts[code]["count"] = current

    # write JSON
    json_output                                = JSON.pretty_generate(counts)

    File.open(filename, 'w') { |file| file.write json_output }

  end

end
