require 'fileutils'
require 'modules/JSON_patch'

class ExperimentsController < ApplicationController

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
        responses_file = File.join(EXPERIMENTS_SAVE_DIRECTORY,'responses.json')

        # load the existing file (if the file exists)
        if File.exists? responses_file
          responses_store = JSON.parse( IO.read(responses_file) )
        end

        # pull out the responses for each annotations, and increment the response counts
        params[:steps].each do |step|
          step[:responses].each do |annotationId, response|
            unless responses_store.keys.any? { |key| key.include? annotationId }
              # add the annotation id to the store if it is not already in there
              responses_store[annotationId] = {'no' => 0, 'yes'=> 0, 'unsure' => 0}
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

end
