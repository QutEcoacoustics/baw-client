require 'FileUtils'

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
      File.open( (EXPERIMENTS_SAVE_DIRECTORY + '/' + Time.now.to_i.to_s + '.json'), 'w' ){ |file|
          file.write post_data
      }

        success = true
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
